package com.shipyard.repair.controller;

import com.shipyard.repair.dto.user.ResetPasswordResponse;
import com.shipyard.repair.dto.user.UserResponse;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.GlobalExceptionHandler;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.service.user.UserService;
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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding("UTF-8");

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.setValidationMessageSource(messageSource);
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler(messageSource))
                .setValidator(validator)
                .build();
    }

    @Test
    void getAllUsers_returnsOk() throws Exception {
        Dock dock = new Dock();
        dock.setId(7);
        dock.setName("Dock A");

        UserResponse response = new UserResponse(
                1,
                "test@example.com",
                "Ivan",
                "Ivanov",
                null,
                UserRole.OPERATOR,
                dock,
                LocalDate.of(2026, 1, 10)
        );

        when(userService.getAllUsers()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].email").value("test@example.com"))
                .andExpect(jsonPath("$[0].role").value("OPERATOR"))
                .andExpect(jsonPath("$[0].dock.name").value("Dock A"));
    }

    @Test
    void updateUser_whenValidationFails_returnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/users/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.email").exists())
                .andExpect(jsonPath("$.firstName").exists())
                .andExpect(jsonPath("$.lastName").exists())
                .andExpect(jsonPath("$.role").exists());
    }

    @Test
    void blockUser_whenNotFound_returnsNotFound() throws Exception {
        when(userService.blockUser(999)).thenThrow(new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        mockMvc.perform(post("/api/users/{id}/block", 999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("USER_NOT_FOUND"));
    }

    @Test
    void resetPassword_returnsTempPassword() throws Exception {
        when(userService.resetPassword(5)).thenReturn(new ResetPasswordResponse("Abc123456789"));

        mockMvc.perform(post("/api/users/{id}/reset-password", 5))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tempPassword").value("Abc123456789"));
    }
}