package com.shipyard.repair.controller;

import com.shipyard.repair.dto.repair.RepairResponse;
import com.shipyard.repair.dto.repairrequest.RepairRequestResponse;
import com.shipyard.repair.dto.workitem.WorkItemResponse;
import com.shipyard.repair.enums.RepairRequestStatus;
import com.shipyard.repair.enums.RepairStatus;
import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.WorkItemStatus;
import com.shipyard.repair.exception.GlobalExceptionHandler;
import com.shipyard.repair.service.repair.RepairService;
import com.shipyard.repair.service.repairrequest.RepairRequestService;
import com.shipyard.repair.service.workitem.WorkItemService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RepairFlowScenarioTest {

    @Mock
    private RepairRequestService repairRequestService;

    @Mock
    private RepairService repairService;

    @Mock
    private WorkItemService workItemService;

    @InjectMocks
    private RepairRequestController repairRequestController;

    @InjectMocks
    private RepairController repairController;

    @InjectMocks
    private WorkItemController workItemController;

    private MockMvc repairRequestMvc;
    private MockMvc repairMvc;
    private MockMvc workItemMvc;

    @BeforeEach
    void setUp() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding("UTF-8");

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.setValidationMessageSource(messageSource);
        validator.afterPropertiesSet();

        GlobalExceptionHandler globalExceptionHandler = new GlobalExceptionHandler(messageSource);

        repairRequestMvc = MockMvcBuilders.standaloneSetup(repairRequestController)
                .setControllerAdvice(globalExceptionHandler)
                .setValidator(validator)
                .build();

        repairMvc = MockMvcBuilders.standaloneSetup(repairController)
                .setControllerAdvice(globalExceptionHandler)
                .setValidator(validator)
                .build();

        workItemMvc = MockMvcBuilders.standaloneSetup(workItemController)
                .setControllerAdvice(globalExceptionHandler)
                .setValidator(validator)
                .build();
    }

    @Test
    void fullRepairFlow_fromRequestToCompletion_returnsExpectedStates() throws Exception {
        RepairRequestResponse createdRequest = new RepairRequestResponse(
                101,
                11,
                "Aurora",
                7,
                "Client A",
                RepairRequestStatus.SUBMITTED,
                LocalDate.of(2026, 4, 25),
                null,
                null,
                null,
                14,
                2,
                0,
                null,
                "Dock repair",
                null,
                LocalDateTime.of(2026, 4, 22, 10, 0),
                LocalDateTime.of(2026, 4, 22, 10, 0)
        );

        RepairRequestResponse approvedRequest = new RepairRequestResponse(
                101,
                11,
                "Aurora",
                7,
                "Client A",
                RepairRequestStatus.APPROVED,
                LocalDate.of(2026, 4, 25),
                null,
                LocalDate.of(2026, 4, 26),
                LocalDate.of(2026, 5, 10),
                14,
                2,
                0,
                null,
                "Dock repair",
                null,
                LocalDateTime.of(2026, 4, 22, 10, 0),
                LocalDateTime.of(2026, 4, 22, 12, 0)
        );

        RepairResponse createdRepair = new RepairResponse(
                201,
                101,
                3,
                "Dock 3",
                RepairStatus.SCHEDULED,
                LocalDate.of(2026, 4, 26),
                LocalDate.of(2026, 5, 10),
                0,
                BigDecimal.ZERO,
                null,
                LocalDateTime.of(2026, 4, 22, 12, 10),
                LocalDateTime.of(2026, 4, 22, 12, 10)
        );

        WorkItemResponse createdWorkItem = new WorkItemResponse(
                301,
                101,
                201,
                WorkCategory.HULL,
                "Hull diagnostics",
                "Initial diagnostics",
                WorkItemStatus.PENDING,
                8,
                0,
                true,
                false,
                null,
                LocalDateTime.of(2026, 4, 22, 12, 30),
                LocalDateTime.of(2026, 4, 22, 12, 30)
        );

        WorkItemResponse completedWorkItem = new WorkItemResponse(
                301,
                101,
                201,
                WorkCategory.HULL,
                "Hull diagnostics",
                "Initial diagnostics",
                WorkItemStatus.COMPLETED,
                8,
                7,
                true,
                false,
                null,
                LocalDateTime.of(2026, 4, 22, 12, 30),
                LocalDateTime.of(2026, 4, 22, 15, 0)
        );

        RepairResponse completedRepair = new RepairResponse(
                201,
                101,
                3,
                "Dock 3",
                RepairStatus.COMPLETED,
                LocalDate.of(2026, 4, 26),
                LocalDate.of(2026, 5, 10),
                100,
                new BigDecimal("2450000"),
                null,
                LocalDateTime.of(2026, 4, 22, 12, 10),
                LocalDateTime.of(2026, 5, 10, 16, 0)
        );

        when(repairRequestService.createRepairRequest(org.mockito.ArgumentMatchers.any()))
                .thenReturn(createdRequest);
        when(repairRequestService.updateStatus(eq(101), eq(RepairRequestStatus.APPROVED)))
                .thenReturn(approvedRequest);
        when(repairService.createRepair(org.mockito.ArgumentMatchers.any()))
                .thenReturn(createdRepair);
        when(workItemService.createWorkItem(org.mockito.ArgumentMatchers.any()))
                .thenReturn(createdWorkItem);
        when(workItemService.updateStatus(eq(301), eq(WorkItemStatus.COMPLETED)))
                .thenReturn(completedWorkItem);
        when(repairService.updateStatus(eq(201), eq(RepairStatus.COMPLETED)))
                .thenReturn(completedRepair);

        repairRequestMvc.perform(post("/api/repair-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "shipId": 11,
                                  "clientId": 7,
                                  "requestedStartDate": "2026-04-25",
                                  "description": "Dock repair",
                                  "status": "SUBMITTED"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        repairRequestMvc.perform(patch("/api/repair-requests/{id}/status", 101)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "APPROVED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.status").value("APPROVED"));

        repairMvc.perform(post("/api/repairs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "repairRequestId": 101,
                                  "dockId": 3,
                                  "status": "SCHEDULED",
                                  "progressPercentage": 0
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(201))
                .andExpect(jsonPath("$.status").value("SCHEDULED"));

        workItemMvc.perform(post("/api/work-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "repairRequestId": 101,
                                  "repairId": 201,
                                  "category": "HULL",
                                  "name": "Hull diagnostics",
                                  "status": "PENDING",
                                  "estimatedHours": 8,
                                  "actualHours": 0,
                                  "isMandatory": true,
                                  "isDiscovered": false
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(301))
                .andExpect(jsonPath("$.status").value("PENDING"));

        workItemMvc.perform(patch("/api/work-items/{id}/status", 301)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "COMPLETED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(301))
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        repairMvc.perform(patch("/api/repairs/{id}/status", 201)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "COMPLETED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(201))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.progressPercentage").value(100));
    }

    @Test
    void workItemStatusUpdate_withoutStatus_returnsValidationError() throws Exception {
        workItemMvc.perform(patch("/api/work-items/{id}/status", 301)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").exists());
    }
}