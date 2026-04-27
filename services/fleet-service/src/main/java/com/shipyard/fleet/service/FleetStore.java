package com.shipyard.fleet.service;

import com.shipyard.fleet.dto.dock.*;
import com.shipyard.fleet.dto.ship.CreateShipRequest;
import com.shipyard.fleet.dto.ship.ShipDimensionsResponse;
import com.shipyard.fleet.dto.ship.ShipResponse;
import com.shipyard.fleet.dto.ship.UpdateShipRequest;
import com.shipyard.fleet.dto.shipyard.CreateShipyardRequest;
import com.shipyard.fleet.dto.shipyard.ShipyardAddressResponse;
import com.shipyard.fleet.dto.shipyard.ShipyardResponse;
import com.shipyard.fleet.model.DockStatus;
import com.shipyard.fleet.model.ShipStatus;
import com.shipyard.fleet.model.ShipyardStatus;
import com.shipyard.fleet.model.ShipType;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class FleetStore {

    private final CopyOnWriteArrayList<ShipResponse> ships = new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<DockResponse> docks = new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<ShipyardResponse> shipyards = new CopyOnWriteArrayList<>();

    private final AtomicInteger shipSeq = new AtomicInteger(20);
    private final AtomicInteger dockSeq = new AtomicInteger(2);
    private final AtomicInteger shipyardSeq = new AtomicInteger(1);

    @PostConstruct
    void init() {
        shipyards.add(new ShipyardResponse(
                shipyardSeq.incrementAndGet(),
                "North Shipyard",
                new ShipyardAddressResponse("Russia", "Murmansk", "Dock st. 1", "183000"),
                ShipyardStatus.ACTIVE
        ));

        docks.add(new DockResponse(
                dockSeq.incrementAndGet(),
                "Dock 2",
                new DockDimensionsResponse(240, 40, 12),
                DockStatus.AVAILABLE
        ));

        ships.add(new ShipResponse(
                shipSeq.incrementAndGet(),
                "IMO1234567",
                "North Wind",
                ShipType.CONTAINER_SHIP,
                ShipStatus.WAITING,
                new ShipDimensionsResponse(210, 32, 11),
                12,
                "Client User",
                docks.get(0).id(),
                docks.get(0).name(),
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().minusDays(1)
        ));
    }

    public List<ShipResponse> getShips(String search, ShipStatus status) {
        return ships.stream()
                .filter(ship -> search == null || ship.name().toLowerCase().contains(search.toLowerCase()) || ship.regNumber().toLowerCase().contains(search.toLowerCase()))
                .filter(ship -> status == null || ship.shipStatus() == status)
                .toList();
    }

    public ShipResponse getShipById(int id) {
        return ships.stream()
                .filter(ship -> ship.id() == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Ship not found"));
    }

    public ShipResponse createShip(CreateShipRequest request) {
        DockResponse dock = request.dockId() == null ? null : getDockById(request.dockId());
        LocalDateTime now = LocalDateTime.now();
        ShipResponse created = new ShipResponse(
                shipSeq.incrementAndGet(),
                request.regNumber(),
                request.name(),
                request.shipType(),
                request.shipStatus(),
                new ShipDimensionsResponse(request.shipDimensions().maxLength(), request.shipDimensions().maxWidth(), request.shipDimensions().maxDraft()),
                request.userId(),
                "User #" + request.userId(),
                request.dockId(),
                dock == null ? null : dock.name(),
                now,
                now
        );
        ships.add(created);
        return created;
    }

    public ShipResponse updateShip(int id, UpdateShipRequest request) {
        ShipResponse current = getShipById(id);
        DockResponse dock = request.dockId() == null ? null : getDockById(request.dockId());
        ShipResponse updated = new ShipResponse(
                current.id(),
                request.regNumber(),
                request.name(),
                request.shipType(),
                request.shipStatus(),
                new ShipDimensionsResponse(request.shipDimensions().maxLength(), request.shipDimensions().maxWidth(), request.shipDimensions().maxDraft()),
                request.userId(),
                "User #" + request.userId(),
                request.dockId(),
                dock == null ? null : dock.name(),
                current.createdAt(),
                LocalDateTime.now()
        );
        replaceShip(updated);
        return updated;
    }

    public void deleteShip(int id) {
        boolean removed = ships.removeIf(ship -> ship.id() == id);
        if (!removed) {
            throw new IllegalArgumentException("Ship not found");
        }
    }

    public List<DockResponse> getDocks() {
        return new ArrayList<>(docks);
    }

    public DockResponse getDockById(int id) {
        return docks.stream()
                .filter(dock -> dock.id() == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Dock not found"));
    }

    public DockResponse createDock(CreateDockRequest request) {
        DockResponse created = new DockResponse(
                dockSeq.incrementAndGet(),
                request.name(),
                new DockDimensionsResponse(request.dimensions().maxLength(), request.dimensions().maxWidth(), request.dimensions().maxDraft()),
                request.status()
        );
        docks.add(created);
        return created;
    }

    public DockResponse updateDock(int id, UpdateDockRequest request) {
        DockResponse current = getDockById(id);
        DockResponse updated = new DockResponse(
                current.id(),
                request.name(),
                new DockDimensionsResponse(request.dimensions().maxLength(), request.dimensions().maxWidth(), request.dimensions().maxDraft()),
                request.status()
        );
        replaceDock(updated);
        return updated;
    }

    public void deleteDock(int id) {
        boolean removed = docks.removeIf(dock -> dock.id() == id);
        if (!removed) {
            throw new IllegalArgumentException("Dock not found");
        }
    }

    public List<DockScheduleItemResponse> getDockSchedule(int id) {
        getDockById(id);
        return List.of(new DockScheduleItemResponse(
                31,
                91,
                "North Wind",
                "SCHEDULED",
                LocalDate.now().plusDays(2),
                LocalDate.now().plusDays(8),
                0
        ));
    }

    public int getDockLoad(int id) {
        getDockById(id);
        return 35;
    }

    public List<ShipyardResponse> getShipyards() {
        return new ArrayList<>(shipyards);
    }

    public ShipyardResponse getShipyardById(int id) {
        return shipyards.stream()
                .filter(item -> item.id() == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Shipyard not found"));
    }

    public ShipyardResponse createShipyard(CreateShipyardRequest request) {
        ShipyardResponse created = new ShipyardResponse(
                shipyardSeq.incrementAndGet(),
                request.name(),
                new ShipyardAddressResponse(
                        request.shipyardAddress().country(),
                        request.shipyardAddress().city(),
                        request.shipyardAddress().street(),
                        request.shipyardAddress().zipCode()
                ),
                request.status()
        );
        shipyards.add(created);
        return created;
    }

    public void deleteShipyard(int id) {
        boolean removed = shipyards.removeIf(item -> item.id() == id);
        if (!removed) {
            throw new IllegalArgumentException("Shipyard not found");
        }
    }

    private void replaceShip(ShipResponse updated) {
        List<ShipResponse> snapshot = new ArrayList<>(ships);
        for (int i = 0; i < snapshot.size(); i++) {
            if (snapshot.get(i).id() == updated.id()) {
                ships.set(i, updated);
                return;
            }
        }
    }

    private void replaceDock(DockResponse updated) {
        List<DockResponse> snapshot = new ArrayList<>(docks);
        for (int i = 0; i < snapshot.size(); i++) {
            if (snapshot.get(i).id() == updated.id()) {
                docks.set(i, updated);
                return;
            }
        }
    }
}
