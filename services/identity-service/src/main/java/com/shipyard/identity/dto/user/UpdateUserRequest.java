package com.shipyard.identity.dto.user;

import com.shipyard.identity.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank @Email @Size(min = 2, max = 50) String email,
        @NotBlank @Size(min = 2, max = 50) String firstName,
        @NotBlank @Size(min = 2, max = 50) String lastName,
        String patronymic,
        @NotNull UserRole role,
        Integer dockId
) {
}
