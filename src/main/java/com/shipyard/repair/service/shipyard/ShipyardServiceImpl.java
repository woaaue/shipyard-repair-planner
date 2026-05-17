package com.shipyard.repair.service.shipyard;

import com.shipyard.repair.dto.shipyard.CreateShipyardRequest;
import com.shipyard.repair.dto.shipyard.ShipyardResponse;
import com.shipyard.repair.dto.shipyard.UpdateShipyardRequest;
import com.shipyard.repair.embeddable.ShipyardAddress;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.Shipyard;
import com.shipyard.repair.enums.DockStatus;
import com.shipyard.repair.enums.RepairStatus;
import com.shipyard.repair.enums.ShipyardStatus;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.DuplicateResourceException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.mapper.shipyard.ShipyardMapper;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.RepairRepository;
import com.shipyard.repair.repository.ShipyardRepository;
import com.shipyard.repair.service.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShipyardServiceImpl implements ShipyardService {

    private final ShipyardMapper shipyardMapper;
    private final ShipyardRepository shipyardRepository;
    private final DockRepository dockRepository;
    private final RepairRepository repairRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<ShipyardResponse> getShipyards() {
        return shipyardRepository.findAll().stream()
                .map(shipyardMapper::toDto)
                .toList();
    }

    @Override
    public ShipyardResponse getShipyard(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }

        return shipyardRepository.findById(id)
                .map(shipyardMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHIPYARD_NOT_FOUND)
        );
    }

    @Override
    @Transactional
    public ShipyardResponse createShipyard(CreateShipyardRequest createShipyardRequest) {
        if (shipyardRepository.existsByName(createShipyardRequest.name())) {
            throw new DuplicateResourceException(ErrorCode.SHIPYARD_ALREADY_EXISTS);
        }

        Shipyard shipyard = shipyardMapper.toEntity(createShipyardRequest);
        Shipyard savedShipyard = shipyardRepository.save(shipyard);

        return shipyardMapper.toDto(savedShipyard);
    }

    @Override
    @Transactional
    public ShipyardResponse updateShipyard(Integer id, UpdateShipyardRequest updateShipyardRequest) {
        Shipyard shipyard = getShipyardEntityOrThrow(id);
        String oldName = shipyard.getName();
        ShipyardStatus oldStatus = shipyard.getStatus();
        ShipyardAddress oldAddress = shipyard.getShipyardAddress();
        validateShipyardNameUniqueness(updateShipyardRequest.name(), id);
        validateShipyardDeactivation(id, shipyard.getStatus(), updateShipyardRequest.status());

        ShipyardAddress address = new ShipyardAddress();
        address.setCity(updateShipyardRequest.shipyardAddress().city());
        address.setStreet(updateShipyardRequest.shipyardAddress().street());
        address.setPostalCode(updateShipyardRequest.shipyardAddress().postalCode());

        shipyard.setName(updateShipyardRequest.name());
        shipyard.setShipyardAddress(address);
        shipyard.setStatus(updateShipyardRequest.status());

        Shipyard updatedShipyard = shipyardRepository.save(shipyard);
        String action = oldStatus != updateShipyardRequest.status() ? "STATUS_CHANGE" : "UPDATE";
        auditLogService.log(
                action,
                "SHIPYARD",
                updatedShipyard.getId(),
                buildShipyardUpdateDetails(oldName, oldStatus, oldAddress, updateShipyardRequest)
        );
        return shipyardMapper.toDto(updatedShipyard);
    }

    @Override
    @Transactional
    public ShipyardResponse updateShipyardStatus(Integer id, ShipyardStatus status) {
        Shipyard shipyard = getShipyardEntityOrThrow(id);
        ShipyardStatus oldStatus = shipyard.getStatus();
        validateShipyardDeactivation(id, shipyard.getStatus(), status);
        shipyard.setStatus(status);
        Shipyard savedShipyard = shipyardRepository.save(shipyard);
        auditLogService.log(
                "STATUS_CHANGE",
                "SHIPYARD",
                savedShipyard.getId(),
                "oldStatus=" + oldStatus + "; newStatus=" + status
        );
        return shipyardMapper.toDto(savedShipyard);
    }

    private boolean isShipyardDeactivation(ShipyardStatus currentStatus, ShipyardStatus targetStatus) {
        return currentStatus == ShipyardStatus.ACTIVE && targetStatus != ShipyardStatus.ACTIVE;
    }

    private Shipyard getShipyardEntityOrThrow(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        return shipyardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHIPYARD_NOT_FOUND));
    }

    private void validateShipyardNameUniqueness(String name, Integer id) {
        if (shipyardRepository.existsByNameAndIdNot(name, id)) {
            throw new DuplicateResourceException(ErrorCode.SHIPYARD_ALREADY_EXISTS);
        }
    }

    private void validateShipyardDeactivation(Integer shipyardId, ShipyardStatus currentStatus, ShipyardStatus targetStatus) {
        if (!isShipyardDeactivation(currentStatus, targetStatus)) {
            return;
        }

        List<Dock> shipyardDocks = dockRepository.findByShipyardId(shipyardId);
        long activeDocksCount = shipyardDocks.stream()
                .filter(dock -> isActiveDockStatus(dock.getStatus()))
                .count();
        if (activeDocksCount > 0) {
            throw new BadRequestException(
                    ErrorCode.SHIPYARD_DEACTIVATION_HAS_ACTIVE_DOCKS,
                    new Object[]{activeDocksCount}
            );
        }

        int activeRepairsCount = shipyardDocks.stream()
                .mapToInt(dock -> countActiveRepairs(dock.getId()))
                .sum();
        if (activeRepairsCount > 0) {
            throw new BadRequestException(
                    ErrorCode.SHIPYARD_DEACTIVATION_HAS_ACTIVE_REPAIRS,
                    new Object[]{activeRepairsCount}
            );
        }
    }

    private boolean isActiveDockStatus(DockStatus dockStatus) {
        return dockStatus == DockStatus.AVAILABLE || dockStatus == DockStatus.OCCUPIED;
    }

    private int countActiveRepairs(Integer dockId) {
        return repairRepository.findByDockId(dockId).stream()
                .map(Repair::getStatus)
                .filter(this::isActiveRepairStatus)
                .mapToInt(status -> 1)
                .sum();
    }

    private boolean isActiveRepairStatus(RepairStatus status) {
        return status != RepairStatus.COMPLETED && status != RepairStatus.CANCELLED;
    }

    private String buildShipyardUpdateDetails(
            String oldName,
            ShipyardStatus oldStatus,
            ShipyardAddress oldAddress,
            UpdateShipyardRequest request
    ) {
        String oldCity = oldAddress == null ? null : oldAddress.getCity();
        String oldStreet = oldAddress == null ? null : oldAddress.getStreet();
        String oldPostalCode = oldAddress == null ? null : oldAddress.getPostalCode();

        StringBuilder details = new StringBuilder();
        appendChange(details, "name", oldName, request.name());
        appendChange(details, "status", oldStatus, request.status());
        appendChange(details, "city", oldCity, request.shipyardAddress().city());
        appendChange(details, "street", oldStreet, request.shipyardAddress().street());
        appendChange(details, "postalCode", oldPostalCode, request.shipyardAddress().postalCode());
        String value = details.toString();
        return value.isBlank() ? "no_changes" : value;
    }

    private void appendChange(StringBuilder details, String field, Object oldValue, Object newValue) {
        if (Objects.equals(oldValue, newValue)) {
            return;
        }
        if (details.length() > 0) {
            details.append("; ");
        }
        details.append(field)
                .append(":")
                .append(oldValue == null ? "null" : oldValue)
                .append("->")
                .append(newValue == null ? "null" : newValue);
    }
}
