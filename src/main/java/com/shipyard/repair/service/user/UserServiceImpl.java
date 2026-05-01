package com.shipyard.repair.service.user;

import com.shipyard.repair.dto.user.CreateUserRequest;
import com.shipyard.repair.dto.user.ResetPasswordResponse;
import com.shipyard.repair.dto.user.UpdateUserRequest;
import com.shipyard.repair.dto.user.UserResponse;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.DuplicateResourceException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.mapper.user.UserMapper;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final DockRepository dockRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private static final int TEMP_PASSWORD_LENGTH = 12;
    private static final String TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final Random RANDOM = new Random();

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toResponse)
                .toList();
    }

    @Override
    public UserResponse getUserById(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }

        return userRepository.findById(id)
                .map(userMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND)
        );
    }

    @Override
    public List<UserResponse> getSubordinates(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND);
        }
        return userRepository.findByReportsToId(id).stream()
                .map(userMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException(ErrorCode.USER_ALREADY_EXISTS);
        }

        Dock dock = resolveDock(request.dockId());
        User reportsTo = resolveSupervisor(request.reportsToUserId(), request.role(), null);

        User user = userMapper.toEntity(request);
        user.setEncodedPassword(passwordEncoder.encode(request.password()));
        user.setDock(dock);
        user.setReportsTo(reportsTo);
        user.setEnabled(true);

        User savedUser = userRepository.save(user);

        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Integer id, UpdateUserRequest request) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }

        User user = getUserEntity(id);
        userRepository.findByEmail(request.email())
                .filter(existing -> existing.getId() != id)
                .ifPresent(existing -> {
                    throw new DuplicateResourceException(ErrorCode.USER_ALREADY_EXISTS);
                });

        user.setEmail(request.email());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPatronymic(request.patronymic());
        user.setRole(request.role());
        user.setDock(resolveDock(request.dockId()));
        user.setReportsTo(resolveSupervisor(request.reportsToUserId(), request.role(), id));

        User savedUser = userRepository.save(user);
        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse blockUser(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        User user = getUserEntity(id);
        user.setEnabled(false);
        User savedUser = userRepository.save(user);
        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse unblockUser(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        User user = getUserEntity(id);
        user.setEnabled(true);
        User savedUser = userRepository.save(user);
        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public ResetPasswordResponse resetPassword(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        User user = getUserEntity(id);
        String tempPassword = generateTempPassword();
        user.setEncodedPassword(passwordEncoder.encode(tempPassword));
        user.setEnabled(true);
        userRepository.save(user);
        return new ResetPasswordResponse(tempPassword);
    }

    @Override
    @Transactional
    public void deleteUserById(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }

        if  (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        userRepository.deleteById(id);
    }

    private Dock resolveDock(Integer dockId) {
        if (dockId == null) {
            return null;
        }
        return dockRepository.findById(dockId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND));
    }

    private User resolveSupervisor(Integer reportsToUserId, UserRole role, Integer currentUserId) {
        if (reportsToUserId == null) {
            return null;
        }
        if (currentUserId != null && reportsToUserId.equals(currentUserId)) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }

        User supervisor = userRepository.findById(reportsToUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        UserRole expectedSupervisorRole = expectedSupervisorRole(role);
        if (expectedSupervisorRole == null || supervisor.getRole() != expectedSupervisorRole) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        ensureNoSupervisorCycle(supervisor, currentUserId);
        return supervisor;
    }

    private UserRole expectedSupervisorRole(UserRole role) {
        return switch (role) {
            case WORKER -> UserRole.MASTER;
            case MASTER -> UserRole.OPERATOR;
            case OPERATOR -> UserRole.DISPATCHER;
            case CLIENT, DISPATCHER, ADMIN -> null;
        };
    }

    private void ensureNoSupervisorCycle(User supervisor, Integer currentUserId) {
        if (currentUserId == null) {
            return;
        }
        User cursor = supervisor;
        while (cursor != null) {
            if (cursor.getId() == currentUserId) {
                throw new BadRequestException(ErrorCode.BAD_REQUEST);
            }
            cursor = cursor.getReportsTo();
        }
    }

    private User getUserEntity(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
    }

    private String generateTempPassword() {
        StringBuilder builder = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            builder.append(TEMP_PASSWORD_ALPHABET.charAt(RANDOM.nextInt(TEMP_PASSWORD_ALPHABET.length())));
        }
        return builder.toString();
    }
}
