package com.shipyard.identity.service;

import com.shipyard.identity.dto.auth.AuthResponse;
import com.shipyard.identity.dto.auth.AuthUserResponse;
import com.shipyard.identity.dto.auth.LoginRequest;
import com.shipyard.identity.dto.auth.RegisterRequest;
import com.shipyard.identity.dto.user.CreateUserRequest;
import com.shipyard.identity.dto.user.DockRef;
import com.shipyard.identity.dto.user.ResetPasswordResponse;
import com.shipyard.identity.dto.user.UpdateUserRequest;
import com.shipyard.identity.dto.user.UserResponse;
import com.shipyard.identity.model.UserRole;
import com.shipyard.identity.security.JwtTokenService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class IdentityStore {

    private final Map<Integer, StoredUser> users = new ConcurrentHashMap<>();
    private final AtomicInteger idGenerator = new AtomicInteger(1);
    private final JwtTokenService jwtTokenService;

    public IdentityStore(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    @PostConstruct
    void init() {
        createInitial("admin@shipyard.local", "Admin", "User", null, UserRole.ADMIN, null, "admin12345");
        createInitial("operator@shipyard.local", "Dock", "Operator", null, UserRole.OPERATOR, 1, "operator12345");
        createInitial("client@shipyard.local", "Client", "User", null, UserRole.CLIENT, null, "client12345");
    }

    public AuthResponse login(LoginRequest request) {
        StoredUser user = users.values().stream()
                .filter(u -> u.email.equalsIgnoreCase(request.email()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.enabled || !user.password.equals(request.password())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return new AuthResponse(buildToken(user), toAuthUser(user));
    }

    public AuthResponse register(RegisterRequest request) {
        ensureUniqueEmail(request.email());
        UserRole role = parseRole(request.role());
        NameParts parts = splitFullName(request.fullName());

        StoredUser user = createInitial(request.email(), parts.firstName, parts.lastName, parts.patronymic, role, null, request.password());
        return new AuthResponse(buildToken(user), toAuthUser(user));
    }

    public AuthUserResponse me(String email) {
        StoredUser user = users.values().stream()
                .filter(u -> u.email.equalsIgnoreCase(email))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toAuthUser(user);
    }

    public List<UserResponse> getAllUsers() {
        List<UserResponse> result = new ArrayList<>();
        for (StoredUser user : users.values()) {
            result.add(toUserResponse(user));
        }
        return result;
    }

    public UserResponse getUserById(Integer id) {
        return toUserResponse(getById(id));
    }

    public UserResponse createUser(CreateUserRequest request) {
        ensureUniqueEmail(request.email());
        StoredUser user = createInitial(
                request.email(),
                request.firstName(),
                request.lastName(),
                request.patronymic(),
                request.role(),
                request.dockId(),
                request.password()
        );
        return toUserResponse(user);
    }

    public UserResponse updateUser(Integer id, UpdateUserRequest request) {
        StoredUser user = getById(id);
        if (!user.email.equalsIgnoreCase(request.email())) {
            ensureUniqueEmail(request.email());
        }

        user.email = request.email();
        user.firstName = request.firstName();
        user.lastName = request.lastName();
        user.patronymic = request.patronymic();
        user.role = request.role();
        user.dock = toDock(request.dockId());

        return toUserResponse(user);
    }

    public UserResponse blockUser(Integer id) {
        StoredUser user = getById(id);
        user.enabled = false;
        return toUserResponse(user);
    }

    public UserResponse unblockUser(Integer id) {
        StoredUser user = getById(id);
        user.enabled = true;
        return toUserResponse(user);
    }

    public ResetPasswordResponse resetPassword(Integer id) {
        StoredUser user = getById(id);
        String tempPassword = "Temp" + user.id + "#12345";
        user.password = tempPassword;
        return new ResetPasswordResponse(tempPassword);
    }

    public void deleteUserById(Integer id) {
        users.remove(id);
    }

    private StoredUser getById(Integer id) {
        StoredUser user = users.get(id);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        return user;
    }

    private void ensureUniqueEmail(String email) {
        boolean exists = users.values().stream().anyMatch(u -> u.email.equalsIgnoreCase(email));
        if (exists) {
            throw new IllegalArgumentException("User with this email already exists");
        }
    }

    private StoredUser createInitial(
            String email,
            String firstName,
            String lastName,
            String patronymic,
            UserRole role,
            Integer dockId,
            String password
    ) {
        StoredUser user = new StoredUser();
        user.id = idGenerator.getAndIncrement();
        user.email = email;
        user.firstName = firstName;
        user.lastName = lastName;
        user.patronymic = patronymic;
        user.role = role;
        user.dock = toDock(dockId);
        user.createdAt = LocalDate.now();
        user.password = password;
        user.enabled = true;
        user.shipId = role == UserRole.CLIENT ? 1 : null;
        users.put(user.id, user);
        return user;
    }

    private static UserRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            return UserRole.CLIENT;
        }
        return UserRole.valueOf(role.trim().toUpperCase());
    }

    private static NameParts splitFullName(String fullName) {
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            return new NameParts(parts[0], parts[0], null);
        }
        if (parts.length == 2) {
            return new NameParts(parts[1], parts[0], null);
        }
        return new NameParts(parts[1], parts[0], parts[2]);
    }

    private static DockRef toDock(Integer dockId) {
        if (dockId == null) {
            return null;
        }
        return new DockRef(dockId, "Dock #" + dockId);
    }

    private static AuthUserResponse toAuthUser(StoredUser user) {
        String fullName = String.join(" ", List.of(user.lastName, user.firstName, user.patronymic == null ? "" : user.patronymic)).trim();
        return new AuthUserResponse(
                user.id,
                user.email,
                fullName,
                user.role.name().toLowerCase(),
                user.dock == null ? null : user.dock.name(),
                user.shipId
        );
    }

    private static UserResponse toUserResponse(StoredUser user) {
        return new UserResponse(
                user.id,
                user.email,
                user.firstName,
                user.lastName,
                user.patronymic,
                user.role,
                user.dock,
                user.createdAt
        );
    }

    private String buildToken(StoredUser user) {
        return jwtTokenService.generateToken(user.email, user.role.name());
    }

    private record NameParts(String firstName, String lastName, String patronymic) {
    }

    private static class StoredUser {
        private int id;
        private String email;
        private String firstName;
        private String lastName;
        private String patronymic;
        private UserRole role;
        private DockRef dock;
        private LocalDate createdAt;
        private String password;
        private boolean enabled;
        private Integer shipId;
    }
}
