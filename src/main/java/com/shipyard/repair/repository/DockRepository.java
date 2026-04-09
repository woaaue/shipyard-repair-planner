package com.shipyard.repair.repository;

import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.enums.DockStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DockRepository extends JpaRepository<Dock, Integer> {
    List<Dock> findByShipyardId(int shipyardId);
    List<Dock> findByStatus(DockStatus status);
}