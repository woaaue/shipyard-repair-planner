package com.shipyard.repair.service.user;

import com.shipyard.repair.dto.user.CreateUserRequest;
import com.shipyard.repair.dto.user.UserResponse;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.User;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final DockRepository dockRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

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
}
