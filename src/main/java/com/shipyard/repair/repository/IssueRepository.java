package com.shipyard.repair.repository;

import com.shipyard.repair.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Integer> {
    List<Issue> findByRepairId(int repairId);

    List<Issue> findByStatusIgnoreCase(String status);
}
