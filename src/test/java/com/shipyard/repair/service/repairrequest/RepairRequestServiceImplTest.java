package com.shipyard.repair.service.repairrequest;

import com.shipyard.repair.dto.repairrequest.CreateRepairRequest;
import com.shipyard.repair.dto.repairrequest.RepairRequestResponse;
import com.shipyard.repair.dto.repairrequest.UpdateRepairRequest;
import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.entity.Ship;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.RepairRequestStatus;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.RepairRequestRepository;
import com.shipyard.repair.repository.ShipRepository;
import com.shipyard.repair.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RepairRequestServiceImplTest {

    @Mock
    private RepairRequestRepository repairRequestRepository;
    @Mock
    private ShipRepository shipRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RepairRequestServiceImpl repairRequestService;

    @Test
    void getRepairRequests_ByStatus_ReturnsFiltered() {
        RepairRequest rr = buildRepairRequest(1);
        rr.setStatus(RepairRequestStatus.SUBMITTED);
        when(repairRequestRepository.findByStatus(RepairRequestStatus.SUBMITTED)).thenReturn(List.of(rr));

        List<RepairRequestResponse> result = repairRequestService.getRepairRequests(null, null, RepairRequestStatus.SUBMITTED);

        assertEquals(1, result.size());
        assertEquals(RepairRequestStatus.SUBMITTED, result.get(0).status());
    }

    @Test
    void createRepairRequest_Success() {
        CreateRepairRequest request = new CreateRepairRequest(
                1, 2,
                LocalDate.now(),
                LocalDate.now().plusDays(10),
                null,
                null,
                10,
                2,
                null,
                new BigDecimal("120000.00"),
                "Need dry dock works",
                "priority medium",
                RepairRequestStatus.SUBMITTED
        );

        Ship ship = new Ship();
        ship.setId(1);
        ship.setName("Ship A");
        User client = new User();
        client.setId(2);
        client.setFirstName("Ivan");
        client.setLastName("Ivanov");

        when(shipRepository.findById(1)).thenReturn(Optional.of(ship));
        when(userRepository.findById(2)).thenReturn(Optional.of(client));
        when(repairRequestRepository.save(any(RepairRequest.class))).thenAnswer(invocation -> {
            RepairRequest saved = invocation.getArgument(0);
            saved.setId(10);
            return saved;
        });

        RepairRequestResponse response = repairRequestService.createRepairRequest(request);

        assertEquals(10, response.id());
        assertEquals(1, response.shipId());
        assertEquals(2, response.clientId());
        assertEquals(RepairRequestStatus.SUBMITTED, response.status());
    }

    @Test
    void createRepairRequest_ShipNotFound_Throws() {
        CreateRepairRequest request = new CreateRepairRequest(
                99, 2, null, null, null, null, 1, 0, null, null, null, null, null
        );
        when(shipRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> repairRequestService.createRepairRequest(request));
    }

    @Test
    void updateRepairRequest_Success() {
        RepairRequest existing = buildRepairRequest(3);
        UpdateRepairRequest request = new UpdateRepairRequest(
                1, 2,
                LocalDate.now(),
                LocalDate.now().plusDays(4),
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(5),
                4, 1, 0, BigDecimal.TEN, "updated", "notes", RepairRequestStatus.APPROVED
        );

        Ship ship = existing.getShip();
        User user = existing.getClient();
        when(repairRequestRepository.findById(3)).thenReturn(Optional.of(existing));
        when(shipRepository.findById(1)).thenReturn(Optional.of(ship));
        when(userRepository.findById(2)).thenReturn(Optional.of(user));
        when(repairRequestRepository.save(existing)).thenReturn(existing);

        RepairRequestResponse response = repairRequestService.updateRepairRequest(3, request);

        assertEquals(RepairRequestStatus.APPROVED, response.status());
        assertEquals("updated", response.description());
    }

    @Test
    void updateStatus_Success() {
        RepairRequest existing = buildRepairRequest(4);
        when(repairRequestRepository.findById(4)).thenReturn(Optional.of(existing));
        when(repairRequestRepository.save(existing)).thenReturn(existing);

        RepairRequestResponse response = repairRequestService.updateStatus(4, RepairRequestStatus.CANCELLED);

        assertEquals(RepairRequestStatus.CANCELLED, response.status());
    }

    private RepairRequest buildRepairRequest(int id) {
        Ship ship = new Ship();
        ship.setId(1);
        ship.setName("Ship A");

        User client = new User();
        client.setId(2);
        client.setFirstName("Ivan");
        client.setLastName("Ivanov");

        RepairRequest rr = new RepairRequest();
        rr.setId(id);
        rr.setShip(ship);
        rr.setClient(client);
        rr.setStatus(RepairRequestStatus.DRAFT);
        rr.setEstimatedDurationDays(1);
        rr.setContingencyDays(0);
        rr.setActualDurationDays(0);
        return rr;
    }
}
