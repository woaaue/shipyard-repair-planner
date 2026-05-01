package com.shipyard.repair.service.repair;

import com.shipyard.repair.dto.repair.CreateRepairRequest;
import com.shipyard.repair.dto.repair.RepairResponse;
import com.shipyard.repair.dto.repair.UpdateRepairRequest;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.RepairStatus;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.RepairRepository;
import com.shipyard.repair.repository.RepairRequestRepository;
import com.shipyard.repair.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RepairServiceImpl implements RepairService {

    private final RepairRepository repairRepository;
    private final RepairRequestRepository repairRequestRepository;
    private final DockRepository dockRepository;
    private final UserRepository userRepository;

    @Override
    public List<RepairResponse> getRepairs(Integer dockId, Integer repairRequestId, RepairStatus status, Integer operatorId) {
        return selectRepairs(dockId, repairRequestId, status, operatorId).stream()
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
        return toResponse(repair);
    }

    @Override
    @Transactional
    public RepairResponse createRepair(CreateRepairRequest request) {
        RepairRequest repairRequest = repairRequestRepository.findById(request.repairRequestId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
        Dock dock = dockRepository.findById(request.dockId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND));
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
        RepairRequest repairRequest = repairRequestRepository.findById(request.repairRequestId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_REQUEST_NOT_FOUND));
        Dock dock = dockRepository.findById(request.dockId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND));
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
        existing.setStatus(status);
        Repair saved = repairRepository.save(existing);
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
}
