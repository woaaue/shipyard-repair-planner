package com.shipyard.repair.controller;

import com.shipyard.repair.dto.repairrequest.CreateRepairRequest;
import com.shipyard.repair.dto.repairrequest.RepairRequestResponse;
import com.shipyard.repair.dto.repairrequest.UpdateRepairRequest;
import com.shipyard.repair.dto.repairrequest.UpdateRepairRequestStatusRequest;
import com.shipyard.repair.enums.RepairRequestStatus;
import com.shipyard.repair.service.repairrequest.RepairRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repair-requests")
@RequiredArgsConstructor
public class RepairRequestController {

    private final RepairRequestService repairRequestService;

    @GetMapping
    public ResponseEntity<List<RepairRequestResponse>> getRepairRequests(
            @RequestParam(required = false) Integer clientId,
            @RequestParam(required = false) Integer shipId,
            @RequestParam(required = false) RepairRequestStatus status
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(repairRequestService.getRepairRequests(clientId, shipId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepairRequestResponse> getRepairRequestById(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(repairRequestService.getRepairRequestById(id));
    }

    @PostMapping
    public ResponseEntity<RepairRequestResponse> createRepairRequest(@Valid @RequestBody CreateRepairRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(repairRequestService.createRepairRequest(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RepairRequestResponse> updateRepairRequest(@PathVariable Integer id, @Valid @RequestBody UpdateRepairRequest request) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(repairRequestService.updateRepairRequest(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RepairRequestResponse> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRepairRequestStatusRequest request
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(repairRequestService.updateStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRepairRequest(@PathVariable Integer id) {
        repairRequestService.deleteRepairRequest(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
