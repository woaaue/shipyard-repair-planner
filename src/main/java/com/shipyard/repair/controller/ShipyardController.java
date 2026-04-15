package com.shipyard.repair.controller;

import com.shipyard.repair.dto.shipyard.CreateShipyardRequest;
import com.shipyard.repair.dto.shipyard.ShipyardResponse;
import com.shipyard.repair.service.shipyard.ShipyardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipyards")
@RequiredArgsConstructor
public class ShipyardController {

    private final ShipyardService shipyardService;

    @GetMapping
    public ResponseEntity<List<ShipyardResponse>> getAllShipyards() {
        return ResponseEntity.status(HttpStatus.OK)
                .body(shipyardService.getShipyards());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShipyardResponse> getShipyardById(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(shipyardService.getShipyard(id));
    }

    @PostMapping
    public ResponseEntity<ShipyardResponse> createShipyard(@Valid @RequestBody CreateShipyardRequest createShipyardRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shipyardService.createShipyard(createShipyardRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ShipyardResponse> deleteShipyardById(@PathVariable Integer id) {
        shipyardService.deleteShipyard(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
