package com.shipyard.repair.controller;

import com.shipyard.repair.dto.workitem.CreateWorkItemRequest;
import com.shipyard.repair.dto.workitem.UpdateWorkItemAssigneeRequest;
import com.shipyard.repair.dto.workitem.UpdateWorkItemReviewRequest;
import com.shipyard.repair.dto.workitem.UpdateWorkItemRequest;
import com.shipyard.repair.dto.workitem.UpdateWorkItemStatusRequest;
import com.shipyard.repair.dto.workitem.WorkItemResponse;
import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.WorkItemReviewStatus;
import com.shipyard.repair.enums.WorkItemStatus;
import com.shipyard.repair.service.workitem.WorkItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/work-items")
@RequiredArgsConstructor
public class WorkItemController {

    private final WorkItemService workItemService;

    @GetMapping
    public ResponseEntity<List<WorkItemResponse>> getWorkItems(
            @RequestParam(required = false) Integer repairRequestId,
            @RequestParam(required = false) Integer repairId,
            @RequestParam(required = false) WorkCategory category,
            @RequestParam(required = false) WorkItemStatus status,
            @RequestParam(required = false) Integer assigneeId,
            @RequestParam(required = false) WorkItemReviewStatus reviewStatus
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(workItemService.getWorkItems(repairRequestId, repairId, category, status, assigneeId, reviewStatus));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkItemResponse> getWorkItemById(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(workItemService.getWorkItemById(id));
    }

    @PostMapping
    public ResponseEntity<WorkItemResponse> createWorkItem(@Valid @RequestBody CreateWorkItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workItemService.createWorkItem(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkItemResponse> updateWorkItem(@PathVariable Integer id, @Valid @RequestBody UpdateWorkItemRequest request) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(workItemService.updateWorkItem(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<WorkItemResponse> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateWorkItemStatusRequest request
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(workItemService.updateStatus(id, request.status()));
    }

    @PatchMapping("/{id}/assignee")
    public ResponseEntity<WorkItemResponse> updateAssignee(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateWorkItemAssigneeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(workItemService.updateAssignee(id, request.assigneeId()));
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<WorkItemResponse> updateReviewStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateWorkItemReviewRequest request
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(workItemService.updateReviewStatus(id, request.reviewStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkItem(@PathVariable Integer id) {
        workItemService.deleteWorkItem(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
