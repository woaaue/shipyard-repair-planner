package com.shipyard.repair.service.ship;

import com.shipyard.repair.dto.ship.CreateShipRequest;
import com.shipyard.repair.dto.ship.ShipDimensionsResponse;
import com.shipyard.repair.dto.ship.ShipResponse;
import com.shipyard.repair.dto.ship.UpdateShipRequest;
import com.shipyard.repair.embeddable.ShipDimensions;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Ship;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.ShipStatus;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.DuplicateResourceException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.ShipRepository;
import com.shipyard.repair.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShipServiceImpl implements ShipService {

    private final ShipRepository shipRepository;
    private final UserRepository userRepository;
    private final DockRepository dockRepository;

    @Override
    public List<ShipResponse> getShips(String search, ShipStatus status) {
        List<Ship> ships = status == null ? shipRepository.findAll() : shipRepository.findByShipStatus(status);
        if (search == null || search.isBlank()) {
            return ships.stream().map(this::toResponse).toList();
        }

        String normalizedSearch = search.toLowerCase(Locale.ROOT);
        return ships.stream()
                .filter(ship ->
                        ship.getName().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                                || ship.getRegNumber().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                                || buildOwnerName(ship.getUser()).toLowerCase(Locale.ROOT).contains(normalizedSearch)
                )
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ShipResponse getShipById(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }

        Ship ship = shipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHIP_NOT_FOUND));
        return toResponse(ship);
    }

    @Override
    @Transactional
    public ShipResponse createShip(CreateShipRequest request) {
        if (shipRepository.findByRegNumber(request.regNumber()).isPresent()) {
            throw new DuplicateResourceException(ErrorCode.SHIP_ALREADY_EXISTS);
        }

        User owner = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        Dock dock = resolveDock(request.dockId());

        Ship ship = new Ship();
        applyRequest(ship, request.regNumber(), request.name(), request.shipType(), request.shipStatus(), request.shipDimensions(), owner, dock);
        Ship savedShip = shipRepository.save(ship);
        return toResponse(savedShip);
    }

    @Override
    @Transactional
    public ShipResponse updateShip(Integer id, UpdateShipRequest request) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }

        Ship existingShip = shipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHIP_NOT_FOUND));

        shipRepository.findByRegNumber(request.regNumber())
                .filter(ship -> ship.getId() != id)
                .ifPresent(ship -> {
                    throw new DuplicateResourceException(ErrorCode.SHIP_ALREADY_EXISTS);
                });

        User owner = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        Dock dock = resolveDock(request.dockId());

        applyRequest(existingShip, request.regNumber(), request.name(), request.shipType(), request.shipStatus(), request.shipDimensions(), owner, dock);
        Ship savedShip = shipRepository.save(existingShip);
        return toResponse(savedShip);
    }

    @Override
    @Transactional
    public void deleteShip(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (!shipRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.SHIP_NOT_FOUND);
        }
        shipRepository.deleteById(id);
    }

    private Dock resolveDock(Integer dockId) {
        if (dockId == null) {
            return null;
        }
        return dockRepository.findById(dockId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND));
    }

    private void applyRequest(
            Ship ship,
            String regNumber,
            String name,
            com.shipyard.repair.enums.ShipType shipType,
            ShipStatus shipStatus,
            com.shipyard.repair.dto.ship.ShipDimensionsRequest dimensionsRequest,
            User owner,
            Dock dock
    ) {
        ShipDimensions dimensions = new ShipDimensions();
        dimensions.setMaxLength(dimensionsRequest.maxLength());
        dimensions.setMaxWidth(dimensionsRequest.maxWidth());
        dimensions.setMaxDraft(dimensionsRequest.maxDraft());

        ship.setRegNumber(regNumber);
        ship.setName(name);
        ship.setShipType(shipType);
        ship.setShipStatus(shipStatus);
        ship.setShipDimensions(dimensions);
        ship.setUser(owner);
        ship.setDock(dock);
    }

    private ShipResponse toResponse(Ship ship) {
        return new ShipResponse(
                ship.getId(),
                ship.getRegNumber(),
                ship.getName(),
                ship.getShipType(),
                ship.getShipStatus(),
                new ShipDimensionsResponse(
                        ship.getShipDimensions().getMaxLength(),
                        ship.getShipDimensions().getMaxWidth(),
                        ship.getShipDimensions().getMaxDraft()
                ),
                ship.getUser().getId(),
                buildOwnerName(ship.getUser()),
                ship.getDock() == null ? null : ship.getDock().getId(),
                ship.getDock() == null ? null : ship.getDock().getName(),
                ship.getCreatedAt(),
                ship.getUpdatedAt()
        );
    }

    private String buildOwnerName(User user) {
        return (user.getLastName() + " " + user.getFirstName() + (user.getPatronymic() == null ? "" : " " + user.getPatronymic())).trim();
    }
}
