package com.shipyard.identity.dto.auth;

public record AuthUserResponse(
        int id,
        String email,
        String fullName,
        String role,
        String dock,
        Integer shipId
) {
}
