package com.shipyard.repair.dto.auth;

public record AuthUserResponse(
        int id,
        String email,
        String fullName,
        String role,
        String dock,
        Integer shipId,
        Integer reportsToUserId,
        String reportsToFullName
) {
    public AuthUserResponse(
            int id,
            String email,
            String fullName,
            String role,
            String dock,
            Integer shipId
    ) {
        this(id, email, fullName, role, dock, shipId, null, null);
    }
}
