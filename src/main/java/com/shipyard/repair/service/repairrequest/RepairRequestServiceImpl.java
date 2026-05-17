package com.shipyard.repair.service.repairrequest;

import com.shipyard.repair.dto.repairrequest.CreateRepairRequest;
import com.shipyard.repair.dto.repairrequest.RepairRequestResponse;
import com.shipyard.repair.dto.repairrequest.UpdateRepairRequest;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.entity.Ship;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.entity.WorkItem;
import com.shipyard.repair.enums.RepairRequestStatus;
import com.shipyard.repair.enums.RepairStatus;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.WorkItemReviewStatus;
import com.shipyard.repair.enums.WorkItemStatus;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.RepairRepository;
import com.shipyard.repair.repository.RepairRequestRepository;
import com.shipyard.repair.repository.ShipRepository;
import com.shipyard.repair.repository.UserRepository;
import com.shipyard.repair.repository.WorkItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RepairRequestServiceImpl implements RepairRequestService {

    private final RepairRequestRepository repairRequestRepository;
    private final ShipRepository shipRepository;
    private final UserRepository userRepository;
    private final DockRepository dockRepository;
    private final RepairRepository repairRepository;
    private final WorkItemRepository workItemRepository;

    @Override
    public List<RepairRequestResponse> getRepairRequests(Integer clientId, Integer shipId, RepairRequestStatus status) {
        Optional<User> currentUser = resolveCurrentUser();
        if (clientId != null && shipId != null) {
            return applyRoleScope(repairRequestRepository.findAll(), currentUser).stream()
                    .filter(rr -> rr.getClient().getId() == clientId && rr.getShip().getId() == shipId)
                    .filter(rr -> status == null || rr.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
        if (clientId != null) {
            return applyRoleScope(repairRequestRepository.findByClientId(clientId), currentUser).stream()
                    .filter(rr -> status == null || rr.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
        if (shipId != null) {
            return applyRoleScope(repairRequestRepository.findByShipId(shipId), currentUser).stream()
                    .filter(rr -> status == null || rr.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
        if (status != null) {
            return applyRoleScope(repairRequestRepository.findByStatus(status), currentUser).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return applyRoleScope(repairRequestRepository.findAll(), currentUser).stream().map(this::toResponse).toList();
    }

    @Override
    public RepairRequestResponse getRepairRequestById(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        RepairRequest repairRequest = repairRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
        Optional<User> currentUser = resolveCurrentUser();
        if (!hasAccessToRequest(repairRequest, currentUser)) {
            throw new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND);
        }
        return toResponse(repairRequest);
    }

    @Override
    @Transactional
    public RepairRequestResponse createRepairRequest(CreateRepairRequest request) {
        Ship ship = shipRepository.findById(request.shipId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHIP_NOT_FOUND));
        User client = userRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        RepairRequest repairRequest = new RepairRequest();
        applyRequest(repairRequest, request.shipId(), request.clientId(), request.requestedStartDate(), request.requestedEndDate(),
                request.scheduledStartDate(), request.scheduledEndDate(), request.estimatedDurationDays(), request.contingencyDays(),
                request.actualDurationDays(), request.totalCost(), request.description(), request.notes(), request.status(),
                ship, client);

        RepairRequest saved = repairRequestRepository.save(repairRequest);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RepairRequestResponse updateRepairRequest(Integer id, UpdateRepairRequest request) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        RepairRequest existing = repairRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
        if (existing.getStatus() != RepairRequestStatus.DRAFT) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }

        Ship ship = shipRepository.findById(request.shipId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHIP_NOT_FOUND));
        User client = userRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        applyRequest(existing, request.shipId(), request.clientId(), request.requestedStartDate(), request.requestedEndDate(),
                request.scheduledStartDate(), request.scheduledEndDate(), request.estimatedDurationDays(), request.contingencyDays(),
                request.actualDurationDays(), request.totalCost(), request.description(), request.notes(), request.status(),
                ship, client);

        RepairRequest saved = repairRequestRepository.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RepairRequestResponse updateStatus(Integer id, RepairRequestStatus status, Integer assignedDockId, String rejectionReason, String rejectionNote) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (status == null) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        RepairRequest existing = repairRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));

        if (status == RepairRequestStatus.UNDER_REVIEW && existing.getStatus() != RepairRequestStatus.SUBMITTED) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }

        if (status == RepairRequestStatus.APPROVED) {
            if (assignedDockId == null) {
                throw new BadRequestException(ErrorCode.BAD_REQUEST);
            }
            Dock dock = dockRepository.findById(assignedDockId)
                    .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND));
            User operator = resolveOperatorForDock(dock.getId());

            existing.setAssignedDock(dock);
            existing.setAssignedOperator(operator);
            existing.setRejectionReason(null);
            existing.setRejectionNote(null);
            existing.setStatus(RepairRequestStatus.APPROVED);

            Repair savedRepair = createRepairForApprovedRequest(existing, dock, operator);
            createStarterWorkItems(existing, savedRepair);
        } else if (status == RepairRequestStatus.REJECTED) {
            if (rejectionReason == null || rejectionReason.isBlank()) {
                throw new BadRequestException(ErrorCode.BAD_REQUEST);
            }
            existing.setRejectionReason(rejectionReason.trim());
            existing.setRejectionNote(rejectionNote == null ? null : rejectionNote.trim());
            existing.setStatus(RepairRequestStatus.REJECTED);
            existing.setAssignedDock(null);
            existing.setAssignedOperator(null);
        } else {
            existing.setStatus(status);
        }

        RepairRequest saved = repairRequestRepository.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RepairRequestResponse acceptByClient(Integer id, String clientEmail, String note) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (clientEmail == null || clientEmail.isBlank()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }

        RepairRequest existing = repairRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));

        User client = userRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (existing.getClient() == null || existing.getClient().getId() != client.getId()) {
            throw new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND);
        }

        if (existing.getStatus() == RepairRequestStatus.CLIENT_ACCEPTED) {
            existing.setClientAcceptanceNote(note);
            RepairRequest saved = repairRequestRepository.save(existing);
            return toResponse(saved);
        }

        if (existing.getStatus() != RepairRequestStatus.COMPLETED) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }

        existing.setClientAccepted(true);
        existing.setClientAcceptedAt(LocalDateTime.now());
        existing.setClientAcceptanceNote(note);
        existing.setStatus(RepairRequestStatus.CLIENT_ACCEPTED);

        RepairRequest saved = repairRequestRepository.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RepairRequestResponse resubmitByClient(Integer id, String clientEmail, String note) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (clientEmail == null || clientEmail.isBlank()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }

        RepairRequest existing = repairRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));

        User client = userRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (existing.getClient() == null || existing.getClient().getId() != client.getId()) {
            throw new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND);
        }
        if (existing.getStatus() != RepairRequestStatus.REJECTED) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }

        existing.setStatus(RepairRequestStatus.SUBMITTED);
        existing.setRejectionReason(null);
        existing.setRejectionNote(null);
        existing.setAssignedDock(null);
        existing.setAssignedOperator(null);
        existing.setClientAccepted(false);
        existing.setClientAcceptedAt(null);
        existing.setClientAcceptanceNote(null);

        if (note != null && !note.isBlank()) {
            String previousNotes = existing.getNotes() == null ? "" : existing.getNotes().trim();
            String resubmitNote = "Повторная подача: " + note.trim();
            existing.setNotes(previousNotes.isBlank() ? resubmitNote : previousNotes + "\n" + resubmitNote);
        }

        RepairRequest saved = repairRequestRepository.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteRepairRequest(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (!repairRequestRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND);
        }
        repairRequestRepository.deleteById(id);
    }

    private void applyRequest(
            RepairRequest repairRequest,
            Integer shipId,
            Integer clientId,
            java.time.LocalDate requestedStartDate,
            java.time.LocalDate requestedEndDate,
            java.time.LocalDate scheduledStartDate,
            java.time.LocalDate scheduledEndDate,
            Integer estimatedDurationDays,
            Integer contingencyDays,
            Integer actualDurationDays,
            java.math.BigDecimal totalCost,
            String description,
            String notes,
            RepairRequestStatus status,
            Ship ship,
            User client
    ) {
        repairRequest.setShip(ship);
        repairRequest.setClient(client);
        repairRequest.setRequestedStartDate(requestedStartDate);
        repairRequest.setRequestedEndDate(requestedEndDate);
        repairRequest.setScheduledStartDate(scheduledStartDate);
        repairRequest.setScheduledEndDate(scheduledEndDate);
        repairRequest.setEstimatedDurationDays(estimatedDurationDays == null ? 1 : estimatedDurationDays);
        repairRequest.setContingencyDays(contingencyDays == null ? 0 : contingencyDays);
        repairRequest.setActualDurationDays(actualDurationDays == null ? 0 : actualDurationDays);
        repairRequest.setTotalCost(totalCost);
        repairRequest.setDescription(description);
        repairRequest.setNotes(notes);
        repairRequest.setStatus(status == null ? RepairRequestStatus.DRAFT : status);
    }

    private User resolveOperatorForDock(Integer dockId) {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.OPERATOR)
                .filter(user -> user.getDock() != null && user.getDock().getId() == dockId)
                .findFirst()
                .orElseThrow(() -> new BadRequestException(ErrorCode.DOCK_HAS_NO_OPERATOR));
    }

    private Repair createRepairForApprovedRequest(RepairRequest repairRequest, Dock dock, User operator) {
        Repair existingRepair = repairRepository.findByRepairRequestId(repairRequest.getId())
                .stream()
                .findFirst()
                .orElse(null);
        if (existingRepair != null) {
            existingRepair.setDock(dock);
            existingRepair.setOperator(operator);
            if (existingRepair.getStatus() == null) {
                existingRepair.setStatus(RepairStatus.SCHEDULED);
            }
            if (existingRepair.getTotalCost() == null) {
                existingRepair.setTotalCost(repairRequest.getTotalCost());
            }
            if (existingRepair.getNotes() == null || existingRepair.getNotes().isBlank()) {
                existingRepair.setNotes("Автоматически создано из заявки #" + repairRequest.getId());
            }
            return repairRepository.save(existingRepair);
        }

        Repair repair = new Repair();
        repair.setRepairRequest(repairRequest);
        repair.setDock(dock);
        repair.setOperator(operator);
        repair.setStatus(RepairStatus.SCHEDULED);
        repair.setActualStartDate(null);
        repair.setActualEndDate(null);
        repair.setProgressPercentage(0);
        repair.setTotalCost(repairRequest.getTotalCost());
        repair.setNotes("Автоматически создано из заявки #" + repairRequest.getId());
        return repairRepository.save(repair);
    }

    private void createStarterWorkItems(RepairRequest repairRequest, Repair repair) {
        WorkItem inspection = new WorkItem();
        inspection.setRepairRequest(repairRequest);
        inspection.setRepair(repair);
        inspection.setAssignee(null);
        inspection.setCategory(WorkCategory.SAFETY);
        inspection.setName("Первичный осмотр");
        inspection.setDescription("Проверка состояния судна и фиксация дефектов.");
        inspection.setStatus(WorkItemStatus.PENDING);
        inspection.setReviewStatus(WorkItemReviewStatus.NOT_SUBMITTED);
        inspection.setEstimatedHours(2);
        inspection.setActualHours(0);
        inspection.setMandatory(true);
        inspection.setDiscovered(false);
        inspection.setNotes("Создано автоматически при одобрении заявки.");

        WorkItem diagnostics = new WorkItem();
        diagnostics.setRepairRequest(repairRequest);
        diagnostics.setRepair(repair);
        diagnostics.setAssignee(null);
        diagnostics.setCategory(WorkCategory.MECHANICAL);
        diagnostics.setName("Дефектовка");
        diagnostics.setDescription("Уточнение состава работ и подготовка ремонтного плана.");
        diagnostics.setStatus(WorkItemStatus.PENDING);
        diagnostics.setReviewStatus(WorkItemReviewStatus.NOT_SUBMITTED);
        diagnostics.setEstimatedHours(4);
        diagnostics.setActualHours(0);
        diagnostics.setMandatory(true);
        diagnostics.setDiscovered(false);
        diagnostics.setNotes("Создано автоматически при одобрении заявки.");

        workItemRepository.save(inspection);
        workItemRepository.save(diagnostics);
    }

    private RepairRequestResponse toResponse(RepairRequest repairRequest) {
        return new RepairRequestResponse(
                repairRequest.getId(),
                repairRequest.getShip().getId(),
                repairRequest.getShip().getName(),
                repairRequest.getClient().getId(),
                buildClientName(repairRequest.getClient()),
                repairRequest.getAssignedDock() == null ? null : repairRequest.getAssignedDock().getId(),
                repairRequest.getAssignedDock() == null ? null : repairRequest.getAssignedDock().getName(),
                repairRequest.getAssignedOperator() == null ? null : repairRequest.getAssignedOperator().getId(),
                repairRequest.getAssignedOperator() == null ? null : buildClientName(repairRequest.getAssignedOperator()),
                repairRequest.getStatus(),
                repairRequest.getRequestedStartDate(),
                repairRequest.getRequestedEndDate(),
                repairRequest.getScheduledStartDate(),
                repairRequest.getScheduledEndDate(),
                repairRequest.getEstimatedDurationDays(),
                repairRequest.getContingencyDays(),
                repairRequest.getActualDurationDays(),
                repairRequest.getTotalCost(),
                repairRequest.getDescription(),
                repairRequest.getNotes(),
                repairRequest.getRejectionReason(),
                repairRequest.getRejectionNote(),
                repairRequest.isClientAccepted(),
                repairRequest.getClientAcceptedAt(),
                repairRequest.getClientAcceptanceNote(),
                repairRequest.getCreatedAt(),
                repairRequest.getUpdatedAt()
        );
    }

    private String buildClientName(User user) {
        return (user.getLastName() + " " + user.getFirstName() + (user.getPatronymic() == null ? "" : " " + user.getPatronymic())).trim();
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
        String email = authentication.getName();
        return userRepository.findByEmail(email);
    }

    private List<RepairRequest> applyRoleScope(List<RepairRequest> source, Optional<User> maybeUser) {
        if (maybeUser.isEmpty()) {
            return source;
        }
        User user = maybeUser.get();
        UserRole role = user.getRole();
        if (role == UserRole.ADMIN || role == UserRole.DISPATCHER) {
            return source;
        }
        return source.stream()
                .filter(request -> hasAccessToRequest(request, maybeUser))
                .toList();
    }

    private boolean hasAccessToRequest(RepairRequest request, Optional<User> maybeUser) {
        if (maybeUser.isEmpty()) {
            return true;
        }
        User user = maybeUser.get();
        UserRole role = user.getRole();

        if (role == UserRole.ADMIN || role == UserRole.DISPATCHER) {
            return true;
        }
        if (role == UserRole.CLIENT) {
            return request.getClient() != null && request.getClient().getId() == user.getId();
        }
        if (role == UserRole.OPERATOR) {
            if (request.getAssignedOperator() != null && request.getAssignedOperator().getId() == user.getId()) {
                return true;
            }
            return user.getDock() != null
                    && request.getAssignedDock() != null
                    && request.getAssignedDock().getId() == user.getDock().getId();
        }
        if (role == UserRole.MASTER || role == UserRole.WORKER) {
            if (role == UserRole.WORKER) {
                return workItemRepository.findByRepairRequestId(request.getId()).stream()
                        .anyMatch(item -> item.getAssignee() != null && item.getAssignee().getId() == user.getId());
            }
            return user.getDock() != null
                    && request.getAssignedDock() != null
                    && request.getAssignedDock().getId() == user.getDock().getId();
        }
        return false;
    }
}
