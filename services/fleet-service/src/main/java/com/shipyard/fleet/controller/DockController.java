package com.shipyard.fleet.controller;

import com.shipyard.fleet.dto.dock.*;
import com.shipyard.fleet.service.FleetStore;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/docks")
public class DockController {

    private final FleetStore fleetStore;

    public DockController(FleetStore fleetStore) {
        this.fleetStore = fleetStore;
    }

    @GetMapping
    public ResponseEntity<List<DockResponse>> getDocks() {
        return ResponseEntity.ok(fleetStore.getDocks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DockResponse> getDockById(@PathVariable Integer id) {
        return ResponseEntity.ok(fleetStore.getDockById(id));
    }

    @PostMapping
    public ResponseEntity<DockResponse> createDock(@Valid @RequestBody CreateDockRequest request) {
        return ResponseEntity.status(201).body(fleetStore.createDock(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DockResponse> updateDock(@PathVariable Integer id, @Valid @RequestBody UpdateDockRequest request) {
        return ResponseEntity.ok(fleetStore.updateDock(id, request));
    }

    @GetMapping("/{id}/schedule")
    public ResponseEntity<List<DockScheduleItemResponse>> getDockSchedule(
            @PathVariable Integer id,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(fleetStore.getDockSchedule(id));
    }

    @GetMapping("/{id}/load")
    public ResponseEntity<Integer> getDockLoad(@PathVariable Integer id) {
        return ResponseEntity.ok(fleetStore.getDockLoad(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDockById(@PathVariable Integer id) {
        fleetStore.deleteDock(id);
        return ResponseEntity.noContent().build();
    }
}
