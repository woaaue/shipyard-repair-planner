package com.shipyard.repair.service.repair;

import com.shipyard.repair.dto.repair.CreateRepairRequest;
import com.shipyard.repair.dto.repair.RepairResponse;
import com.shipyard.repair.dto.repair.UpdateRepairRequest;
import com.shipyard.repair.enums.RepairStatus;

import java.util.List;

public interface RepairService {

    List<RepairResponse> getRepairs(Integer dockId, Integer repairRequestId, RepairStatus status);

    RepairResponse getRepairById(Integer id);

    RepairResponse createRepair(CreateRepairRequest request);

    RepairResponse updateRepair(Integer id, UpdateRepairRequest request);

    RepairResponse updateStatus(Integer id, RepairStatus status);

    void deleteRepair(Integer id);
}
