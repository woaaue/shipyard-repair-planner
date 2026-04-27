package com.shipyard.execution.controller;

import com.shipyard.execution.dto.issue.CreateIssueRequest;
import com.shipyard.execution.dto.issue.IssueResponse;
import com.shipyard.execution.dto.issue.UpdateIssueStatusRequest;
import com.shipyard.execution.service.ExecutionStore;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final ExecutionStore executionStore;

    public IssueController(ExecutionStore executionStore) {
        this.executionStore = executionStore;
    }

    @GetMapping
    public ResponseEntity<List<IssueResponse>> getIssues(
            @RequestParam(required = false) Long repairId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(executionStore.getIssues(repairId, status));
    }

    @PostMapping
    public ResponseEntity<IssueResponse> createIssue(@Valid @RequestBody CreateIssueRequest request) {
        return ResponseEntity.status(201).body(executionStore.createIssue(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IssueResponse> updateIssueStatus(
            @PathVariable long id,
            @Valid @RequestBody UpdateIssueStatusRequest request
    ) {
        return ResponseEntity.ok(executionStore.updateIssueStatus(id, request.status()));
    }
}
