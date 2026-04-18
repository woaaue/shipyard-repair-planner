package com.shipyard.repair.service.repairrequest;

import com.shipyard.repair.dto.repairrequest.CreateRepairRequest;
import com.shipyard.repair.dto.repairrequest.RepairRequestResponse;
import com.shipyard.repair.dto.repairrequest.UpdateRepairRequest;
import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.entity.Ship;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.RepairRequestStatus;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.RepairRequestRepository;
import com.shipyard.repair.repository.ShipRepository;
import com.shipyard.repair.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RepairRequestServiceImpl implements RepairRequestService {

    private final RepairRequestRepository repairRequestRepository;
    private final ShipRepository shipRepository;
    private final UserRepository userRepository;

    @Override
    public List<RepairRequestResponse> getRepairRequests(Integer clientId, Integer shipId, RepairRequestStatus status) {
        if (clientId != null && shipId != null) {
            return repairRequestRepository.findAll().stream()
                    .filter(rr -> rr.getClient().getId() == clientId && rr.getShip().getId() == shipId)
                    .filter(rr -> status == null || rr.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
        if (clientId != null) {
            return repairRequestRepository.findByClientId(clientId).stream()
                    .filter(rr -> status == null || rr.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
        if (shipId != null) {
            return repairRequestRepository.findByShipId(shipId).stream()
                    .filter(rr -> status == null || rr.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
        if (status != null) {
            return repairRequestRepository.findByStatus(status).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return repairRequestRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public RepairRequestResponse getRepairRequestById(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        RepairRequest repairRequest = repairRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
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
    public RepairRequestResponse updateStatus(Integer id, RepairRequestStatus status) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        RepairRequest existing = repairRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
        existing.setStatus(status);
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

    private RepairRequestResponse toResponse(RepairRequest repairRequest) {
        return new RepairRequestResponse(
                repairRequest.getId(),
                repairRequest.getShip().getId(),
                repairRequest.getShip().getName(),
                repairRequest.getClient().getId(),
                buildClientName(repairRequest.getClient()),
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
                repairRequest.getCreatedAt(),
                repairRequest.getUpdatedAt()
        );
    }

    private String buildClientName(User user) {
        return (user.getLastName() + " " + user.getFirstName() + (user.getPatronymic() == null ? "" : " " + user.getPatronymic())).trim();
    }
}
