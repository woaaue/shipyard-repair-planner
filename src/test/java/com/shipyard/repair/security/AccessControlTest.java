package com.shipyard.repair.security;

import com.shipyard.repair.config.SecurityConfig;
import com.shipyard.repair.controller.AuditLogController;
import com.shipyard.repair.controller.DockController;
import com.shipyard.repair.controller.RepairRequestController;
import com.shipyard.repair.controller.UserController;
import com.shipyard.repair.controller.WorkItemController;
import com.shipyard.repair.dto.audit.AuditLogResponse;
import com.shipyard.repair.dto.dock.DockDimensionsResponse;
import com.shipyard.repair.dto.dock.DockResponse;
import com.shipyard.repair.dto.repairrequest.RepairRequestResponse;
import com.shipyard.repair.dto.user.UserResponse;
import com.shipyard.repair.dto.workitem.WorkItemResponse;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.enums.DockStatus;
import com.shipyard.repair.enums.RepairRequestStatus;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.WorkItemStatus;
import com.shipyard.repair.service.dock.DockService;
import com.shipyard.repair.service.repairrequest.RepairRequestService;
import com.shipyard.repair.service.audit.AuditLogService;
import com.shipyard.repair.service.user.UserService;
import com.shipyard.repair.service.workitem.WorkItemService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        UserController.class,
        RepairRequestController.class,
        WorkItemController.class,
        DockController.class,
        AuditLogController.class
})
@AutoConfigureMockMvc
@Import({SecurityConfig.class, AccessControlTest.TestSecurityBeans.class})
class AccessControlTest {

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private RepairRequestService repairRequestService;

    @MockitoBean
    private WorkItemService workItemService;

    @MockitoBean
    private DockService dockService;

    @MockitoBean
    private AuditLogService auditLogService;

    @Autowired
    private MockMvc mockMvc;

    @TestConfiguration
    static class TestSecurityBeans {
        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter() {
            return new JwtAuthenticationFilter(null, null) {
                @Override
                protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                        throws ServletException, IOException {
                    filterChain.doFilter(request, response);
                }
            };
        }
    }

    @Test
    void usersCreate_forDispatcher_forbidden() throws Exception {
        mockMvc.perform(post("/api/users")
                        .with(SecurityMockMvcRequestPostProcessors.user("dispatcher@mail.com").roles("DISPATCHER"))
                        .contentType("application/json")
                        .content("""
                                {
                                  "email": "new.user@mail.com",
                                  "password": "VeryStrong123",
                                  "firstName": "New",
                                  "lastName": "User",
                                  "role": "WORKER"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void usersCreate_forAdmin_created() throws Exception {
        UserResponse response = new UserResponse(
                31,
                "new.user@mail.com",
                "New",
                "User",
                null,
                UserRole.WORKER,
                null,
                LocalDate.of(2026, 4, 24)
        );
        when(userService.createUser(any())).thenReturn(response);

        mockMvc.perform(post("/api/users")
                        .with(SecurityMockMvcRequestPostProcessors.user("admin@mail.com").roles("ADMIN"))
                        .contentType("application/json")
                        .content("""
                                {
                                  "email": "new.user@mail.com",
                                  "password": "VeryStrong123",
                                  "firstName": "New",
                                  "lastName": "User",
                                  "role": "WORKER"
                                }
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void repairRequestCreate_forClient_created() throws Exception {
        RepairRequestResponse response = new RepairRequestResponse(
                91,
                20,
                "North Wind",
                12,
                "Client User",
                RepairRequestStatus.SUBMITTED,
                LocalDate.of(2026, 5, 2),
                null,
                null,
                null,
                12,
                2,
                0,
                null,
                "Hull checks",
                null,
                LocalDateTime.of(2026, 4, 24, 12, 0),
                LocalDateTime.of(2026, 4, 24, 12, 0)
        );
        when(repairRequestService.createRepairRequest(any())).thenReturn(response);

        mockMvc.perform(post("/api/repair-requests")
                        .with(SecurityMockMvcRequestPostProcessors.user("client@mail.com").roles("CLIENT"))
                        .contentType("application/json")
                        .content("""
                                {
                                  "shipId": 20,
                                  "clientId": 12,
                                  "requestedStartDate": "2026-05-02",
                                  "description": "Hull checks",
                                  "status": "SUBMITTED"
                                }
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void repairRequestStatusUpdate_forClient_forbidden() throws Exception {
        mockMvc.perform(patch("/api/repair-requests/{id}/status", 91)
                        .with(SecurityMockMvcRequestPostProcessors.user("client@mail.com").roles("CLIENT"))
                        .contentType("application/json")
                        .content("""
                                {
                                  "status": "APPROVED"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void workItemCreate_forWorker_forbidden() throws Exception {
        mockMvc.perform(post("/api/work-items")
                        .with(SecurityMockMvcRequestPostProcessors.user("worker@mail.com").roles("WORKER"))
                        .contentType("application/json")
                        .content("""
                                {
                                  "repairRequestId": 91,
                                  "repairId": 32,
                                  "category": "HULL",
                                  "name": "Welding",
                                  "estimatedHours": 4
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void workItemStatusUpdate_forWorker_allowed() throws Exception {
        WorkItemResponse response = new WorkItemResponse(
                501,
                91,
                32,
                WorkCategory.HULL,
                "Welding",
                null,
                WorkItemStatus.COMPLETED,
                4,
                4,
                true,
                false,
                null,
                LocalDateTime.of(2026, 4, 24, 11, 0),
                LocalDateTime.of(2026, 4, 24, 13, 0)
        );
        when(workItemService.updateStatus(eq(501), eq(WorkItemStatus.COMPLETED))).thenReturn(response);

        mockMvc.perform(patch("/api/work-items/{id}/status", 501)
                        .with(SecurityMockMvcRequestPostProcessors.user("worker@mail.com").roles("WORKER"))
                        .contentType("application/json")
                        .content("""
                                {
                                  "status": "COMPLETED"
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void dockCreate_forDispatcher_created() throws Exception {
        Dock dock = new Dock();
        dock.setId(2);
        dock.setName("Dock 2");

        DockResponse response = new DockResponse(2, "Dock 2", new DockDimensionsResponse(200, 35, 10), DockStatus.AVAILABLE);
        when(dockService.createDock(any())).thenReturn(response);

        mockMvc.perform(post("/api/docks")
                        .with(SecurityMockMvcRequestPostProcessors.user("dispatcher@mail.com").roles("DISPATCHER"))
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "Dock 2",
                                  "dimensions": {
                                    "maxLength": 200,
                                    "maxWidth": 35,
                                    "maxDraft": 10
                                  },
                                  "status": "AVAILABLE",
                                  "shipyardId": 1
                                }
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void auditLogsGet_forWorker_forbidden() throws Exception {
        mockMvc.perform(get("/api/audit-logs")
                        .with(SecurityMockMvcRequestPostProcessors.user("worker@mail.com").roles("WORKER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void auditLogsGet_forOperator_ok() throws Exception {
        when(auditLogService.getAuditLogs(any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(new AuditLogResponse(
                        1, "CREATE", "REPAIR", 12, "operator@mail.com", 7, "createRepair", LocalDateTime.now()
                )));

        mockMvc.perform(get("/api/audit-logs")
                        .with(SecurityMockMvcRequestPostProcessors.user("operator@mail.com").roles("OPERATOR")))
                .andExpect(status().isOk());
    }
}
