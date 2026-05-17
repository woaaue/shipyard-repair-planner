package com.shipyard.repair.controller;

import com.shipyard.repair.dto.dataquality.DataQualityResponse;
import com.shipyard.repair.service.user.DataQualityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDataQualityController {

    private final DataQualityService dataQualityService;

    @GetMapping("/data-quality")
    public ResponseEntity<DataQualityResponse> getDataQualityReport() {
        return ResponseEntity.status(HttpStatus.OK)
                .body(dataQualityService.getDataQualityReport());
    }
}

