package com.shipyard.repair.service.repair;

import com.shipyard.repair.dto.repair.CreateRepairRequest;
import com.shipyard.repair.dto.repair.RepairResponse;
import com.shipyard.repair.dto.repair.UpdateRepairRequest;
import com.shipyard.repair.enums.RepairStatus;

import java.util.List;

public interface RepairService {

    List<RepairResponse> getRepairs(Integer dockId, Integer repairRequestId, RepairStatus status, Integer operatorId);

    default List<RepairResponse> getRepairs(Integer dockId, Integer repairRequestId, RepairStatus status) {
        return getRepairs(dockId, repairRequestId, status, null);
    }

    RepairResponse getRepairById(Integer id);

    RepairResponse createRepair(CreateRepairRequest request);

    RepairResponse updateRepair(Integer id, UpdateRepairRequest request);

    RepairResponse updateStatus(Integer id, RepairStatus status);

    RepairResponse updateOperator(Integer id, Integer operatorId);

    void deleteRepair(Integer id);
}
