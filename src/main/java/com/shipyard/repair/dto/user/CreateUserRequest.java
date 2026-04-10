package com.shipyard.repair.dto.user;

import com.shipyard.repair.enums.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;

public record CreateUserRequest(
        @NotNull @NotBlank @Length(max = 50) String email,
        @NotNull @NotBlank @Length(max = 50) String firstname,
        @NotNull @NotBlank @Length(max = 50) String lastname,
        String patronymic,
        @NotNull UserRole role,
        Integer dockId
) {}
