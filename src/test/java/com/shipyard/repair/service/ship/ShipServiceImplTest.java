package com.shipyard.repair.service.ship;

import com.shipyard.repair.dto.ship.CreateShipRequest;
import com.shipyard.repair.dto.ship.ShipDimensionsRequest;
import com.shipyard.repair.dto.ship.ShipResponse;
import com.shipyard.repair.dto.ship.UpdateShipRequest;
import com.shipyard.repair.embeddable.ShipDimensions;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Ship;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.ShipStatus;
import com.shipyard.repair.enums.ShipType;
import com.shipyard.repair.exception.DuplicateResourceException;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.ShipRepository;
import com.shipyard.repair.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShipServiceImplTest {

    @Mock
    private ShipRepository shipRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DockRepository dockRepository;

    @InjectMocks
    private ShipServiceImpl shipService;

    @Test
    void getShips_ReturnsMappedResults() {
        Ship ship = buildShip(1, "IMO1234567");
        when(shipRepository.findAll()).thenReturn(List.of(ship));

        List<ShipResponse> result = shipService.getShips(null, null);

        assertEquals(1, result.size());
        assertEquals("IMO1234567", result.get(0).regNumber());
        verify(shipRepository).findAll();
    }

    @Test
    void createShip_Success() {
        CreateShipRequest request = new CreateShipRequest(
                "IMO1234567",
                "Test Ship",
                ShipType.TANKER,
                new ShipDimensionsRequest(120, 30, 10),
                1,
                ShipStatus.WAITING,
                2
        );

        User owner = buildUser(1);
        Dock dock = new Dock();
        dock.setId(2);
        dock.setName("Dock A");

        when(shipRepository.findByRegNumber("IMO1234567")).thenReturn(Optional.empty());
        when(userRepository.findById(1)).thenReturn(Optional.of(owner));
        when(dockRepository.findById(2)).thenReturn(Optional.of(dock));
        when(shipRepository.save(any(Ship.class))).thenAnswer(invocation -> {
            Ship saved = invocation.getArgument(0);
            saved.setId(10);
            return saved;
        });

        ShipResponse response = shipService.createShip(request);

        assertEquals(10, response.id());
        assertEquals("IMO1234567", response.regNumber());
        assertEquals("Dock A", response.dockName());
        verify(shipRepository).save(any(Ship.class));
    }

    @Test
    void createShip_DuplicateRegNumber_Throws() {
        CreateShipRequest request = new CreateShipRequest(
                "IMO1234567",
                "Test Ship",
                ShipType.TANKER,
                new ShipDimensionsRequest(120, 30, 10),
                1,
                ShipStatus.WAITING,
                null
        );
        when(shipRepository.findByRegNumber("IMO1234567")).thenReturn(Optional.of(new Ship()));

        assertThrows(DuplicateResourceException.class, () -> shipService.createShip(request));
        verify(shipRepository, never()).save(any());
    }

    @Test
    void updateShip_NotFound_Throws() {
        UpdateShipRequest request = new UpdateShipRequest(
                "IMO1234567",
                "Updated Name",
                ShipType.TUG,
                new ShipDimensionsRequest(100, 20, 8),
                1,
                ShipStatus.UNDER_REPAIR,
                null
        );
        when(shipRepository.findById(77)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> shipService.updateShip(77, request));
    }

    @Test
    void deleteShip_Success() {
        when(shipRepository.existsById(1)).thenReturn(true);

        shipService.deleteShip(1);

        verify(shipRepository).deleteById(1);
    }

    private Ship buildShip(int id, String regNumber) {
        User user = buildUser(1);
        Dock dock = new Dock();
        dock.setId(2);
        dock.setName("Dock A");

        ShipDimensions dimensions = new ShipDimensions();
        dimensions.setMaxLength(100);
        dimensions.setMaxWidth(20);
        dimensions.setMaxDraft(8);

        Ship ship = new Ship();
        ship.setId(id);
        ship.setRegNumber(regNumber);
        ship.setName("Ship " + id);
        ship.setShipType(ShipType.TANKER);
        ship.setShipStatus(ShipStatus.WAITING);
        ship.setShipDimensions(dimensions);
        ship.setUser(user);
        ship.setDock(dock);
        return ship;
    }

    private User buildUser(int id) {
        User user = new User();
        user.setId(id);
        user.setFirstName("Ivan");
        user.setLastName("Ivanov");
        return user;
    }
}
