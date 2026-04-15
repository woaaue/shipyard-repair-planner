package com.shipyard.repair.service.shipyard;

import com.shipyard.repair.dto.shipyard.CreateShipyardRequest;
import com.shipyard.repair.dto.shipyard.ShipyardResponse;
import com.shipyard.repair.entity.Shipyard;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.DuplicateResourceException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.mapper.shipyard.ShipyardMapper;
import com.shipyard.repair.repository.ShipyardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShipyardServiceImpl implements ShipyardService {

    private final ShipyardMapper shipyardMapper;
    private final ShipyardRepository shipyardRepository;

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
    public void deleteShipyard(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }

        if (!shipyardRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.SHIPYARD_NOT_FOUND);
        }

        shipyardRepository.deleteById(id);
    }
}
