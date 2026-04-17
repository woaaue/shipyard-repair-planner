package com.shipyard.repair.repository;

import com.shipyard.repair.entity.Ship;
import com.shipyard.repair.enums.ShipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ShipRepository extends JpaRepository<Ship, Integer> {
    Optional<Ship> findByRegNumber(String regNumber);
    List<Ship> findByUserId(int userId);
    Optional<Ship> findFirstByUserId(int userId);
    List<Ship> findByShipStatus(ShipStatus status);
    List<Ship> findByDockId(int dockId);
}
