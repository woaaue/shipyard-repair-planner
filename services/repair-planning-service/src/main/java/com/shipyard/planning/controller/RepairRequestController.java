package com.shipyard.planning.controller;

import com.shipyard.planning.dto.repairrequest.CreateRepairRequest;
import com.shipyard.planning.dto.repairrequest.RepairRequestResponse;
import com.shipyard.planning.dto.repairrequest.UpdateRepairRequest;
import com.shipyard.planning.dto.repairrequest.UpdateRepairRequestStatusRequest;
import com.shipyard.planning.model.RepairRequestStatus;
import com.shipyard.planning.service.PlanningStore;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repair-requests")
public class RepairRequestController {

    private final PlanningStore planningStore;

    public RepairRequestController(PlanningStore planningStore) {
        this.planningStore = planningStore;
    }

    @GetMapping
    public ResponseEntity<List<RepairRequestResponse>> getRepairRequests(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long shipId,
            @RequestParam(required = false) RepairRequestStatus status
    ) {
        return ResponseEntity.ok(planningStore.getRepairRequests(clientId, shipId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepairRequestResponse> getRepairRequestById(@PathVariable long id) {
        return ResponseEntity.ok(planningStore.getRepairRequestById(id));
    }

    @PostMapping
    public ResponseEntity<RepairRequestResponse> createRepairRequest(@Valid @RequestBody CreateRepairRequest request) {
        return ResponseEntity.status(201).body(planningStore.createRepairRequest(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RepairRequestResponse> updateRepairRequest(
            @PathVariable long id,
            @Valid @RequestBody UpdateRepairRequest request
    ) {
        return ResponseEntity.ok(planningStore.updateRepairRequest(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RepairRequestResponse> updateStatus(
            @PathVariable long id,
            @Valid @RequestBody UpdateRepairRequestStatusRequest request
    ) {
        return ResponseEntity.ok(planningStore.updateRepairRequestStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRepairRequest(@PathVariable long id) {
        planningStore.deleteRepairRequest(id);
        return ResponseEntity.noContent().build();
    }
}
