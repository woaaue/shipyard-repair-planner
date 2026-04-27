package com.shipyard.planning.controller;

import com.shipyard.planning.dto.repair.CreateRepairRequest;
import com.shipyard.planning.dto.repair.RepairResponse;
import com.shipyard.planning.dto.repair.UpdateRepairRequest;
import com.shipyard.planning.dto.repair.UpdateRepairStatusRequest;
import com.shipyard.planning.model.RepairStatus;
import com.shipyard.planning.service.PlanningStore;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repairs")
public class RepairController {

    private final PlanningStore planningStore;

    public RepairController(PlanningStore planningStore) {
        this.planningStore = planningStore;
    }

    @GetMapping
    public ResponseEntity<List<RepairResponse>> getRepairs(
            @RequestParam(required = false) Long dockId,
            @RequestParam(required = false) Long repairRequestId,
            @RequestParam(required = false) RepairStatus status
    ) {
        return ResponseEntity.ok(planningStore.getRepairs(dockId, repairRequestId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepairResponse> getRepairById(@PathVariable long id) {
        return ResponseEntity.ok(planningStore.getRepairById(id));
    }

    @PostMapping
    public ResponseEntity<RepairResponse> createRepair(@Valid @RequestBody CreateRepairRequest request) {
        return ResponseEntity.status(201).body(planningStore.createRepair(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RepairResponse> updateRepair(@PathVariable long id, @Valid @RequestBody UpdateRepairRequest request) {
        return ResponseEntity.ok(planningStore.updateRepair(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RepairResponse> updateStatus(
            @PathVariable long id,
            @Valid @RequestBody UpdateRepairStatusRequest request
    ) {
        return ResponseEntity.ok(planningStore.updateRepairStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRepair(@PathVariable long id) {
        planningStore.deleteRepair(id);
        return ResponseEntity.noContent().build();
    }
}
