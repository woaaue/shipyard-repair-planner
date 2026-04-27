package com.shipyard.repair.controller;

import com.shipyard.repair.dto.issue.CreateIssueRequest;
import com.shipyard.repair.dto.issue.IssueResponse;
import com.shipyard.repair.dto.issue.UpdateIssueStatusRequest;
import com.shipyard.repair.service.issue.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @GetMapping
    public ResponseEntity<List<IssueResponse>> getIssues(
            @RequestParam(required = false) Integer repairId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(issueService.getIssues(repairId, status));
    }

    @PostMapping
    public ResponseEntity<IssueResponse> createIssue(@Valid @RequestBody CreateIssueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(issueService.createIssue(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IssueResponse> updateIssueStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateIssueStatusRequest request
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(issueService.updateStatus(id, request.status()));
    }
}
