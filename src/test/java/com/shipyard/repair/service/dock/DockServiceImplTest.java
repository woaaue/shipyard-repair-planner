package com.shipyard.repair.service.dock;

import com.shipyard.repair.dto.dock.CreateDockRequest;
import com.shipyard.repair.dto.dock.DockDimensionsRequest;
import com.shipyard.repair.dto.dock.DockResponse;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Shipyard;
import com.shipyard.repair.enums.DockStatus;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.mapper.dock.DockMapper;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.ShipyardRepository;
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
class DockServiceImplTest {

    @Mock
    private DockRepository dockRepository;

    @Mock
    private DockMapper dockMapper;

    @Mock
    private ShipyardRepository shipyardRepository;

    @InjectMocks
    private DockServiceImpl dockService;

    // ===== getDocks() =====

    @Test
    void getDocks_ReturnsListOfDocks() {
        Dock dock1 = new Dock();
        dock1.setId(1);
        dock1.setName("Северный");
        
        Dock dock2 = new Dock();
        dock2.setId(2);
        dock2.setName("Южный");

        DockResponse response1 = new DockResponse(1, "Северный", null, null);
        DockResponse response2 = new DockResponse(2, "Южный", null, null);

        when(dockRepository.findAll()).thenReturn(List.of(dock1, dock2));
        when(dockMapper.toDto(dock1)).thenReturn(response1);
        when(dockMapper.toDto(dock2)).thenReturn(response2);

        List<DockResponse> result = dockService.getDocks();

        assertEquals(2, result.size());
        assertEquals("Северный", result.get(0).name());
        assertEquals("Южный", result.get(1).name());
        
        verify(dockRepository).findAll();
    }

    @Test
    void getDocks_ReturnsEmptyList() {
        when(dockRepository.findAll()).thenReturn(List.of());

        List<DockResponse> result = dockService.getDocks();

        assertTrue(result.isEmpty());
        verify(dockRepository).findAll();
    }

    @Test
    void getDock_Success() {
        Dock dock = new Dock();
        dock.setId(1);
        dock.setName("Северный");

        DockResponse response = new DockResponse(1, "Северный", null, null);

        when(dockRepository.findById(1)).thenReturn(Optional.of(dock));
        when(dockMapper.toDto(dock)).thenReturn(response);

        DockResponse result = dockService.getDock(1);

        assertNotNull(result);
        assertEquals("Северный", result.name());
        verify(dockRepository).findById(1);
    }

    @Test
    void getDock_NullId_ThrowsBadRequest() {
        assertThrows(BadRequestException.class, 
            () -> dockService.getDock(null));
        
        verify(dockRepository, never()).findById(any());
    }

    @Test
    void getDock_NotFound_ThrowsResourceNotFound() {
        when(dockRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, 
            () -> dockService.getDock(999));
        
        verify(dockRepository).findById(999);
    }

    @Test
    void deleteDock_Success() {
        when(dockRepository.existsById(1)).thenReturn(true);

        dockService.deleteDock(1);

        verify(dockRepository).existsById(1);
        verify(dockRepository).deleteById(1);
    }

    @Test
    void deleteDock_NullId_ThrowsBadRequest() {
        assertThrows(BadRequestException.class, 
            () -> dockService.deleteDock(null));
        
        verify(dockRepository, never()).deleteById(any());
    }

    @Test
    void deleteDock_NotFound_ThrowsResourceNotFound() {
        when(dockRepository.existsById(999)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, 
            () -> dockService.deleteDock(999));
        
        verify(dockRepository, never()).deleteById(any());
    }

    // ===== createDock() =====

    @Test
    void createDock_Success() {
        // given
        DockDimensionsRequest dimensions = new DockDimensionsRequest(100, 20, 10);
        CreateDockRequest request = new CreateDockRequest(
            "Северный-1", dimensions, DockStatus.AVAILABLE, 1
        );

        Shipyard shipyard = new Shipyard();
        shipyard.setId(1);
        shipyard.setName("Основная верфь");

        Dock dock = new Dock();
        dock.setId(1);
        dock.setName("Северный-1");
        dock.setShipyard(shipyard);

        DockResponse response = new DockResponse(1, "Северный-1", null, DockStatus.AVAILABLE);

        when(shipyardRepository.findById(1)).thenReturn(Optional.of(shipyard));
        when(dockMapper.toEntity(request)).thenReturn(dock);
        when(dockRepository.save(dock)).thenReturn(dock);
        when(dockMapper.toDto(dock)).thenReturn(response);

        // when
        DockResponse result = dockService.createDock(request);

        // then
        assertNotNull(result);
        assertEquals("Северный-1", result.name());
        
        verify(shipyardRepository).findById(1);
        verify(dockMapper).toEntity(request);
        verify(dockRepository).save(dock);
        verify(dockMapper).toDto(dock);
    }

    @Test
    void createDock_ShipyardNotFound_ThrowsResourceNotFound() {
        // given
        DockDimensionsRequest dimensions = new DockDimensionsRequest(100, 20, 10);
        CreateDockRequest request = new CreateDockRequest(
            "Северный-1", dimensions, DockStatus.AVAILABLE, 999
        );

        when(shipyardRepository.findById(999)).thenReturn(Optional.empty());

        // when + then
        assertThrows(ResourceNotFoundException.class,
            () -> dockService.createDock(request));
        
        verify(shipyardRepository).findById(999);
        verify(dockRepository, never()).save(any());
    }
}