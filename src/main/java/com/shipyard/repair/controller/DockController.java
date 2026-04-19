package com.shipyard.repair.controller;

import com.shipyard.repair.dto.dock.CreateDockRequest;
import com.shipyard.repair.dto.dock.DockScheduleItemResponse;
import com.shipyard.repair.dto.dock.DockResponse;
import com.shipyard.repair.dto.dock.UpdateDockRequest;
import com.shipyard.repair.service.dock.DockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/docks")
@RequiredArgsConstructor
public class DockController {

    private final DockService dockService;

    @GetMapping
    public ResponseEntity<List<DockResponse>> getDocks() {
        return ResponseEntity.status(HttpStatus.OK)
                .body(dockService.getDocks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DockResponse> getDockById(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(dockService.getDock(id));
    }

    @PostMapping
    public ResponseEntity<DockResponse> createDock(@Valid @RequestBody CreateDockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(dockService.createDock(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DockResponse> updateDock(@PathVariable Integer id, @Valid @RequestBody UpdateDockRequest request) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(dockService.updateDock(id, request));
    }

    @GetMapping("/{id}/schedule")
    public ResponseEntity<List<DockScheduleItemResponse>> getDockSchedule(
            @PathVariable Integer id,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(dockService.getDockSchedule(id, startDate, endDate));
    }

    @GetMapping("/{id}/load")
    public ResponseEntity<Integer> getDockLoad(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(dockService.getDockLoad(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<DockResponse> deleteDockById(@PathVariable Integer id) {
        dockService.deleteDock(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
