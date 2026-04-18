package com.shipyard.repair.service.workitem;

import com.shipyard.repair.dto.workitem.CreateWorkItemRequest;
import com.shipyard.repair.dto.workitem.UpdateWorkItemRequest;
import com.shipyard.repair.dto.workitem.WorkItemResponse;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.entity.WorkItem;
import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.WorkItemStatus;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.RepairRepository;
import com.shipyard.repair.repository.RepairRequestRepository;
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

    @Override
    public List<WorkItemResponse> getWorkItems(
            Integer repairRequestId,
            Integer repairId,
            WorkCategory category,
            WorkItemStatus status
    ) {
        if (repairRequestId != null && repairId != null) {
            return workItemRepository.findAll().stream()
                    .filter(item -> item.getRepairRequest().getId() == repairRequestId && item.getRepair() != null && item.getRepair().getId() == repairId)
                    .filter(item -> category == null || item.getCategory() == category)
                    .filter(item -> status == null || item.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
        if (repairRequestId != null) {
            return workItemRepository.findByRepairRequestId(repairRequestId).stream()
                    .filter(item -> category == null || item.getCategory() == category)
                    .filter(item -> status == null || item.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
        if (repairId != null) {
            return workItemRepository.findByRepairId(repairId).stream()
                    .filter(item -> category == null || item.getCategory() == category)
                    .filter(item -> status == null || item.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
        if (category != null && status != null) {
            return workItemRepository.findByCategory(category).stream()
                    .filter(item -> item.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
        if (category != null) {
            return workItemRepository.findByCategory(category).stream().map(this::toResponse).toList();
        }
        if (status != null) {
            return workItemRepository.findByStatus(status).stream().map(this::toResponse).toList();
        }
        return workItemRepository.findAll().stream().map(this::toResponse).toList();
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
        validateRepairBelongsToRequest(repairRequest, repair);

        WorkItem workItem = new WorkItem();
        applyRequest(workItem, request.category(), request.name(), request.description(), request.status(),
                request.estimatedHours(), request.actualHours(), request.isMandatory(), request.isDiscovered(),
                request.notes(), repairRequest, repair);
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
        validateRepairBelongsToRequest(repairRequest, repair);

        applyRequest(existing, request.category(), request.name(), request.description(), request.status(),
                request.estimatedHours(), request.actualHours(), request.isMandatory(), request.isDiscovered(),
                request.notes(), repairRequest, repair);
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
            RepairRequest repairRequest,
            Repair repair
    ) {
        workItem.setRepairRequest(repairRequest);
        workItem.setRepair(repair);
        workItem.setCategory(category);
        workItem.setName(name);
        workItem.setDescription(description);
        workItem.setStatus(status == null ? WorkItemStatus.PENDING : status);
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
                workItem.getCreatedAt(),
                workItem.getUpdatedAt()
        );
    }
}
