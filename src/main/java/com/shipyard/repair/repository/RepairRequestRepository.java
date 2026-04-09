package com.shipyard.repair.repository;

import com.shipyard.repair.entity.RepairRequest;
import com.shipyard.repair.enums.RepairRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RepairRequestRepository extends JpaRepository<RepairRequest, Integer> {
    List<RepairRequest> findByClientId(int clientId);
    List<RepairRequest> findByShipId(int shipId);
    List<RepairRequest> findByStatus(RepairRequestStatus status);
}