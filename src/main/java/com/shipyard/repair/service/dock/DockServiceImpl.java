package com.shipyard.repair.service.dock;

import com.shipyard.repair.dto.dock.CreateDockRequest;
import com.shipyard.repair.dto.dock.DockResponse;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Shipyard;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.mapper.dock.DockMapper;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.ShipyardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DockServiceImpl implements DockService {

    private final DockMapper dockMapper;
    private final DockRepository dockRepository;
    private final ShipyardRepository shipyardRepository;

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
    public void deleteDock(Integer id) {
        if  (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (!dockRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND);
        }

        dockRepository.deleteById(id);
    }
}
