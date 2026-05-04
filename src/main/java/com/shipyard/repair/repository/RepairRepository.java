package com.shipyard.repair.repository;

import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.enums.RepairStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RepairRepository extends JpaRepository<Repair, Integer> {
    List<Repair> findByDockId(int dockId);
    List<Repair> findByStatus(RepairStatus status);
    List<Repair> findByRepairRequestId(int repairRequestId);
    List<Repair> findByOperatorId(int operatorId);
}
