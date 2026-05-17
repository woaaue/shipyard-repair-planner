package com.shipyard.repair.service.shipyard;

import com.shipyard.repair.dto.shipyard.CreateShipyardAddressRequest;
import com.shipyard.repair.dto.shipyard.CreateShipyardRequest;
import com.shipyard.repair.dto.shipyard.ShipyardAddressResponse;
import com.shipyard.repair.dto.shipyard.ShipyardResponse;
import com.shipyard.repair.dto.shipyard.UpdateShipyardRequest;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.embeddable.ShipyardAddress;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ShipyardServiceImplTest {

    @Mock
    private ShipyardRepository shipyardRepository;

    @Mock
    private ShipyardMapper shipyardMapper;

    @Mock
    private DockRepository dockRepository;

    @Mock
    private RepairRepository repairRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ShipyardServiceImpl shipyardServiceImpl;

    @Test
    void getAllShipyards() {
        Shipyard shipyard = new Shipyard();
        shipyard.setId(1);
        shipyard.setName("Shipyard 1");

        Shipyard shipyard2 = new Shipyard();
        shipyard2.setId(2);
        shipyard2.setName("Shipyard 2");

        when(shipyardRepository.findAll()).thenReturn(Arrays.asList(shipyard, shipyard2));
        when(shipyardMapper.toDto(shipyard)).thenReturn(new ShipyardResponse(1, "Shipyard 1", new ShipyardAddressResponse("city", "street", "123"), ShipyardStatus.ACTIVE));
        when(shipyardMapper.toDto(shipyard2)).thenReturn(new ShipyardResponse(2, "Shipyard 2", new ShipyardAddressResponse("city", "street", "123"), ShipyardStatus.CLOSED));

        List<ShipyardResponse> result = shipyardServiceImpl.getShipyards();

        assertEquals(2, result.size());
        assertEquals("Shipyard 1", result.get(0).name());
        assertEquals("Shipyard 2", result.get(1).name());
    }

    @Test
    void getShipyardById_id_null() {
        assertThrows(BadRequestException.class, () -> shipyardServiceImpl.getShipyard(null));
        verify(shipyardRepository, never()).findById(anyInt());
    }

    @Test
    void getShipyardById_not_found() {
        when(shipyardRepository.findById(anyInt())).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> shipyardServiceImpl.getShipyard(999));
    }

    @Test
    void getShipyardById_success() {
        Shipyard shipyard = new Shipyard();
        shipyard.setId(1);
        shipyard.setName("Shipyard 1");

        when(shipyardRepository.findById(1)).thenReturn(Optional.of(shipyard));
        when(shipyardMapper.toDto(shipyard)).thenReturn(new ShipyardResponse(1, "Shipyard 1", new  ShipyardAddressResponse("city", "street", "123"), ShipyardStatus.ACTIVE));

        ShipyardResponse result = shipyardServiceImpl.getShipyard(1);

        assertNotNull(result);
        assertEquals(1, result.id());
    }

    @Test
    void updateShipyardById_success() {
        Shipyard existing = new Shipyard();
        existing.setId(1);
        existing.setName("Old Name");
        existing.setStatus(ShipyardStatus.ACTIVE);
        existing.setShipyardAddress(new ShipyardAddress());

        UpdateShipyardRequest request = new UpdateShipyardRequest(
                "New Name",
                new CreateShipyardAddressRequest("city", "street", "123"),
                ShipyardStatus.ACTIVE
        );

        when(shipyardRepository.findById(1)).thenReturn(Optional.of(existing));
        when(shipyardRepository.existsByNameAndIdNot("New Name", 1)).thenReturn(false);
        when(shipyardRepository.save(existing)).thenReturn(existing);
        when(shipyardMapper.toDto(existing)).thenReturn(new ShipyardResponse(
                1,
                "New Name",
                new ShipyardAddressResponse("city", "street", "123"),
                ShipyardStatus.ACTIVE
        ));

        ShipyardResponse result = shipyardServiceImpl.updateShipyard(1, request);

        assertEquals("New Name", result.name());
        verify(shipyardRepository).save(existing);
    }

    @Test
    void updateShipyard_DeactivationWithActiveDocks_ThrowsBadRequest() {
        Shipyard existing = new Shipyard();
        existing.setId(1);
        existing.setName("Shipyard 1");
        existing.setStatus(ShipyardStatus.ACTIVE);

        Dock activeDock = new Dock();
        activeDock.setId(10);
        activeDock.setStatus(DockStatus.AVAILABLE);

        UpdateShipyardRequest request = new UpdateShipyardRequest(
                "Shipyard 1",
                new CreateShipyardAddressRequest("city", "street", "123"),
                ShipyardStatus.MAINTENANCE
        );

        when(shipyardRepository.findById(1)).thenReturn(Optional.of(existing));
        when(shipyardRepository.existsByNameAndIdNot("Shipyard 1", 1)).thenReturn(false);
        when(dockRepository.findByShipyardId(1)).thenReturn(List.of(activeDock));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> shipyardServiceImpl.updateShipyard(1, request));

        assertEquals(ErrorCode.SHIPYARD_DEACTIVATION_HAS_ACTIVE_DOCKS, exception.getErrorCode());
        assertArrayEquals(new Object[]{1L}, exception.getMessageArgs());
    }

    @Test
    void updateShipyard_DeactivationWithActiveRepairs_ThrowsBadRequest() {
        Shipyard existing = new Shipyard();
        existing.setId(1);
        existing.setName("Shipyard 1");
        existing.setStatus(ShipyardStatus.ACTIVE);

        Dock inactiveDock = new Dock();
        inactiveDock.setId(10);
        inactiveDock.setStatus(DockStatus.MAINTENANCE);

        Repair activeRepair = new Repair();
        activeRepair.setStatus(RepairStatus.IN_PROGRESS);

        UpdateShipyardRequest request = new UpdateShipyardRequest(
                "Shipyard 1",
                new CreateShipyardAddressRequest("city", "street", "123"),
                ShipyardStatus.CLOSED
        );

        when(shipyardRepository.findById(1)).thenReturn(Optional.of(existing));
        when(shipyardRepository.existsByNameAndIdNot("Shipyard 1", 1)).thenReturn(false);
        when(dockRepository.findByShipyardId(1)).thenReturn(List.of(inactiveDock));
        when(repairRepository.findByDockId(10)).thenReturn(List.of(activeRepair));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> shipyardServiceImpl.updateShipyard(1, request));

        assertEquals(ErrorCode.SHIPYARD_DEACTIVATION_HAS_ACTIVE_REPAIRS, exception.getErrorCode());
        assertArrayEquals(new Object[]{1}, exception.getMessageArgs());
    }

    @Test
    void updateShipyardStatus_success() {
        Shipyard existing = new Shipyard();
        existing.setId(1);
        existing.setName("Shipyard 1");
        existing.setStatus(ShipyardStatus.MAINTENANCE);
        existing.setShipyardAddress(new ShipyardAddress());

        ShipyardResponse response = new ShipyardResponse(
                1,
                "Shipyard 1",
                new ShipyardAddressResponse("city", "street", "123"),
                ShipyardStatus.ACTIVE
        );

        when(shipyardRepository.findById(1)).thenReturn(Optional.of(existing));
        when(shipyardRepository.save(existing)).thenReturn(existing);
        when(shipyardMapper.toDto(existing)).thenReturn(response);

        ShipyardResponse result = shipyardServiceImpl.updateShipyardStatus(1, ShipyardStatus.ACTIVE);

        assertEquals(ShipyardStatus.ACTIVE, result.status());
        verify(shipyardRepository).save(existing);
    }

    @Test
    void updateShipyardStatus_DeactivationWithActiveDocks_ThrowsBadRequest() {
        Shipyard existing = new Shipyard();
        existing.setId(1);
        existing.setName("Shipyard 1");
        existing.setStatus(ShipyardStatus.ACTIVE);

        Dock activeDock1 = new Dock();
        activeDock1.setId(10);
        activeDock1.setStatus(DockStatus.AVAILABLE);

        Dock activeDock2 = new Dock();
        activeDock2.setId(11);
        activeDock2.setStatus(DockStatus.OCCUPIED);

        when(shipyardRepository.findById(1)).thenReturn(Optional.of(existing));
        when(dockRepository.findByShipyardId(1)).thenReturn(List.of(activeDock1, activeDock2));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> shipyardServiceImpl.updateShipyardStatus(1, ShipyardStatus.MAINTENANCE));

        assertEquals(ErrorCode.SHIPYARD_DEACTIVATION_HAS_ACTIVE_DOCKS, exception.getErrorCode());
        assertArrayEquals(new Object[]{2L}, exception.getMessageArgs());
    }

    @Test
    void createShipyard_success() {
        CreateShipyardRequest createShipyardRequest = new CreateShipyardRequest(
             "Shipyard 1",
                new CreateShipyardAddressRequest(
                        "city",
                        "street",
                        "123"
                ),
                ShipyardStatus.ACTIVE
        );

        Shipyard shipyard = new Shipyard();
        shipyard.setId(1);
        shipyard.setName("Shipyard 1");
        shipyard.setShipyardAddress(new ShipyardAddress());
        shipyard.setStatus(ShipyardStatus.ACTIVE);

        ShipyardResponse shipyardResponse = new ShipyardResponse(
                1,
                "Shipyard 1",
                new ShipyardAddressResponse(
                        "city",
                        "street",
                        "123"
                ),
                ShipyardStatus.ACTIVE
        );

        when(shipyardMapper.toEntity(createShipyardRequest)).thenReturn(shipyard);
        when(shipyardRepository.save(shipyard)).thenReturn(shipyard);
        when(shipyardMapper.toDto(shipyard)).thenReturn(shipyardResponse);

        ShipyardResponse result = shipyardServiceImpl.createShipyard(createShipyardRequest);

        assertEquals(1, result.id());
        verify(shipyardRepository).save(any(Shipyard.class));
    }

    @Test
    void createShipyard_alreadyExists() {
        CreateShipyardRequest createShipyardRequest = new CreateShipyardRequest(
          "Shipyard 1",
                new CreateShipyardAddressRequest(
                        "city",
                        "street",
                        "123"
                ),
                ShipyardStatus.ACTIVE
        );

        when(shipyardRepository.existsByName(anyString())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> shipyardServiceImpl.createShipyard(createShipyardRequest));

        verify(shipyardRepository, never()).save(any(Shipyard.class));
    }
}
