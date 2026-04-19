package com.shipyard.repair.dto.user;

import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.validation.ApacheEmail;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank(message = "{user.email.blank}")
        @Size(message = "{user.email.size}", min = 2, max = 50)
        @ApacheEmail(message = "{user.email.invalid}")
        String email,

        @NotBlank(message = "{user.firstname.blank}")
        @Size(message = "{user.firstname.size}", min = 2, max = 50)
        String firstName,

        @NotBlank(message = "{user.lastname.blank}")
        @Size(message = "{user.lastname.size}", min = 2, max = 50)
        String lastName,

        String patronymic,

        @NotNull(message = "{user.role.not.null}")
        UserRole role,

        Integer dockId
) {}
