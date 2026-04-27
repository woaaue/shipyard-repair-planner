package com.shipyard.repair.service.issue;

import com.shipyard.repair.dto.issue.CreateIssueRequest;
import com.shipyard.repair.dto.issue.IssueResponse;

import java.util.List;

public interface IssueService {

    List<IssueResponse> getIssues(Integer repairId, String status);

    IssueResponse createIssue(CreateIssueRequest request);

    IssueResponse updateStatus(Integer id, String status);
}
