package com.shipyard.execution.controller;

import com.shipyard.execution.dto.downtime.CreateDowntimeRequest;
import com.shipyard.execution.dto.downtime.DowntimeResponse;
import com.shipyard.execution.dto.downtime.FinishDowntimeRequest;
import com.shipyard.execution.service.ExecutionStore;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/downtimes")
public class DowntimeController {

    private final ExecutionStore executionStore;

    public DowntimeController(ExecutionStore executionStore) {
        this.executionStore = executionStore;
    }

    @GetMapping
    public ResponseEntity<List<DowntimeResponse>> getDowntimes(
            @RequestParam(required = false) String dockName,
            @RequestParam(defaultValue = "false") boolean activeOnly
    ) {
        return ResponseEntity.ok(executionStore.getDowntimes(dockName, activeOnly));
    }

    @PostMapping
    public ResponseEntity<DowntimeResponse> createDowntime(@Valid @RequestBody CreateDowntimeRequest request) {
        return ResponseEntity.status(201).body(executionStore.createDowntime(request));
    }

    @PatchMapping("/{id}/finish")
    public ResponseEntity<DowntimeResponse> finishDowntime(
            @PathVariable long id,
            @RequestBody(required = false) FinishDowntimeRequest request
    ) {
        return ResponseEntity.ok(executionStore.finishDowntime(id, request == null ? null : request.endDate()));
    }
}
