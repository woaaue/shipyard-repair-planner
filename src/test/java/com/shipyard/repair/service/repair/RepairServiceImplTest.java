package com.shipyard.repair.service.repair;

import com.shipyard.repair.dto.repair.CreateRepairRequest;
import com.shipyard.repair.dto.repair.RepairResponse;
import com.shipyard.repair.dto.repair.UpdateRepairRequest;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.enums.RepairStatus;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.RepairRepository;
import com.shipyard.repair.repository.RepairRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RepairServiceImplTest {

    @Mock
    private RepairRepository repairRepository;
    @Mock
    private RepairRequestRepository repairRequestRepository;
    @Mock
    private DockRepository dockRepository;

    @InjectMocks
    private RepairServiceImpl repairService;

    @Test
    void getRepairs_ByStatus_ReturnsFiltered() {
        Repair repair = buildRepair(1);
        repair.setStatus(RepairStatus.IN_PROGRESS);
        when(repairRepository.findByStatus(RepairStatus.IN_PROGRESS)).thenReturn(List.of(repair));

        List<RepairResponse> result = repairService.getRepairs(null, null, RepairStatus.IN_PROGRESS);

        assertEquals(1, result.size());
        assertEquals(RepairStatus.IN_PROGRESS, result.get(0).status());
    }

    @Test
    void createRepair_Success() {
        CreateRepairRequest request = new CreateRepairRequest(
                2,
                3,
                RepairStatus.STARTED,
                LocalDate.now(),
                null,
                10,
                new BigDecimal("30000.00"),
                "start"
        );

        RepairRequest repairRequest = new RepairRequest();
        repairRequest.setId(2);

        Dock dock = new Dock();
        dock.setId(3);
        dock.setName("Dock A");

        when(repairRequestRepository.findById(2)).thenReturn(Optional.of(repairRequest));
        when(dockRepository.findById(3)).thenReturn(Optional.of(dock));
        when(repairRepository.save(any(Repair.class))).thenAnswer(invocation -> {
            Repair saved = invocation.getArgument(0);
            saved.setId(10);
            return saved;
        });

        RepairResponse response = repairService.createRepair(request);

        assertEquals(10, response.id());
        assertEquals(2, response.repairRequestId());
        assertEquals(3, response.dockId());
        assertEquals(RepairStatus.STARTED, response.status());
    }

    @Test
    void createRepair_RepairRequestNotFound_Throws() {
        CreateRepairRequest request = new CreateRepairRequest(
                99, 3, null, null, null, null, null, null
        );
        when(repairRequestRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> repairService.createRepair(request));
    }

    @Test
    void updateRepair_Success() {
        Repair existing = buildRepair(5);
        UpdateRepairRequest request = new UpdateRepairRequest(
                2,
                3,
                RepairStatus.QA,
                LocalDate.now(),
                LocalDate.now().plusDays(1),
                80,
                new BigDecimal("90000.00"),
                "updated"
        );

        RepairRequest repairRequest = existing.getRepairRequest();
        Dock dock = existing.getDock();

        when(repairRepository.findById(5)).thenReturn(Optional.of(existing));
        when(repairRequestRepository.findById(2)).thenReturn(Optional.of(repairRequest));
        when(dockRepository.findById(3)).thenReturn(Optional.of(dock));
        when(repairRepository.save(existing)).thenReturn(existing);

        RepairResponse response = repairService.updateRepair(5, request);

        assertEquals(RepairStatus.QA, response.status());
        assertEquals(80, response.progressPercentage());
    }

    @Test
    void deleteRepair_Success() {
        when(repairRepository.existsById(1)).thenReturn(true);

        repairService.deleteRepair(1);

        verify(repairRepository).deleteById(1);
    }

    private Repair buildRepair(int id) {
        RepairRequest repairRequest = new RepairRequest();
        repairRequest.setId(2);

        Dock dock = new Dock();
        dock.setId(3);
        dock.setName("Dock A");

        Repair repair = new Repair();
        repair.setId(id);
        repair.setRepairRequest(repairRequest);
        repair.setDock(dock);
        repair.setStatus(RepairStatus.SCHEDULED);
        repair.setProgressPercentage(0);
        return repair;
    }
}
