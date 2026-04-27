package com.shipyard.repair.controller;

import com.shipyard.repair.dto.downtime.CreateDowntimeRequest;
import com.shipyard.repair.dto.downtime.DowntimeResponse;
import com.shipyard.repair.dto.downtime.FinishDowntimeRequest;
import com.shipyard.repair.service.downtime.DowntimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/downtimes")
@RequiredArgsConstructor
public class DowntimeController {

    private final DowntimeService downtimeService;

    @GetMapping
    public ResponseEntity<List<DowntimeResponse>> getDowntimes(
            @RequestParam(required = false) String dockName,
            @RequestParam(defaultValue = "false") boolean activeOnly
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(downtimeService.getDowntimes(dockName, activeOnly));
    }

    @PostMapping
    public ResponseEntity<DowntimeResponse> createDowntime(@Valid @RequestBody CreateDowntimeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(downtimeService.createDowntime(request));
    }

    @PatchMapping("/{id}/finish")
    public ResponseEntity<DowntimeResponse> finishDowntime(
            @PathVariable Integer id,
            @RequestBody(required = false) FinishDowntimeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(downtimeService.finishDowntime(id, request == null ? null : request.endDate()));
    }
}
