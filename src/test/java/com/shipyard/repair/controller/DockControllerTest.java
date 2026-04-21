package com.shipyard.repair.controller;

import com.shipyard.repair.dto.dock.DockDimensionsResponse;
import com.shipyard.repair.dto.dock.DockResponse;
import com.shipyard.repair.dto.dock.DockScheduleItemResponse;
import com.shipyard.repair.enums.DockStatus;
import com.shipyard.repair.enums.RepairStatus;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.GlobalExceptionHandler;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.service.dock.DockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DockControllerTest {

    @Mock
    private DockService dockService;

    @InjectMocks
    private DockController dockController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding("UTF-8");

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.setValidationMessageSource(messageSource);
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(dockController)
                .setControllerAdvice(new GlobalExceptionHandler(messageSource))
                .setValidator(validator)
                .build();
    }

    @Test
    void getDockSchedule_withDateRange_returnsItems() throws Exception {
        DockScheduleItemResponse item = new DockScheduleItemResponse(
                10,
                21,
                "Aurora",
                RepairStatus.IN_PROGRESS,
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 20),
                45
        );

        when(dockService.getDockSchedule(eq(3), eq(LocalDate.parse("2026-04-01")), eq(LocalDate.parse("2026-04-30"))))
                .thenReturn(List.of(item));

        mockMvc.perform(get("/api/docks/{id}/schedule", 3)
                        .param("startDate", "2026-04-01")
                        .param("endDate", "2026-04-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].repairId").value(10))
                .andExpect(jsonPath("$[0].shipName").value("Aurora"))
                .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));
    }

    @Test
    void updateDock_whenValidationFails_returnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/docks/{id}", 2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.name").exists())
                .andExpect(jsonPath("$.dimensions").exists())
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.shipyardId").exists());
    }

    @Test
    void getDockById_whenNotFound_returnsNotFound() throws Exception {
        when(dockService.getDock(999)).thenThrow(new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND));

        mockMvc.perform(get("/api/docks/{id}", 999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("DOCK_NOT_FOUND"));
    }

    @Test
    void getDockLoad_returnsInteger() throws Exception {
        when(dockService.getDockLoad(4)).thenReturn(67);

        mockMvc.perform(get("/api/docks/{id}/load", 4))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(67));
    }

    @Test
    void getDockById_returnsDock() throws Exception {
        DockResponse response = new DockResponse(
                2,
                "Dry Dock 2",
                new DockDimensionsResponse(220, 35, 12),
                DockStatus.AVAILABLE
        );

        when(dockService.getDock(2)).thenReturn(response);

        mockMvc.perform(get("/api/docks/{id}", 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Dry Dock 2"))
                .andExpect(jsonPath("$.dimensions.maxLength").value(220))
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
    }
}