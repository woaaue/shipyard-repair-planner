package com.shipyard.repair.service.auth;

import com.shipyard.repair.dto.auth.AuthResponse;
import com.shipyard.repair.dto.auth.AuthUserResponse;
import com.shipyard.repair.dto.auth.LoginRequest;
import com.shipyard.repair.dto.auth.RegisterRequest;
import com.shipyard.repair.entity.Ship;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.exception.DuplicateResourceException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.ShipRepository;
import com.shipyard.repair.repository.UserRepository;
import com.shipyard.repair.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ShipRepository shipRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getEncodedPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return new AuthResponse(
                jwtService.generateToken(user),
                toAuthUserResponse(user)
        );
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException(ErrorCode.USER_ALREADY_EXISTS);
        }

        User user = new User();
        user.setEmail(request.email());
        user.setEncodedPassword(passwordEncoder.encode(request.password()));
        user.setRole(resolveRole(request.role()));
        user.setEnabled(true);

        String[] fullNameParts = splitFullName(request.fullName());
        user.setLastName(fullNameParts[0]);
        user.setFirstName(fullNameParts[1]);
        user.setPatronymic(fullNameParts[2]);

        User savedUser = userRepository.save(user);
        return new AuthResponse(
                jwtService.generateToken(savedUser),
                toAuthUserResponse(savedUser)
        );
    }

    @Override
    public AuthUserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        return toAuthUserResponse(user);
    }

    private AuthUserResponse toAuthUserResponse(User user) {
        Integer shipId = shipRepository.findFirstByUserId(user.getId())
                .map(Ship::getId)
                .orElse(null);

        String fullName = String.format(
                "%s %s%s",
                user.getLastName(),
                user.getFirstName(),
                user.getPatronymic() == null || user.getPatronymic().isBlank() ? "" : " " + user.getPatronymic()
        ).trim();

        String dockName = user.getDock() == null ? null : user.getDock().getName();

        return new AuthUserResponse(
                user.getId(),
                user.getEmail(),
                fullName,
                toFrontendRole(user.getRole()),
                dockName,
                shipId
        );
    }

    private static UserRole resolveRole(String role) {
        if (role == null || role.isBlank()) {
            return UserRole.CLIENT;
        }

        return switch (role.toLowerCase()) {
            case "admin" -> UserRole.ADMIN;
            case "dispatcher" -> UserRole.DISPATCHER;
            case "operator" -> UserRole.OPERATOR;
            case "master" -> UserRole.MASTER;
            case "worker" -> UserRole.WORKER;
            case "client" -> UserRole.CLIENT;
            default -> throw new BadCredentialsException("Unsupported role: " + role);
        };
    }

    private static String toFrontendRole(UserRole role) {
        return switch (role) {
            case ADMIN -> "admin";
            case DISPATCHER -> "dispatcher";
            case OPERATOR -> "operator";
            case MASTER -> "master";
            case WORKER -> "worker";
            case CLIENT -> "client";
        };
    }

    private static String[] splitFullName(String fullName) {
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            return new String[]{parts[0], parts[0], null};
        }
        if (parts.length == 2) {
            return new String[]{parts[0], parts[1], null};
        }
        return new String[]{parts[0], parts[1], parts[2]};
    }
}
