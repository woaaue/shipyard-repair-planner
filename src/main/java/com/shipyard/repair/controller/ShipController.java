package com.shipyard.repair.controller;

import com.shipyard.repair.dto.ship.CreateShipRequest;
import com.shipyard.repair.dto.ship.ShipResponse;
import com.shipyard.repair.dto.ship.UpdateShipRequest;
import com.shipyard.repair.enums.ShipStatus;
import com.shipyard.repair.service.ship.ShipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ships")
@RequiredArgsConstructor
public class ShipController {

    private final ShipService shipService;

    @GetMapping
    public ResponseEntity<List<ShipResponse>> getShips(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ShipStatus status
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(shipService.getShips(search, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShipResponse> getShipById(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(shipService.getShipById(id));
    }

    @PostMapping
    public ResponseEntity<ShipResponse> createShip(@Valid @RequestBody CreateShipRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shipService.createShip(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShipResponse> updateShip(@PathVariable Integer id, @Valid @RequestBody UpdateShipRequest request) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(shipService.updateShip(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShip(@PathVariable Integer id) {
        shipService.deleteShip(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
