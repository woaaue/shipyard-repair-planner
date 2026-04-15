package com.shipyard.repair.service.shipyard;

import com.shipyard.repair.dto.shipyard.CreateShipyardAddressRequest;
import com.shipyard.repair.dto.shipyard.CreateShipyardRequest;
import com.shipyard.repair.dto.shipyard.ShipyardAddressResponse;
import com.shipyard.repair.dto.shipyard.ShipyardResponse;
import com.shipyard.repair.embeddable.ShipyardAddress;
import com.shipyard.repair.entity.Shipyard;
import com.shipyard.repair.enums.ShipyardStatus;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.mapper.shipyard.ShipyardMapper;
import com.shipyard.repair.repository.ShipyardRepository;
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
    void deleteShipyardById_success() {
        when(shipyardRepository.existsById(anyInt())).thenReturn(true);
        shipyardServiceImpl.deleteShipyard(1);

        verify(shipyardRepository).existsById(1);
        verify(shipyardRepository).deleteById(1);
    }

    @Test
    void deleteShipyardById_not_found() {
        when(shipyardRepository.existsById(anyInt())).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> shipyardServiceImpl.deleteShipyard(anyInt()));
    }

    @Test
    void updateShipyardById_success() {
        when(shipyardRepository.existsById(1)).thenReturn(true);

        shipyardServiceImpl.deleteShipyard(1);

        verify(shipyardRepository).existsById(1);
        verify(shipyardRepository).deleteById(1);
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
}
