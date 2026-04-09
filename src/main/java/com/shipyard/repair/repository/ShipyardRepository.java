package com.shipyard.repair.repository;

import com.shipyard.repair.entity.Shipyard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ShipyardRepository extends JpaRepository<Shipyard, Integer> {
    Optional<Shipyard> findByName(String name);
}