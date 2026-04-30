package com.shipyard.identity.controller;

import com.shipyard.identity.dto.auth.AuthResponse;
import com.shipyard.identity.dto.auth.AuthUserResponse;
import com.shipyard.identity.dto.auth.LoginRequest;
import com.shipyard.identity.dto.auth.RegisterRequest;
import com.shipyard.identity.security.JwtTokenService;
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

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final IdentityStore identityStore;
    private final JwtTokenService jwtTokenService;

    public AuthController(IdentityStore identityStore, JwtTokenService jwtTokenService) {
        this.identityStore = identityStore;
        this.jwtTokenService = jwtTokenService;
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

    private String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization header is required");
        }
        String token = authHeader.substring(7);
        String email = jwtTokenService.extractUsername(token);
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Invalid token");
        }
        return email;
    }
}
