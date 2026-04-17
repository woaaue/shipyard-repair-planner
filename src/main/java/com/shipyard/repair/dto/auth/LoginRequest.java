package com.shipyard.repair.dto.auth;

import com.shipyard.repair.validation.ApacheEmail;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "{user.email.blank}")
        @ApacheEmail(message = "{user.email.invalid}")
        String email,

        @NotBlank(message = "{user.password.blank}")
        String password
) {
}
