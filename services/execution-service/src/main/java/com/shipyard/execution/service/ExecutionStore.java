package com.shipyard.execution.service;

import com.shipyard.execution.dto.downtime.CreateDowntimeRequest;
import com.shipyard.execution.dto.downtime.DowntimeResponse;
import com.shipyard.execution.dto.issue.CreateIssueRequest;
import com.shipyard.execution.dto.issue.IssueResponse;
import com.shipyard.execution.dto.workitem.CreateWorkItemRequest;
import com.shipyard.execution.dto.workitem.UpdateWorkItemRequest;
import com.shipyard.execution.dto.workitem.WorkItemResponse;
import com.shipyard.execution.model.WorkCategory;
import com.shipyard.execution.model.WorkItemStatus;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ExecutionStore {

    private final CopyOnWriteArrayList<WorkItemResponse> workItems = new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<IssueResponse> issues = new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<DowntimeResponse> downtimes = new CopyOnWriteArrayList<>();

    private final AtomicLong workItemSeq = new AtomicLong(100);
    private final AtomicLong issueSeq = new AtomicLong(1000);
    private final AtomicLong downtimeSeq = new AtomicLong(500);

    @PostConstruct
    void init() {
        LocalDateTime now = LocalDateTime.now();

        workItems.add(new WorkItemResponse(
                workItemSeq.incrementAndGet(),
                91L,
                32L,
                WorkCategory.HULL,
                "Welding",
                "Fix hull crack",
                WorkItemStatus.IN_PROGRESS,
                8,
                3,
                true,
                false,
                null,
                now.minusHours(6),
                now.minusHours(1)
        ));

        issues.add(new IssueResponse(
                issueSeq.incrementAndGet(),
                32L,
                "DEFECT",
                "Hull crack found",
                "HIGH",
                "OPEN",
                "Operator",
                now.minusHours(4),
                null
        ));

        downtimes.add(new DowntimeResponse(
                downtimeSeq.incrementAndGet(),
                "Dock 2",
                "Weather",
                now.minusHours(2),
                null,
                now.plusHours(4),
                "High wind",
                now.minusHours(2)
        ));
    }

    public List<WorkItemResponse> getWorkItems(Long repairRequestId, Long repairId, WorkCategory category, WorkItemStatus status) {
        return workItems.stream()
                .filter(item -> repairRequestId == null || item.repairRequestId().equals(repairRequestId))
                .filter(item -> repairId == null || (item.repairId() != null && item.repairId().equals(repairId)))
                .filter(item -> category == null || item.category() == category)
                .filter(item -> status == null || item.status() == status)
                .toList();
    }

    public WorkItemResponse getWorkItem(long id) {
        return workItems.stream()
                .filter(item -> item.id() == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Work item not found"));
    }

    public WorkItemResponse createWorkItem(CreateWorkItemRequest request) {
        LocalDateTime now = LocalDateTime.now();
        WorkItemResponse created = new WorkItemResponse(
                workItemSeq.incrementAndGet(),
                request.repairRequestId(),
                request.repairId(),
                request.category(),
                request.name(),
                request.description(),
                request.status() == null ? WorkItemStatus.PENDING : request.status(),
                request.estimatedHours() == null ? 0 : request.estimatedHours(),
                request.actualHours() == null ? 0 : request.actualHours(),
                request.isMandatory() != null && request.isMandatory(),
                request.isDiscovered() != null && request.isDiscovered(),
                request.notes(),
                now,
                now
        );
        workItems.add(created);
        return created;
    }

    public WorkItemResponse updateWorkItem(long id, UpdateWorkItemRequest request) {
        WorkItemResponse current = getWorkItem(id);
        WorkItemResponse updated = new WorkItemResponse(
                current.id(),
                request.repairRequestId(),
                request.repairId(),
                request.category(),
                request.name(),
                request.description(),
                request.status() == null ? current.status() : request.status(),
                request.estimatedHours() == null ? current.estimatedHours() : request.estimatedHours(),
                request.actualHours() == null ? current.actualHours() : request.actualHours(),
                request.isMandatory() == null ? current.isMandatory() : request.isMandatory(),
                request.isDiscovered() == null ? current.isDiscovered() : request.isDiscovered(),
                request.notes(),
                current.createdAt(),
                LocalDateTime.now()
        );
        replaceWorkItem(updated);
        return updated;
    }

    public WorkItemResponse updateWorkItemStatus(long id, WorkItemStatus status) {
        WorkItemResponse current = getWorkItem(id);
        WorkItemResponse updated = new WorkItemResponse(
                current.id(),
                current.repairRequestId(),
                current.repairId(),
                current.category(),
                current.name(),
                current.description(),
                status,
                current.estimatedHours(),
                current.actualHours(),
                current.isMandatory(),
                current.isDiscovered(),
                current.notes(),
                current.createdAt(),
                LocalDateTime.now()
        );
        replaceWorkItem(updated);
        return updated;
    }

    public void deleteWorkItem(long id) {
        boolean removed = workItems.removeIf(item -> item.id() == id);
        if (!removed) {
            throw new IllegalArgumentException("Work item not found");
        }
    }

    public List<IssueResponse> getIssues(Long repairId, String status) {
        return issues.stream()
                .filter(issue -> repairId == null || issue.repairId().equals(repairId))
                .filter(issue -> status == null || issue.status().equalsIgnoreCase(status))
                .toList();
    }

    public IssueResponse createIssue(CreateIssueRequest request) {
        IssueResponse created = new IssueResponse(
                issueSeq.incrementAndGet(),
                request.repairId(),
                request.issueType(),
                request.description(),
                request.impact(),
                request.status() == null || request.status().isBlank() ? "OPEN" : request.status().toUpperCase(),
                request.reportedBy(),
                LocalDateTime.now(),
                null
        );
        issues.add(created);
        return created;
    }

    public IssueResponse updateIssueStatus(long id, String status) {
        IssueResponse current = issues.stream()
                .filter(issue -> issue.id() == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        String normalized = status.trim().toUpperCase();
        IssueResponse updated = new IssueResponse(
                current.id(),
                current.repairId(),
                current.issueType(),
                current.description(),
                current.impact(),
                normalized,
                current.reportedBy(),
                current.reportedAt(),
                "RESOLVED".equals(normalized) ? LocalDateTime.now() : current.resolvedAt()
        );
        replaceIssue(updated);
        return updated;
    }

    public List<DowntimeResponse> getDowntimes(String dockName, boolean activeOnly) {
        return downtimes.stream()
                .filter(downtime -> dockName == null || downtime.dockName().equalsIgnoreCase(dockName))
                .filter(downtime -> !activeOnly || downtime.endDate() == null)
                .toList();
    }

    public DowntimeResponse createDowntime(CreateDowntimeRequest request) {
        DowntimeResponse created = new DowntimeResponse(
                downtimeSeq.incrementAndGet(),
                request.dockName(),
                request.reason(),
                request.startDate(),
                null,
                request.expectedEndDate(),
                request.notes(),
                LocalDateTime.now()
        );
        downtimes.add(created);
        return created;
    }

    public DowntimeResponse finishDowntime(long id, LocalDateTime endDate) {
        DowntimeResponse current = downtimes.stream()
                .filter(downtime -> downtime.id() == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Downtime not found"));
        DowntimeResponse updated = new DowntimeResponse(
                current.id(),
                current.dockName(),
                current.reason(),
                current.startDate(),
                endDate == null ? LocalDateTime.now() : endDate,
                current.expectedEndDate(),
                current.notes(),
                current.createdAt()
        );
        replaceDowntime(updated);
        return updated;
    }

    private void replaceWorkItem(WorkItemResponse updated) {
        List<WorkItemResponse> snapshot = new ArrayList<>(workItems);
        for (int i = 0; i < snapshot.size(); i++) {
            if (snapshot.get(i).id() == updated.id()) {
                workItems.set(i, updated);
                return;
            }
        }
    }

    private void replaceIssue(IssueResponse updated) {
        List<IssueResponse> snapshot = new ArrayList<>(issues);
        for (int i = 0; i < snapshot.size(); i++) {
            if (snapshot.get(i).id() == updated.id()) {
                issues.set(i, updated);
                return;
            }
        }
    }

    private void replaceDowntime(DowntimeResponse updated) {
        List<DowntimeResponse> snapshot = new ArrayList<>(downtimes);
        for (int i = 0; i < snapshot.size(); i++) {
            if (snapshot.get(i).id() == updated.id()) {
                downtimes.set(i, updated);
                return;
            }
        }
    }
}
