package com.shipyard.repair.service.issue;

import com.shipyard.repair.dto.issue.CreateIssueRequest;
import com.shipyard.repair.dto.issue.IssueResponse;
import com.shipyard.repair.entity.Issue;
import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.IssueRepository;
import com.shipyard.repair.repository.RepairRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final RepairRepository repairRepository;

    @Override
    public List<IssueResponse> getIssues(Integer repairId, String status) {
        if (repairId != null && status != null && !status.isBlank()) {
            return issueRepository.findByRepairId(repairId).stream()
                    .filter(issue -> issue.getStatus().equalsIgnoreCase(status))
                    .map(this::toResponse)
                    .toList();
        }
        if (repairId != null) {
            return issueRepository.findByRepairId(repairId).stream().map(this::toResponse).toList();
        }
        if (status != null && !status.isBlank()) {
            return issueRepository.findByStatusIgnoreCase(status).stream().map(this::toResponse).toList();
        }
        return issueRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public IssueResponse createIssue(CreateIssueRequest request) {
        Repair repair = repairRepository.findById(request.repairId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REPAIR_NOT_FOUND));

        Issue issue = new Issue();
        issue.setRepair(repair);
        issue.setIssueType(request.issueType());
        issue.setDescription(request.description());
        issue.setImpact(request.impact());
        issue.setReportedBy(request.reportedBy());
        issue.setStatus(request.status() == null || request.status().isBlank() ? "OPEN" : request.status().toUpperCase());

        Issue saved = issueRepository.save(issue);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public IssueResponse updateStatus(Integer id, String status) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (normalized.isEmpty()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        issue.setStatus(normalized);
        if ("RESOLVED".equals(normalized)) {
            issue.setResolvedAt(LocalDateTime.now());
        }
        Issue saved = issueRepository.save(issue);
        return toResponse(saved);
    }

    private IssueResponse toResponse(Issue issue) {
        return new IssueResponse(
                issue.getId(),
                issue.getRepair().getId(),
                issue.getIssueType(),
                issue.getDescription(),
                issue.getImpact(),
                issue.getStatus(),
                issue.getReportedBy(),
                issue.getReportedAt(),
                issue.getResolvedAt()
        );
    }
}
