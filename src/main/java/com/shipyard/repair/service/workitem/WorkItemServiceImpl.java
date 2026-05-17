package com.shipyard.repair.service.workitem;

import com.shipyard.repair.dto.workitem.CreateWorkItemRequest;
import com.shipyard.repair.dto.workitem.UpdateWorkItemRequest;
import com.shipyard.repair.dto.workitem.WorkItemResponse;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.entity.WorkItem;
import com.shipyard.repair.enums.RepairRequestStatus;
import com.shipyard.repair.enums.RepairStatus;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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
        Optional<User> currentUser = resolveCurrentUser();
        return applyRoleScope(selectWorkItems(repairRequestId, repairId, category, status, assigneeId, reviewStatus), currentUser).stream()
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
        if (!hasAccessToWorkItem(workItem, resolveCurrentUser())) {
            throw new ResourceNotFoundException(ErrorCode.WORK_ITEM_NOT_FOUND);
        }
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
        ensureCanManageWorkItems(repairRequest);

        WorkItem workItem = new WorkItem();
        applyRequest(workItem, request.category(), request.name(), request.description(), request.status(),
                request.estimatedHours(), request.actualHours(), request.isMandatory(), request.isDiscovered(),
                request.notes(), request.reviewStatus(), repairRequest, repair, assignee);
        WorkItem saved = workItemRepository.save(workItem);
        recalculateRepairProgress(saved.getRepair());
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
        ensureCanManageWorkItems(existing);
        Repair previousRepair = existing.getRepair();
        RepairRequest repairRequest = repairRequestRepository.findById(request.repairRequestId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
        Repair repair = resolveRepair(request.repairId());
        User assignee = resolveAssignee(request.assigneeId());
        validateRepairBelongsToRequest(repairRequest, repair);

        applyRequest(existing, request.category(), request.name(), request.description(), request.status(),
                request.estimatedHours(), request.actualHours(), request.isMandatory(), request.isDiscovered(),
                request.notes(), request.reviewStatus(), repairRequest, repair, assignee);
        WorkItem saved = workItemRepository.save(existing);
        recalculateRepairProgress(previousRepair);
        recalculateRepairProgress(saved.getRepair());
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
        ensureCanUpdateStatus(existing);
        existing.setStatus(status);
        if (status == WorkItemStatus.COMPLETED && existing.getReviewStatus() != WorkItemReviewStatus.APPROVED) {
            existing.setReviewStatus(WorkItemReviewStatus.PENDING_REVIEW);
        }
        WorkItem saved = workItemRepository.save(existing);
        recalculateRepairProgress(saved.getRepair());
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
        ensureCanManageWorkItems(existing);
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
        ensureCanManageWorkItems(existing);
        existing.setReviewStatus(reviewStatus);
        if (reviewStatus == WorkItemReviewStatus.APPROVED) {
            existing.setStatus(WorkItemStatus.COMPLETED);
        } else if (reviewStatus == WorkItemReviewStatus.REJECTED) {
            existing.setStatus(WorkItemStatus.IN_PROGRESS);
        }
        WorkItem saved = workItemRepository.save(existing);
        recalculateRepairProgress(saved.getRepair());
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
        WorkItem existing = workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.WORK_ITEM_NOT_FOUND));
        ensureCanManageWorkItems(existing);
        Repair repair = existing.getRepair();
        workItemRepository.deleteById(id);
        recalculateRepairProgress(repair);
    }

    private void recalculateRepairProgress(Repair repair) {
        if (repair == null) {
            return;
        }

        List<WorkItem> items = workItemRepository.findByRepairId(repair.getId());
        int total = items.size();
        int completed = (int) items.stream()
                .filter(item -> item.getStatus() == WorkItemStatus.COMPLETED)
                .count();
        int approved = (int) items.stream()
                .filter(item -> item.getReviewStatus() == WorkItemReviewStatus.APPROVED)
                .count();
        boolean hasWorkStarted = items.stream().anyMatch(item ->
                item.getStatus() == WorkItemStatus.IN_PROGRESS
                        || item.getStatus() == WorkItemStatus.COMPLETED
                        || item.getReviewStatus() != WorkItemReviewStatus.NOT_SUBMITTED
        );
        boolean allTasksApproved = total > 0 && approved == total;

        int progress = total == 0 ? 0 : Math.round((completed * 100.0f) / total);
        repair.setProgressPercentage(progress);
        if (repair.getStatus() != RepairStatus.CANCELLED) {
            if (allTasksApproved) {
                repair.setStatus(RepairStatus.COMPLETED);
            } else if (hasWorkStarted) {
                repair.setStatus(RepairStatus.IN_PROGRESS);
            } else {
                repair.setStatus(RepairStatus.SCHEDULED);
            }
        }
        repairRepository.save(repair);
        syncRequestStatusWithRepair(repair);
    }

    private void syncRequestStatusWithRepair(Repair repair) {
        RepairRequest request = repair.getRepairRequest();
        if (request == null) {
            return;
        }

        RepairRequestStatus current = request.getStatus();
        if (current == RepairRequestStatus.REJECTED
                || current == RepairRequestStatus.CANCELLED
                || current == RepairRequestStatus.CLIENT_ACCEPTED) {
            return;
        }

        RepairRequestStatus target = current;
        if (repair.getStatus() == RepairStatus.COMPLETED) {
            target = RepairRequestStatus.COMPLETED;
        } else if (repair.getStatus() == RepairStatus.IN_PROGRESS || repair.getStatus() == RepairStatus.STARTED) {
            target = RepairRequestStatus.IN_PROGRESS;
        } else if (repair.getStatus() == RepairStatus.SCHEDULED && current != RepairRequestStatus.APPROVED) {
            target = RepairRequestStatus.APPROVED;
        }

        if (target != current) {
            request.setStatus(target);
            repairRequestRepository.save(request);
        }
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

    private Optional<User> resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof String principalString && "anonymousUser".equals(principalString)) {
            return Optional.empty();
        }
        return userRepository.findByEmail(authentication.getName());
    }

    private List<WorkItem> applyRoleScope(List<WorkItem> source, Optional<User> maybeUser) {
        if (maybeUser.isEmpty()) {
            return source;
        }
        User user = maybeUser.get();
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.DISPATCHER) {
            return source;
        }
        return source.stream()
                .filter(item -> hasAccessToWorkItem(item, maybeUser))
                .toList();
    }

    private boolean hasAccessToWorkItem(WorkItem item, Optional<User> maybeUser) {
        if (maybeUser.isEmpty()) {
            return true;
        }
        User user = maybeUser.get();
        UserRole role = user.getRole();

        if (role == UserRole.ADMIN || role == UserRole.DISPATCHER) {
            return true;
        }
        if (role == UserRole.CLIENT) {
            return item.getRepairRequest() != null
                    && item.getRepairRequest().getClient() != null
                    && item.getRepairRequest().getClient().getId() == user.getId();
        }
        if (role == UserRole.WORKER) {
            return item.getAssignee() != null && item.getAssignee().getId() == user.getId();
        }
        if (role == UserRole.OPERATOR) {
            if (item.getRepairRequest() != null
                    && item.getRepairRequest().getAssignedOperator() != null
                    && item.getRepairRequest().getAssignedOperator().getId() == user.getId()) {
                return true;
            }
            return user.getDock() != null
                    && item.getRepairRequest() != null
                    && item.getRepairRequest().getAssignedDock() != null
                    && item.getRepairRequest().getAssignedDock().getId() == user.getDock().getId();
        }
        if (role == UserRole.MASTER) {
            return user.getDock() != null
                    && item.getRepairRequest() != null
                    && item.getRepairRequest().getAssignedDock() != null
                    && item.getRepairRequest().getAssignedDock().getId() == user.getDock().getId();
        }
        return false;
    }

    private void ensureCanManageWorkItems(RepairRequest request) {
        Optional<User> maybeUser = resolveCurrentUser();
        if (maybeUser.isEmpty()) {
            return;
        }
        User user = maybeUser.get();
        UserRole role = user.getRole();
        if (role == UserRole.ADMIN || role == UserRole.DISPATCHER) {
            return;
        }
        if (role == UserRole.OPERATOR || role == UserRole.MASTER) {
            if (user.getDock() != null
                    && request.getAssignedDock() != null
                    && user.getDock().getId() == request.getAssignedDock().getId()) {
                return;
            }
        }
        throw new AccessDeniedException("Access denied");
    }

    private void ensureCanManageWorkItems(WorkItem item) {
        ensureCanManageWorkItems(item.getRepairRequest());
    }

    private void ensureCanUpdateStatus(WorkItem item) {
        Optional<User> maybeUser = resolveCurrentUser();
        if (maybeUser.isEmpty()) {
            return;
        }
        User user = maybeUser.get();
        UserRole role = user.getRole();
        if (role == UserRole.WORKER) {
            if (item.getAssignee() != null && item.getAssignee().getId() == user.getId()) {
                return;
            }
            throw new AccessDeniedException("Access denied");
        }
        ensureCanManageWorkItems(item);
    }
}
