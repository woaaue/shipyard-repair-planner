package com.shipyard.fleet.controller;

import com.shipyard.fleet.dto.ship.CreateShipRequest;
import com.shipyard.fleet.dto.ship.ShipResponse;
import com.shipyard.fleet.dto.ship.UpdateShipRequest;
import com.shipyard.fleet.model.ShipStatus;
import com.shipyard.fleet.service.FleetStore;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ships")
public class ShipController {

    private final FleetStore fleetStore;

    public ShipController(FleetStore fleetStore) {
        this.fleetStore = fleetStore;
    }

    @GetMapping
    public ResponseEntity<List<ShipResponse>> getShips(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ShipStatus status
    ) {
        return ResponseEntity.ok(fleetStore.getShips(search, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShipResponse> getShipById(@PathVariable Integer id) {
        return ResponseEntity.ok(fleetStore.getShipById(id));
    }

    @PostMapping
    public ResponseEntity<ShipResponse> createShip(@Valid @RequestBody CreateShipRequest request) {
        return ResponseEntity.status(201).body(fleetStore.createShip(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShipResponse> updateShip(@PathVariable Integer id, @Valid @RequestBody UpdateShipRequest request) {
        return ResponseEntity.ok(fleetStore.updateShip(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShip(@PathVariable Integer id) {
        fleetStore.deleteShip(id);
        return ResponseEntity.noContent().build();
    }
}
