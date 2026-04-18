package com.shipyard.repair.service.workitem;

import com.shipyard.repair.dto.workitem.CreateWorkItemRequest;
import com.shipyard.repair.dto.workitem.UpdateWorkItemRequest;
import com.shipyard.repair.dto.workitem.WorkItemResponse;
import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.WorkItemStatus;

import java.util.List;

public interface WorkItemService {

    List<WorkItemResponse> getWorkItems(Integer repairRequestId, Integer repairId, WorkCategory category, WorkItemStatus status);

    WorkItemResponse getWorkItemById(Integer id);

    WorkItemResponse createWorkItem(CreateWorkItemRequest request);

    WorkItemResponse updateWorkItem(Integer id, UpdateWorkItemRequest request);

    WorkItemResponse updateStatus(Integer id, WorkItemStatus status);

    void deleteWorkItem(Integer id);
}
