package com.shipyard.repair.service.user;

import com.shipyard.repair.dto.user.CreateUserRequest;
import com.shipyard.repair.dto.user.UserResponse;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.User;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final DockRepository dockRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException(ErrorCode.USER_ALREADY_EXISTS);
        }

        Dock dock = null;
        if (request.dockId() != null) {
            dock = dockRepository.findById(request.dockId())
                    .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DOCK_NOT_FOUND));
        }

        User user = userMapper.toEntity(request);

        user.setEncodedPassword(passwordEncoder.encode(request.password()));
        user.setDock(dock);

        User savedUser = userRepository.save(user);

        return userMapper.toResponse(savedUser);
    }
}
