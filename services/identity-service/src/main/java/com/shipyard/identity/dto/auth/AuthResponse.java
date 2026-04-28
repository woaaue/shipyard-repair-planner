package com.shipyard.identity.dto.auth;

public record AuthResponse(
        String token,
        AuthUserResponse user
) {
}
