package com.shipyard.repair.controller;

import com.shipyard.repair.dto.repair.CreateRepairRequest;
import com.shipyard.repair.dto.repair.RepairResponse;
import com.shipyard.repair.dto.repair.UpdateRepairRequest;
import com.shipyard.repair.dto.repair.UpdateRepairStatusRequest;
import com.shipyard.repair.enums.RepairStatus;
import com.shipyard.repair.service.repair.RepairService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repairs")
@RequiredArgsConstructor
public class RepairController {

    private final RepairService repairService;

    @GetMapping
    public ResponseEntity<List<RepairResponse>> getRepairs(
            @RequestParam(required = false) Integer dockId,
            @RequestParam(required = false) Integer repairRequestId,
            @RequestParam(required = false) RepairStatus status
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(repairService.getRepairs(dockId, repairRequestId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepairResponse> getRepairById(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(repairService.getRepairById(id));
    }

    @PostMapping
    public ResponseEntity<RepairResponse> createRepair(@Valid @RequestBody CreateRepairRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(repairService.createRepair(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RepairResponse> updateRepair(@PathVariable Integer id, @Valid @RequestBody UpdateRepairRequest request) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(repairService.updateRepair(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RepairResponse> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRepairStatusRequest request
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(repairService.updateStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRepair(@PathVariable Integer id) {
        repairService.deleteRepair(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
