package com.shipyard.repair.repository;

import com.shipyard.repair.entity.WorkItem;
import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.WorkItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkItemRepository extends JpaRepository<WorkItem, Integer> {
    List<WorkItem> findByRepairRequestId(int repairRequestId);
    List<WorkItem> findByRepairId(int repairId);
    List<WorkItem> findByCategory(WorkCategory category);
    List<WorkItem> findByStatus(WorkItemStatus status);
}