package com.shipyard.identity.controller;

import com.shipyard.identity.dto.auth.AuthResponse;
import com.shipyard.identity.dto.auth.AuthUserResponse;
import com.shipyard.identity.dto.auth.LoginRequest;
import com.shipyard.identity.dto.auth.RegisterRequest;
import com.shipyard.identity.service.IdentityStore;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final IdentityStore identityStore;

    public AuthController(IdentityStore identityStore) {
        this.identityStore = identityStore;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.status(HttpStatus.OK).body(identityStore.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(identityStore.register(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String email = extractEmail(authHeader);
        return ResponseEntity.status(HttpStatus.OK).body(identityStore.me(email));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    private static String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization header is required");
        }
        String token = authHeader.substring(7);
        String payload = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);
        String[] parts = payload.split(":", 2);
        if (parts.length < 1 || parts[0].isBlank()) {
            throw new IllegalArgumentException("Invalid token");
        }
        return parts[0];
    }
}
