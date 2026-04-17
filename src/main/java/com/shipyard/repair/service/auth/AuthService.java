package com.shipyard.repair.service.auth;

import com.shipyard.repair.dto.auth.AuthResponse;
import com.shipyard.repair.dto.auth.AuthUserResponse;
import com.shipyard.repair.dto.auth.LoginRequest;
import com.shipyard.repair.dto.auth.RegisterRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    AuthUserResponse getCurrentUser(String email);
}
