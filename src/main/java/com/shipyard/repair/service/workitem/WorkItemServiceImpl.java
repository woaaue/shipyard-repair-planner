package com.shipyard.repair.service.workitem;

import com.shipyard.repair.dto.workitem.CreateWorkItemRequest;
import com.shipyard.repair.dto.workitem.UpdateWorkItemRequest;
import com.shipyard.repair.dto.workitem.WorkItemResponse;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.entity.WorkItem;
import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.enums.WorkItemReviewStatus;
import com.shipyard.repair.enums.WorkItemStatus;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.RepairRepository;
import com.shipyard.repair.repository.RepairRequestRepository;
import com.shipyard.repair.repository.UserRepository;
import com.shipyard.repair.repository.WorkItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkItemServiceImpl implements WorkItemService {

    private final WorkItemRepository workItemRepository;
    private final RepairRequestRepository repairRequestRepository;
    private final RepairRepository repairRepository;
    private final UserRepository userRepository;

    @Override
    public List<WorkItemResponse> getWorkItems(
            Integer repairRequestId,
            Integer repairId,
            WorkCategory category,
            WorkItemStatus status,
            Integer assigneeId,
            WorkItemReviewStatus reviewStatus
    ) {
        return selectWorkItems(repairRequestId, repairId, category, status, assigneeId, reviewStatus).stream()
                .filter(item -> repairRequestId == null || item.getRepairRequest().getId() == repairRequestId)
                .filter(item -> repairId == null || item.getRepair() != null && item.getRepair().getId() == repairId)
                .filter(item -> category == null || item.getCategory() == category)
                .filter(item -> status == null || item.getStatus() == status)
                .filter(item -> assigneeId == null || item.getAssignee() != null && item.getAssignee().getId() == assigneeId)
                .filter(item -> reviewStatus == null || item.getReviewStatus() == reviewStatus)
                .map(this::toResponse)
                .toList();
    }

    public List<WorkItemResponse> getWorkItems(
            Integer repairRequestId,
            Integer repairId,
            WorkCategory category,
            WorkItemStatus status
    ) {
        return getWorkItems(repairRequestId, repairId, category, status, null, null);
    }

    private List<WorkItem> selectWorkItems(
            Integer repairRequestId,
            Integer repairId,
            WorkCategory category,
            WorkItemStatus status,
            Integer assigneeId,
            WorkItemReviewStatus reviewStatus
    ) {
        if (repairRequestId != null) {
            return workItemRepository.findByRepairRequestId(repairRequestId);
        }
        if (repairId != null) {
            return workItemRepository.findByRepairId(repairId);
        }
        if (assigneeId != null) {
            return workItemRepository.findByAssigneeId(assigneeId);
        }
        if (category != null) {
            return workItemRepository.findByCategory(category);
        }
        if (status != null) {
            return workItemRepository.findByStatus(status);
        }
        if (reviewStatus != null) {
            return workItemRepository.findByReviewStatus(reviewStatus);
        }
        return workItemRepository.findAll();
    }

    @Override
    public WorkItemResponse getWorkItemById(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        WorkItem workItem = workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.WORK_ITEM_NOT_FOUND));
        return toResponse(workItem);
    }

    @Override
    @Transactional
    public WorkItemResponse createWorkItem(CreateWorkItemRequest request) {
        RepairRequest repairRequest = repairRequestRepository.findById(request.repairRequestId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
        Repair repair = resolveRepair(request.repairId());
        User assignee = resolveAssignee(request.assigneeId());
        validateRepairBelongsToRequest(repairRequest, repair);

        WorkItem workItem = new WorkItem();
        applyRequest(workItem, request.category(), request.name(), request.description(), request.status(),
                request.estimatedHours(), request.actualHours(), request.isMandatory(), request.isDiscovered(),
                request.notes(), request.reviewStatus(), repairRequest, repair, assignee);
        WorkItem saved = workItemRepository.save(workItem);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public WorkItemResponse updateWorkItem(Integer id, UpdateWorkItemRequest request) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        WorkItem existing = workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.WORK_ITEM_NOT_FOUND));
        RepairRequest repairRequest = repairRequestRepository.findById(request.repairRequestId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
        Repair repair = resolveRepair(request.repairId());
        User assignee = resolveAssignee(request.assigneeId());
        validateRepairBelongsToRequest(repairRequest, repair);

        applyRequest(existing, request.category(), request.name(), request.description(), request.status(),
                request.estimatedHours(), request.actualHours(), request.isMandatory(), request.isDiscovered(),
                request.notes(), request.reviewStatus(), repairRequest, repair, assignee);
        WorkItem saved = workItemRepository.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public WorkItemResponse updateStatus(Integer id, WorkItemStatus status) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        WorkItem existing = workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.WORK_ITEM_NOT_FOUND));
        existing.setStatus(status);
        if (status == WorkItemStatus.COMPLETED && existing.getReviewStatus() != WorkItemReviewStatus.APPROVED) {
            existing.setReviewStatus(WorkItemReviewStatus.PENDING_REVIEW);
        }
        WorkItem saved = workItemRepository.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public WorkItemResponse updateAssignee(Integer id, Integer assigneeId) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        WorkItem existing = workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.WORK_ITEM_NOT_FOUND));
        existing.setAssignee(resolveAssignee(assigneeId));
        WorkItem saved = workItemRepository.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public WorkItemResponse updateReviewStatus(Integer id, WorkItemReviewStatus reviewStatus) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (reviewStatus == null) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        WorkItem existing = workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.WORK_ITEM_NOT_FOUND));
        existing.setReviewStatus(reviewStatus);
        if (reviewStatus == WorkItemReviewStatus.APPROVED) {
            existing.setStatus(WorkItemStatus.COMPLETED);
        } else if (reviewStatus == WorkItemReviewStatus.REJECTED) {
            existing.setStatus(WorkItemStatus.IN_PROGRESS);
        }
        WorkItem saved = workItemRepository.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteWorkItem(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (!workItemRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.WORK_ITEM_NOT_FOUND);
        }
        workItemRepository.deleteById(id);
    }

    private Repair resolveRepair(Integer repairId) {
        if (repairId == null) {
            return null;
        }
        return repairRepository.findById(repairId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_NOT_FOUND));
    }

    private User resolveAssignee(Integer assigneeId) {
        if (assigneeId == null) {
            return null;
        }
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        if (assignee.getRole() != UserRole.WORKER) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        return assignee;
    }

    private void validateRepairBelongsToRequest(RepairRequest repairRequest, Repair repair) {
        if (repair != null && (repair.getRepairRequest() == null || repair.getRepairRequest().getId() != repairRequest.getId())) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
    }

    private void applyRequest(
            WorkItem workItem,
            WorkCategory category,
            String name,
            String description,
            WorkItemStatus status,
            Integer estimatedHours,
            Integer actualHours,
            Boolean isMandatory,
            Boolean isDiscovered,
            String notes,
            WorkItemReviewStatus reviewStatus,
            RepairRequest repairRequest,
            Repair repair,
            User assignee
    ) {
        workItem.setRepairRequest(repairRequest);
        workItem.setRepair(repair);
        workItem.setAssignee(assignee);
        workItem.setCategory(category);
        workItem.setName(name);
        workItem.setDescription(description);
        workItem.setStatus(status == null ? WorkItemStatus.PENDING : status);
        workItem.setReviewStatus(reviewStatus == null ? WorkItemReviewStatus.NOT_SUBMITTED : reviewStatus);
        workItem.setEstimatedHours(estimatedHours == null ? 0 : estimatedHours);
        workItem.setActualHours(actualHours == null ? 0 : actualHours);
        workItem.setMandatory(isMandatory != null && isMandatory);
        workItem.setDiscovered(isDiscovered != null && isDiscovered);
        workItem.setNotes(notes);
    }

    private WorkItemResponse toResponse(WorkItem workItem) {
        return new WorkItemResponse(
                workItem.getId(),
                workItem.getRepairRequest().getId(),
                workItem.getRepair() == null ? null : workItem.getRepair().getId(),
                workItem.getCategory(),
                workItem.getName(),
                workItem.getDescription(),
                workItem.getStatus(),
                workItem.getEstimatedHours(),
                workItem.getActualHours(),
                workItem.isMandatory(),
                workItem.isDiscovered(),
                workItem.getNotes(),
                workItem.getAssignee() == null ? null : workItem.getAssignee().getId(),
                toFullName(workItem.getAssignee()),
                workItem.getReviewStatus() == null ? WorkItemReviewStatus.NOT_SUBMITTED : workItem.getReviewStatus(),
                workItem.getCreatedAt(),
                workItem.getUpdatedAt()
        );
    }

    private String toFullName(User user) {
        if (user == null) {
            return null;
        }
        String patronymic = user.getPatronymic() == null || user.getPatronymic().isBlank()
                ? ""
                : " " + user.getPatronymic();
        return (user.getLastName() + " " + user.getFirstName() + patronymic).trim();
    }
}
