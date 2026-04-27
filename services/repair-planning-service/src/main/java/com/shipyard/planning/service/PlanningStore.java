package com.shipyard.planning.service;

import com.shipyard.planning.dto.repair.CreateRepairRequest;
import com.shipyard.planning.dto.repair.RepairResponse;
import com.shipyard.planning.dto.repair.UpdateRepairRequest;
import com.shipyard.planning.dto.repairrequest.RepairRequestResponse;
import com.shipyard.planning.model.RepairRequestStatus;
import com.shipyard.planning.model.RepairStatus;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PlanningStore {

    private final CopyOnWriteArrayList<RepairRequestResponse> repairRequests = new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<RepairResponse> repairs = new CopyOnWriteArrayList<>();

    private final AtomicLong repairRequestSeq = new AtomicLong(90);
    private final AtomicLong repairSeq = new AtomicLong(30);

    @PostConstruct
    void init() {
        LocalDateTime now = LocalDateTime.now();

        RepairRequestResponse rr = new RepairRequestResponse(
                repairRequestSeq.incrementAndGet(),
                20L,
                "North Wind",
                12L,
                "Client User",
                RepairRequestStatus.SUBMITTED,
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(12),
                null,
                null,
                7,
                1,
                0,
                null,
                "Hull checks",
                null,
                now.minusDays(1),
                now.minusDays(1)
        );
        repairRequests.add(rr);

        repairs.add(new RepairResponse(
                repairSeq.incrementAndGet(),
                rr.id(),
                2L,
                "Dock 2",
                RepairStatus.SCHEDULED,
                null,
                null,
                0,
                BigDecimal.ZERO,
                null,
                now.minusHours(8),
                now.minusHours(8)
        ));
    }

    public List<RepairRequestResponse> getRepairRequests(Long clientId, Long shipId, RepairRequestStatus status) {
        return repairRequests.stream()
                .filter(item -> clientId == null || item.clientId().equals(clientId))
                .filter(item -> shipId == null || item.shipId().equals(shipId))
                .filter(item -> status == null || item.status() == status)
                .toList();
    }

    public RepairRequestResponse getRepairRequestById(long id) {
        return repairRequests.stream()
                .filter(item -> item.id() == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Repair request not found"));
    }

    public RepairRequestResponse createRepairRequest(com.shipyard.planning.dto.repairrequest.CreateRepairRequest request) {
        LocalDateTime now = LocalDateTime.now();
        RepairRequestResponse created = new RepairRequestResponse(
                repairRequestSeq.incrementAndGet(),
                request.shipId(),
                "Ship #" + request.shipId(),
                request.clientId(),
                "Client #" + request.clientId(),
                request.status() == null ? RepairRequestStatus.SUBMITTED : request.status(),
                request.requestedStartDate(),
                request.requestedEndDate(),
                request.scheduledStartDate(),
                request.scheduledEndDate(),
                request.estimatedDurationDays() == null ? 0 : request.estimatedDurationDays(),
                request.contingencyDays() == null ? 0 : request.contingencyDays(),
                request.actualDurationDays() == null ? 0 : request.actualDurationDays(),
                request.totalCost(),
                request.description(),
                request.notes(),
                now,
                now
        );
        repairRequests.add(created);
        return created;
    }

    public RepairRequestResponse updateRepairRequest(long id, com.shipyard.planning.dto.repairrequest.UpdateRepairRequest request) {
        RepairRequestResponse current = getRepairRequestById(id);
        RepairRequestResponse updated = new RepairRequestResponse(
                current.id(),
                request.shipId(),
                current.shipName(),
                request.clientId(),
                current.clientName(),
                request.status() == null ? current.status() : request.status(),
                request.requestedStartDate(),
                request.requestedEndDate(),
                request.scheduledStartDate(),
                request.scheduledEndDate(),
                request.estimatedDurationDays() == null ? current.estimatedDurationDays() : request.estimatedDurationDays(),
                request.contingencyDays() == null ? current.contingencyDays() : request.contingencyDays(),
                request.actualDurationDays() == null ? current.actualDurationDays() : request.actualDurationDays(),
                request.totalCost(),
                request.description(),
                request.notes(),
                current.createdAt(),
                LocalDateTime.now()
        );
        replaceRepairRequest(updated);
        return updated;
    }

    public RepairRequestResponse updateRepairRequestStatus(long id, RepairRequestStatus status) {
        RepairRequestResponse current = getRepairRequestById(id);
        RepairRequestResponse updated = new RepairRequestResponse(
                current.id(),
                current.shipId(),
                current.shipName(),
                current.clientId(),
                current.clientName(),
                status,
                current.requestedStartDate(),
                current.requestedEndDate(),
                current.scheduledStartDate(),
                current.scheduledEndDate(),
                current.estimatedDurationDays(),
                current.contingencyDays(),
                current.actualDurationDays(),
                current.totalCost(),
                current.description(),
                current.notes(),
                current.createdAt(),
                LocalDateTime.now()
        );
        replaceRepairRequest(updated);
        return updated;
    }

    public void deleteRepairRequest(long id) {
        boolean removed = repairRequests.removeIf(item -> item.id() == id);
        if (!removed) {
            throw new IllegalArgumentException("Repair request not found");
        }
    }

    public List<RepairResponse> getRepairs(Long dockId, Long repairRequestId, RepairStatus status) {
        return repairs.stream()
                .filter(item -> dockId == null || item.dockId().equals(dockId))
                .filter(item -> repairRequestId == null || item.repairRequestId().equals(repairRequestId))
                .filter(item -> status == null || item.status() == status)
                .toList();
    }

    public RepairResponse getRepairById(long id) {
        return repairs.stream()
                .filter(item -> item.id() == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Repair not found"));
    }

    public RepairResponse createRepair(CreateRepairRequest request) {
        LocalDateTime now = LocalDateTime.now();
        RepairResponse created = new RepairResponse(
                repairSeq.incrementAndGet(),
                request.repairRequestId(),
                request.dockId(),
                "Dock " + request.dockId(),
                request.status() == null ? RepairStatus.SCHEDULED : request.status(),
                request.actualStartDate(),
                request.actualEndDate(),
                request.progressPercentage() == null ? 0 : request.progressPercentage(),
                request.totalCost() == null ? BigDecimal.ZERO : request.totalCost(),
                request.notes(),
                now,
                now
        );
        repairs.add(created);
        return created;
    }

    public RepairResponse updateRepair(long id, UpdateRepairRequest request) {
        RepairResponse current = getRepairById(id);
        RepairResponse updated = new RepairResponse(
                current.id(),
                request.repairRequestId(),
                request.dockId(),
                "Dock " + request.dockId(),
                request.status() == null ? current.status() : request.status(),
                request.actualStartDate(),
                request.actualEndDate(),
                request.progressPercentage() == null ? current.progressPercentage() : request.progressPercentage(),
                request.totalCost() == null ? current.totalCost() : request.totalCost(),
                request.notes(),
                current.createdAt(),
                LocalDateTime.now()
        );
        replaceRepair(updated);
        return updated;
    }

    public RepairResponse updateRepairStatus(long id, RepairStatus status) {
        RepairResponse current = getRepairById(id);
        RepairResponse updated = new RepairResponse(
                current.id(),
                current.repairRequestId(),
                current.dockId(),
                current.dockName(),
                status,
                current.actualStartDate(),
                current.actualEndDate(),
                current.progressPercentage(),
                current.totalCost(),
                current.notes(),
                current.createdAt(),
                LocalDateTime.now()
        );
        replaceRepair(updated);
        return updated;
    }

    public void deleteRepair(long id) {
        boolean removed = repairs.removeIf(item -> item.id() == id);
        if (!removed) {
            throw new IllegalArgumentException("Repair not found");
        }
    }

    private void replaceRepairRequest(RepairRequestResponse value) {
        List<RepairRequestResponse> snapshot = new ArrayList<>(repairRequests);
        for (int i = 0; i < snapshot.size(); i++) {
            if (snapshot.get(i).id() == value.id()) {
                repairRequests.set(i, value);
                return;
            }
        }
    }

    private void replaceRepair(RepairResponse value) {
        List<RepairResponse> snapshot = new ArrayList<>(repairs);
        for (int i = 0; i < snapshot.size(); i++) {
            if (snapshot.get(i).id() == value.id()) {
                repairs.set(i, value);
                return;
            }
        }
    }
}
