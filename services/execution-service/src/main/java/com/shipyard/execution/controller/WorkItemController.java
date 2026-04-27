package com.shipyard.execution.controller;

import com.shipyard.execution.dto.workitem.CreateWorkItemRequest;
import com.shipyard.execution.dto.workitem.UpdateWorkItemRequest;
import com.shipyard.execution.dto.workitem.UpdateWorkItemStatusRequest;
import com.shipyard.execution.dto.workitem.WorkItemResponse;
import com.shipyard.execution.model.WorkCategory;
import com.shipyard.execution.model.WorkItemStatus;
import com.shipyard.execution.service.ExecutionStore;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/work-items")
public class WorkItemController {

    private final ExecutionStore executionStore;

    public WorkItemController(ExecutionStore executionStore) {
        this.executionStore = executionStore;
    }

    @GetMapping
    public ResponseEntity<List<WorkItemResponse>> getWorkItems(
            @RequestParam(required = false) Long repairRequestId,
            @RequestParam(required = false) Long repairId,
            @RequestParam(required = false) WorkCategory category,
            @RequestParam(required = false) WorkItemStatus status
    ) {
        return ResponseEntity.ok(executionStore.getWorkItems(repairRequestId, repairId, category, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkItemResponse> getWorkItem(@PathVariable long id) {
        return ResponseEntity.ok(executionStore.getWorkItem(id));
    }

    @PostMapping
    public ResponseEntity<WorkItemResponse> createWorkItem(@Valid @RequestBody CreateWorkItemRequest request) {
        return ResponseEntity.status(201).body(executionStore.createWorkItem(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkItemResponse> updateWorkItem(
            @PathVariable long id,
            @Valid @RequestBody UpdateWorkItemRequest request
    ) {
        return ResponseEntity.ok(executionStore.updateWorkItem(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<WorkItemResponse> updateWorkItemStatus(
            @PathVariable long id,
            @Valid @RequestBody UpdateWorkItemStatusRequest request
    ) {
        return ResponseEntity.ok(executionStore.updateWorkItemStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkItem(@PathVariable long id) {
        executionStore.deleteWorkItem(id);
        return ResponseEntity.noContent().build();
    }
}
