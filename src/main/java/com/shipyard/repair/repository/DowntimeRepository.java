package com.shipyard.repair.repository;

import com.shipyard.repair.entity.Downtime;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DowntimeRepository extends JpaRepository<Downtime, Integer> {
    List<Downtime> findByDockNameIgnoreCase(String dockName);
}
