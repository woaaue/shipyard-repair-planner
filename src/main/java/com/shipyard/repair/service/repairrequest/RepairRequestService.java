package com.shipyard.repair.service.repairrequest;

import com.shipyard.repair.dto.repairrequest.CreateRepairRequest;
import com.shipyard.repair.dto.repairrequest.RepairRequestResponse;
import com.shipyard.repair.dto.repairrequest.UpdateRepairRequest;
import com.shipyard.repair.enums.RepairRequestStatus;

import java.util.List;

public interface RepairRequestService {

    List<RepairRequestResponse> getRepairRequests(Integer clientId, Integer shipId, RepairRequestStatus status);

    RepairRequestResponse getRepairRequestById(Integer id);

    RepairRequestResponse createRepairRequest(CreateRepairRequest request);

    RepairRequestResponse updateRepairRequest(Integer id, UpdateRepairRequest request);

    RepairRequestResponse updateStatus(Integer id, RepairRequestStatus status);

    void deleteRepairRequest(Integer id);
}
