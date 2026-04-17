package com.shipyard.repair.dto.auth;

public record AuthResponse(
        String token,
        AuthUserResponse user
) {
}
