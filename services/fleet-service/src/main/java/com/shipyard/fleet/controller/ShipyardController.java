package com.shipyard.fleet.controller;

import com.shipyard.fleet.dto.shipyard.CreateShipyardRequest;
import com.shipyard.fleet.dto.shipyard.ShipyardResponse;
import com.shipyard.fleet.service.FleetStore;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipyards")
public class ShipyardController {

    private final FleetStore fleetStore;

    public ShipyardController(FleetStore fleetStore) {
        this.fleetStore = fleetStore;
    }

    @GetMapping
    public ResponseEntity<List<ShipyardResponse>> getAllShipyards() {
        return ResponseEntity.ok(fleetStore.getShipyards());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShipyardResponse> getShipyardById(@PathVariable Integer id) {
        return ResponseEntity.ok(fleetStore.getShipyardById(id));
    }

    @PostMapping
    public ResponseEntity<ShipyardResponse> createShipyard(@Valid @RequestBody CreateShipyardRequest request) {
        return ResponseEntity.status(201).body(fleetStore.createShipyard(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShipyardById(@PathVariable Integer id) {
        fleetStore.deleteShipyard(id);
        return ResponseEntity.noContent().build();
    }
}
