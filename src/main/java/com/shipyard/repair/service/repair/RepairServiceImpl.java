package com.shipyard.repair.service.repair;

import com.shipyard.repair.dto.repair.CreateRepairRequest;
import com.shipyard.repair.dto.repair.RepairResponse;
import com.shipyard.repair.dto.repair.UpdateRepairRequest;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.RepairRequestStatus;
import com.shipyard.repair.enums.RepairStatus;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.RepairRepository;
import com.shipyard.repair.repository.RepairRequestRepository;
import com.shipyard.repair.repository.UserRepository;
import com.shipyard.repair.repository.WorkItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RepairServiceImpl implements RepairService {

    private final RepairRepository repairRepository;
    private final RepairRequestRepository repairRequestRepository;
    private final DockRepository dockRepository;
    private final UserRepository userRepository;
    private final WorkItemRepository workItemRepository;

    @Override
    public List<RepairResponse> getRepairs(Integer dockId, Integer repairRequestId, RepairStatus status, Integer operatorId) {
        Optional<User> currentUser = resolveCurrentUser();
        return applyRoleScope(selectRepairs(dockId, repairRequestId, status, operatorId), currentUser).stream()
                .filter(r -> dockId == null || r.getDock().getId() == dockId)
                .filter(r -> repairRequestId == null || r.getRepairRequest().getId() == repairRequestId)
                .filter(r -> status == null || r.getStatus() == status)
                .filter(r -> operatorId == null || r.getOperator() != null && r.getOperator().getId() == operatorId)
                .map(this::toResponse)
                .toList();
    }

    public List<RepairResponse> getRepairs(Integer dockId, Integer repairRequestId, RepairStatus status) {
        return getRepairs(dockId, repairRequestId, status, null);
    }

    private List<Repair> selectRepairs(Integer dockId, Integer repairRequestId, RepairStatus status, Integer operatorId) {
        if (dockId != null) {
            return repairRepository.findByDockId(dockId);
        }
        if (repairRequestId != null) {
            return repairRepository.findByRepairRequestId(repairRequestId);
        }
        if (status != null) {
            return repairRepository.findByStatus(status);
        }
        if (operatorId != null) {
            return repairRepository.findByOperatorId(operatorId);
        }
        return repairRepository.findAll();
    }

    @Override
    public RepairResponse getRepairById(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        Repair repair = repairRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_NOT_FOUND));
        if (!hasAccessToRepair(repair, resolveCurrentUser())) {
            throw new ResourceNotFoundException(ErrorCode.REPAIR_NOT_FOUND);
        }
        return toResponse(repair);
    }

    @Override
    @Transactional
    public RepairResponse createRepair(CreateRepairRequest request) {
        RepairRequest repairRequest = repairRequestRepository.findById(request.repairRequestId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
        Dock dock = dockRepository.findById(request.dockId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND));
        ensureCanMutateRepair(dock);
        User operator = resolveOperator(request.operatorId());

        Repair repair = new Repair();
        applyRequest(repair, request.status(), request.actualStartDate(),
                request.actualEndDate(), request.progressPercentage(), request.totalCost(), request.notes(),
                repairRequest, dock, operator);
        Repair saved = repairRepository.save(repair);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RepairResponse updateRepair(Integer id, UpdateRepairRequest request) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        Repair existing = repairRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_NOT_FOUND));
        ensureCanMutateRepair(existing.getDock());
        RepairRequest repairRequest = repairRequestRepository.findById(request.repairRequestId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
        Dock dock = dockRepository.findById(request.dockId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND));
        ensureCanMutateRepair(dock);
        User operator = resolveOperator(request.operatorId());

        applyRequest(existing, request.status(), request.actualStartDate(),
                request.actualEndDate(), request.progressPercentage(), request.totalCost(), request.notes(),
                repairRequest, dock, operator);
        Repair saved = repairRepository.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RepairResponse updateStatus(Integer id, RepairStatus status) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        Repair existing = repairRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_NOT_FOUND));
        ensureCanMutateRepair(existing.getDock());
        existing.setStatus(status);
        Repair saved = repairRepository.save(existing);
        syncRequestStatusWithRepair(saved);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RepairResponse updateOperator(Integer id, Integer operatorId) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        Repair existing = repairRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_NOT_FOUND));
        ensureCanMutateRepair(existing.getDock());
        existing.setOperator(resolveOperator(operatorId));
        Repair saved = repairRepository.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteRepair(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (!repairRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.REPAIR_NOT_FOUND);
        }
        Repair existing = repairRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_NOT_FOUND));
        ensureCanMutateRepair(existing.getDock());
        repairRepository.deleteById(id);
    }

    private void applyRequest(
            Repair repair,
            RepairStatus status,
            java.time.LocalDate actualStartDate,
            java.time.LocalDate actualEndDate,
            Integer progressPercentage,
            java.math.BigDecimal totalCost,
            String notes,
            RepairRequest repairRequest,
            Dock dock,
            User operator
    ) {
        repair.setRepairRequest(repairRequest);
        repair.setDock(dock);
        repair.setOperator(operator);
        repair.setStatus(status == null ? RepairStatus.SCHEDULED : status);
        repair.setActualStartDate(actualStartDate);
        repair.setActualEndDate(actualEndDate);
        repair.setProgressPercentage(progressPercentage == null ? 0 : progressPercentage);
        repair.setTotalCost(totalCost);
        repair.setNotes(notes);
    }

    private User resolveOperator(Integer operatorId) {
        if (operatorId == null) {
            return null;
        }
        User operator = userRepository.findById(operatorId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        if (operator.getRole() != UserRole.OPERATOR) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        return operator;
    }

    private RepairResponse toResponse(Repair repair) {
        return new RepairResponse(
                repair.getId(),
                repair.getRepairRequest().getId(),
                repair.getDock().getId(),
                repair.getDock().getName(),
                repair.getOperator() == null ? null : repair.getOperator().getId(),
                toFullName(repair.getOperator()),
                repair.getStatus(),
                repair.getActualStartDate(),
                repair.getActualEndDate(),
                repair.getProgressPercentage(),
                repair.getTotalCost(),
                repair.getNotes(),
                repair.getCreatedAt(),
                repair.getUpdatedAt()
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

    private List<Repair> applyRoleScope(List<Repair> source, Optional<User> maybeUser) {
        if (maybeUser.isEmpty()) {
            return source;
        }
        User user = maybeUser.get();
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.DISPATCHER) {
            return source;
        }
        return source.stream()
                .filter(repair -> hasAccessToRepair(repair, maybeUser))
                .toList();
    }

    private boolean hasAccessToRepair(Repair repair, Optional<User> maybeUser) {
        if (maybeUser.isEmpty()) {
            return true;
        }
        User user = maybeUser.get();
        UserRole role = user.getRole();

        if (role == UserRole.ADMIN || role == UserRole.DISPATCHER) {
            return true;
        }
        if (role == UserRole.CLIENT) {
            return repair.getRepairRequest() != null
                    && repair.getRepairRequest().getClient() != null
                    && repair.getRepairRequest().getClient().getId() == user.getId();
        }
        if (role == UserRole.OPERATOR) {
            if (repair.getOperator() != null && repair.getOperator().getId() == user.getId()) {
                return true;
            }
            return user.getDock() != null
                    && repair.getDock() != null
                    && repair.getDock().getId() == user.getDock().getId();
        }
        if (role == UserRole.MASTER || role == UserRole.WORKER) {
            if (role == UserRole.WORKER) {
                return workItemRepository.findByRepairId(repair.getId()).stream()
                        .anyMatch(item -> item.getAssignee() != null && item.getAssignee().getId() == user.getId());
            }
            return user.getDock() != null
                    && repair.getDock() != null
                    && repair.getDock().getId() == user.getDock().getId();
        }
        return false;
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

    private void ensureCanMutateRepair(Dock targetDock) {
        Optional<User> maybeUser = resolveCurrentUser();
        if (maybeUser.isEmpty()) {
            return;
        }
        User user = maybeUser.get();
        UserRole role = user.getRole();
        if (role == UserRole.ADMIN || role == UserRole.DISPATCHER) {
            return;
        }
        if ((role == UserRole.OPERATOR || role == UserRole.MASTER)
                && user.getDock() != null
                && targetDock != null
                && user.getDock().getId() == targetDock.getId()) {
            return;
        }
        throw new AccessDeniedException("Access denied");
    }
}
