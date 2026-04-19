package com.shipyard.repair.service.dock;

import com.shipyard.repair.dto.dock.CreateDockRequest;
import com.shipyard.repair.dto.dock.DockScheduleItemResponse;
import com.shipyard.repair.dto.dock.DockResponse;
import com.shipyard.repair.dto.dock.UpdateDockRequest;
import com.shipyard.repair.embeddable.DockDimensions;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.Shipyard;
import com.shipyard.repair.enums.RepairStatus;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.mapper.dock.DockMapper;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.RepairRepository;
import com.shipyard.repair.repository.ShipyardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DockServiceImpl implements DockService {

    private final DockMapper dockMapper;
    private final DockRepository dockRepository;
    private final ShipyardRepository shipyardRepository;
    private final RepairRepository repairRepository;

    @Override
    public List<DockResponse> getDocks() {
        return dockRepository.findAll().stream()
                .map(dockMapper::toDto)
                .toList();
    }

    @Override
    public DockResponse getDock(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }

        return dockRepository.findById(id).
                map(dockMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND)
        );
    }

    @Override
    @Transactional
    public DockResponse createDock(CreateDockRequest request) {
        Shipyard shipyard = shipyardRepository.findById(request.shipyardId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHIPYARD_NOT_FOUND));

        Dock dock = dockMapper.toEntity(request);
        dock.setShipyard(shipyard);
        Dock savedDock = dockRepository.save(dock);

        return dockMapper.toDto(savedDock);
    }

    @Override
    @Transactional
    public DockResponse updateDock(Integer id, UpdateDockRequest request) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }

        Dock dock = dockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND));
        Shipyard shipyard = shipyardRepository.findById(request.shipyardId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHIPYARD_NOT_FOUND));

        DockDimensions dimensions = new DockDimensions();
        dimensions.setMaxLength(request.dimensions().maxLength());
        dimensions.setMaxWidth(request.dimensions().maxWidth());
        dimensions.setMaxDraft(request.dimensions().maxDraft());

        dock.setName(request.name());
        dock.setDimensions(dimensions);
        dock.setStatus(request.status());
        dock.setShipyard(shipyard);

        Dock savedDock = dockRepository.save(dock);
        return dockMapper.toDto(savedDock);
    }

    @Override
    public List<DockScheduleItemResponse> getDockSchedule(Integer id, LocalDate startDate, LocalDate endDate) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (!dockRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND);
        }

        LocalDate normalizedStart = startDate == null ? LocalDate.MIN : startDate;
        LocalDate normalizedEnd = endDate == null ? LocalDate.MAX : endDate;

        return repairRepository.findByDockId(id).stream()
                .filter(repair -> {
                    LocalDate repairStart = resolveStartDate(repair);
                    LocalDate repairEnd = resolveEndDate(repair);
                    return !repairEnd.isBefore(normalizedStart) && !repairStart.isAfter(normalizedEnd);
                })
                .map(repair -> new DockScheduleItemResponse(
                        repair.getId(),
                        repair.getRepairRequest().getId(),
                        repair.getRepairRequest().getShip().getName(),
                        repair.getStatus(),
                        resolveStartDate(repair),
                        resolveEndDate(repair),
                        repair.getProgressPercentage()
                ))
                .toList();
    }

    @Override
    public Integer getDockLoad(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (!dockRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND);
        }

        int activeRepairs = (int) repairRepository.findByDockId(id).stream()
                .filter(repair -> repair.getStatus() == RepairStatus.STARTED || repair.getStatus() == RepairStatus.IN_PROGRESS || repair.getStatus() == RepairStatus.QA)
                .count();
        int maxConcurrentRepairs = 3;
        int loadPercent = (int) Math.round((activeRepairs * 100.0) / maxConcurrentRepairs);
        return Math.min(loadPercent, 100);
    }


    @Override
    @Transactional
    public void deleteDock(Integer id) {
        if  (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (!dockRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND);
        }

        dockRepository.deleteById(id);
    }

    private LocalDate resolveStartDate(Repair repair) {
        if (repair.getActualStartDate() != null) {
            return repair.getActualStartDate();
        }
        if (repair.getRepairRequest().getScheduledStartDate() != null) {
            return repair.getRepairRequest().getScheduledStartDate();
        }
        if (repair.getRepairRequest().getRequestedStartDate() != null) {
            return repair.getRepairRequest().getRequestedStartDate();
        }
        return LocalDate.now();
    }

    private LocalDate resolveEndDate(Repair repair) {
        if (repair.getActualEndDate() != null) {
            return repair.getActualEndDate();
        }
        if (repair.getRepairRequest().getScheduledEndDate() != null) {
            return repair.getRepairRequest().getScheduledEndDate();
        }
        if (repair.getRepairRequest().getRequestedEndDate() != null) {
            return repair.getRepairRequest().getRequestedEndDate();
        }
        return resolveStartDate(repair);
    }
}
