package com.shipyard.repair.dto.auth;

import com.shipyard.repair.validation.ApacheEmail;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "{user.firstname.blank}")
        @Size(min = 2, max = 100, message = "Full name must contain from 2 to 100 characters")
        String fullName,

        @NotBlank(message = "{user.email.blank}")
        @Size(message = "{user.email.size}", min = 2, max = 50)
        @ApacheEmail(message = "{user.email.invalid}")
        String email,

        @NotBlank(message = "{user.password.blank}")
        @Size(message = "{user.password.size}", min = 10)
        String password,

        String role
) {
}
