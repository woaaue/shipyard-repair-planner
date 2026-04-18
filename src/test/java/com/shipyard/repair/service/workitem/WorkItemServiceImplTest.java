package com.shipyard.repair.service.workitem;

import com.shipyard.repair.dto.workitem.CreateWorkItemRequest;
import com.shipyard.repair.dto.workitem.UpdateWorkItemRequest;
import com.shipyard.repair.dto.workitem.WorkItemResponse;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.entity.WorkItem;
import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.WorkItemStatus;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.RepairRepository;
import com.shipyard.repair.repository.RepairRequestRepository;
import com.shipyard.repair.repository.WorkItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkItemServiceImplTest {

    @Mock
    private WorkItemRepository workItemRepository;
    @Mock
    private RepairRequestRepository repairRequestRepository;
    @Mock
    private RepairRepository repairRepository;

    @InjectMocks
    private WorkItemServiceImpl workItemService;

    @Test
    void getWorkItems_ByStatus_ReturnsFiltered() {
        WorkItem workItem = buildWorkItem(1);
        workItem.setStatus(WorkItemStatus.IN_PROGRESS);
        when(workItemRepository.findByStatus(WorkItemStatus.IN_PROGRESS)).thenReturn(List.of(workItem));

        List<WorkItemResponse> result = workItemService.getWorkItems(null, null, null, WorkItemStatus.IN_PROGRESS);

        assertEquals(1, result.size());
        assertEquals(WorkItemStatus.IN_PROGRESS, result.get(0).status());
    }

    @Test
    void createWorkItem_Success() {
        CreateWorkItemRequest request = new CreateWorkItemRequest(
                2,
                3,
                WorkCategory.MECHANICAL,
                "Main engine overhaul",
                "planned",
                WorkItemStatus.PENDING,
                40,
                0,
                true,
                false,
                "notes"
        );

        RepairRequest repairRequest = new RepairRequest();
        repairRequest.setId(2);

        Repair repair = new Repair();
        repair.setId(3);
        repair.setRepairRequest(repairRequest);
        repair.setRepairRequest(repairRequest);

        when(repairRequestRepository.findById(2)).thenReturn(Optional.of(repairRequest));
        when(repairRepository.findById(3)).thenReturn(Optional.of(repair));
        when(workItemRepository.save(any(WorkItem.class))).thenAnswer(invocation -> {
            WorkItem saved = invocation.getArgument(0);
            saved.setId(10);
            return saved;
        });

        WorkItemResponse response = workItemService.createWorkItem(request);

        assertEquals(10, response.id());
        assertEquals(2, response.repairRequestId());
        assertEquals(3, response.repairId());
        assertEquals(WorkCategory.MECHANICAL, response.category());
    }

    @Test
    void createWorkItem_RepairRequestNotFound_Throws() {
        CreateWorkItemRequest request = new CreateWorkItemRequest(
                99, null, WorkCategory.OTHER, "Task", null, null, null, null, null, null, null
        );
        when(repairRequestRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> workItemService.createWorkItem(request));
    }

    @Test
    void updateWorkItem_Success() {
        WorkItem existing = buildWorkItem(5);
        UpdateWorkItemRequest request = new UpdateWorkItemRequest(
                2,
                3,
                WorkCategory.STEEL,
                "Steel replacement",
                "updated",
                WorkItemStatus.COMPLETED,
                25,
                20,
                true,
                true,
                "done"
        );

        RepairRequest repairRequest = existing.getRepairRequest();
        Repair repair = existing.getRepair();

        when(workItemRepository.findById(5)).thenReturn(Optional.of(existing));
        when(repairRequestRepository.findById(2)).thenReturn(Optional.of(repairRequest));
        when(repairRepository.findById(3)).thenReturn(Optional.of(repair));
        when(workItemRepository.save(existing)).thenReturn(existing);

        WorkItemResponse response = workItemService.updateWorkItem(5, request);

        assertEquals(WorkItemStatus.COMPLETED, response.status());
        assertEquals(20, response.actualHours());
    }

    @Test
    void deleteWorkItem_Success() {
        when(workItemRepository.existsById(1)).thenReturn(true);

        workItemService.deleteWorkItem(1);

        verify(workItemRepository).deleteById(1);
    }

    private WorkItem buildWorkItem(int id) {
        RepairRequest repairRequest = new RepairRequest();
        repairRequest.setId(2);

        Repair repair = new Repair();
        repair.setId(3);
        repair.setRepairRequest(repairRequest);

        WorkItem workItem = new WorkItem();
        workItem.setId(id);
        workItem.setRepairRequest(repairRequest);
        workItem.setRepair(repair);
        workItem.setCategory(WorkCategory.HULL);
        workItem.setName("Task " + id);
        workItem.setStatus(WorkItemStatus.PENDING);
        workItem.setEstimatedHours(0);
        workItem.setActualHours(0);
        return workItem;
    }
}
