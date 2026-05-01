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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @Test
    void repairRequest_rejectedThenCancelled_returnsExpectedStatuses() throws Exception {
        RepairRequestResponse rejectedRequest = new RepairRequestResponse(
                901,
                22,
                "Baltic Star",
                12,
                "Client B",
                RepairRequestStatus.REJECTED,
                LocalDate.of(2026, 6, 1),
                null,
                null,
                null,
                10,
                1,
                0,
                null,
                "Scope mismatch",
                "Need more details",
                LocalDateTime.of(2026, 4, 24, 10, 0),
                LocalDateTime.of(2026, 4, 24, 11, 0)
        );

        RepairRequestResponse cancelledRequest = new RepairRequestResponse(
                901,
                22,
                "Baltic Star",
                12,
                "Client B",
                RepairRequestStatus.CANCELLED,
                LocalDate.of(2026, 6, 1),
                null,
                null,
                null,
                10,
                1,
                0,
                null,
                "Scope mismatch",
                "Cancelled by client",
                LocalDateTime.of(2026, 4, 24, 10, 0),
                LocalDateTime.of(2026, 4, 24, 11, 30)
        );

        when(repairRequestService.updateStatus(eq(901), eq(RepairRequestStatus.REJECTED)))
                .thenReturn(rejectedRequest);
        when(repairRequestService.updateStatus(eq(901), eq(RepairRequestStatus.CANCELLED)))
                .thenReturn(cancelledRequest);

        repairRequestMvc.perform(patch("/api/repair-requests/{id}/status", 901)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "REJECTED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(901))
                .andExpect(jsonPath("$.status").value("REJECTED"));

        repairRequestMvc.perform(patch("/api/repair-requests/{id}/status", 901)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "CANCELLED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(901))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void repairFlow_withMultipleWorkItems_movesRepairToQa() throws Exception {
        WorkItemResponse itemOne = new WorkItemResponse(
                401,
                777,
                303,
                WorkCategory.MECHANICAL,
                "Engine inspection",
                null,
                WorkItemStatus.PENDING,
                6,
                0,
                true,
                false,
                null,
                LocalDateTime.of(2026, 4, 24, 12, 0),
                LocalDateTime.of(2026, 4, 24, 12, 0)
        );

        WorkItemResponse itemTwo = new WorkItemResponse(
                402,
                777,
                303,
                WorkCategory.ELECTRICAL,
                "Cable routing",
                null,
                WorkItemStatus.PENDING,
                5,
                0,
                true,
                false,
                null,
                LocalDateTime.of(2026, 4, 24, 12, 5),
                LocalDateTime.of(2026, 4, 24, 12, 5)
        );

        WorkItemResponse itemOneCompleted = new WorkItemResponse(
                401,
                777,
                303,
                WorkCategory.MECHANICAL,
                "Engine inspection",
                null,
                WorkItemStatus.COMPLETED,
                6,
                6,
                true,
                false,
                null,
                LocalDateTime.of(2026, 4, 24, 12, 0),
                LocalDateTime.of(2026, 4, 24, 15, 0)
        );

        WorkItemResponse itemTwoCompleted = new WorkItemResponse(
                402,
                777,
                303,
                WorkCategory.ELECTRICAL,
                "Cable routing",
                null,
                WorkItemStatus.COMPLETED,
                5,
                5,
                true,
                false,
                null,
                LocalDateTime.of(2026, 4, 24, 12, 5),
                LocalDateTime.of(2026, 4, 24, 16, 0)
        );

        RepairResponse qaRepair = new RepairResponse(
                303,
                777,
                2,
                "Dock 2",
                RepairStatus.QA,
                LocalDate.of(2026, 4, 20),
                LocalDate.of(2026, 5, 5),
                90,
                new BigDecimal("1200000"),
                "Ready for quality check",
                LocalDateTime.of(2026, 4, 20, 9, 0),
                LocalDateTime.of(2026, 4, 24, 16, 10)
        );

        when(workItemService.createWorkItem(org.mockito.ArgumentMatchers.any()))
                .thenReturn(itemOne, itemTwo);
        when(workItemService.updateStatus(eq(401), eq(WorkItemStatus.COMPLETED)))
                .thenReturn(itemOneCompleted);
        when(workItemService.updateStatus(eq(402), eq(WorkItemStatus.COMPLETED)))
                .thenReturn(itemTwoCompleted);
        when(workItemService.getWorkItems(
                eq(777),
                eq(303),
                org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull()
        ))
                .thenReturn(java.util.List.of(itemOneCompleted, itemTwoCompleted));
        when(repairService.updateStatus(eq(303), eq(RepairStatus.QA)))
                .thenReturn(qaRepair);

        workItemMvc.perform(post("/api/work-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "repairRequestId": 777,
                                  "repairId": 303,
                                  "category": "MECHANICAL",
                                  "name": "Engine inspection",
                                  "status": "PENDING",
                                  "estimatedHours": 6
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(401));

        workItemMvc.perform(post("/api/work-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "repairRequestId": 777,
                                  "repairId": 303,
                                  "category": "ELECTRICAL",
                                  "name": "Cable routing",
                                  "status": "PENDING",
                                  "estimatedHours": 5
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(402));

        workItemMvc.perform(patch("/api/work-items/{id}/status", 401)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "COMPLETED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        workItemMvc.perform(patch("/api/work-items/{id}/status", 402)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "COMPLETED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        workItemMvc.perform(get("/api/work-items")
                        .param("repairRequestId", "777")
                        .param("repairId", "303"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$[1].status").value("COMPLETED"));

        repairMvc.perform(patch("/api/repairs/{id}/status", 303)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "QA"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(303))
                .andExpect(jsonPath("$.status").value("QA"))
                .andExpect(jsonPath("$.progressPercentage").value(90));
    }
}
