package com.shipyard.repair.dto.user;

import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.enums.UserRole;

import java.time.LocalDate;

public record UserResponse(
        int id,
        String email,
        String firstname,
        String lastName,
        String patronymic,
        UserRole role,
        Dock dock,
        LocalDate createdAt
) {}