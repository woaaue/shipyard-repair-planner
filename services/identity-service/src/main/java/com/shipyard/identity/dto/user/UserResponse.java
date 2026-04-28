package com.shipyard.identity.dto.user;

import com.shipyard.identity.model.UserRole;

import java.time.LocalDate;

public record UserResponse(
        int id,
        String email,
        String firstName,
        String lastName,
        String patronymic,
        UserRole role,
        DockRef dock,
        LocalDate createdAt
) {
}
