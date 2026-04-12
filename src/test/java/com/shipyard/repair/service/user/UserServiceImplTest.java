package com.shipyard.repair.service.user;

import com.shipyard.repair.dto.user.CreateUserRequest;
import com.shipyard.repair.dto.user.UserResponse;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.exception.DuplicateResourceException;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.mapper.user.UserMapper;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DockRepository dockRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userServiceImpl;

    @Test
    void createUser_success() {
        CreateUserRequest request = new CreateUserRequest(
            "test@mail.ru",
            "password123",
            "Ivan",
            "Ivanov",
            null,
            UserRole.CLIENT,
            null
        );

        User user = new User();
        user.setId(1);
        user.setEmail("test@mail.ru");
        user.setEncodedPassword("password123");
        user.setFirstName("Ivan");
        user.setLastName("Ivanov");
        user.setRole(UserRole.WORKER);

        UserResponse expectedResponse = new UserResponse(
                1, "test@mail.ru", "Ivan", "Ivanov", null, UserRole.WORKER, null, LocalDate.now()
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userMapper.toEntity(request)).thenReturn(user);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toResponse(user)).thenReturn(expectedResponse);

        UserResponse result = userServiceImpl.createUser(request);

        assertNotNull(result);
        assertEquals("test@mail.ru", result.email());

        verify(userRepository).existsByEmail("test@mail.ru");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_duplicateEmail() {
        CreateUserRequest request = new CreateUserRequest(
                "test@mail.ru",
                "password123",
                "Ivan",
                "Ivanov",
                null,
                UserRole.CLIENT,
                null
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
            () -> userServiceImpl.createUser(request)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_resourceNotFound() {
        CreateUserRequest request = new CreateUserRequest(
                "test@mail.ru",
                "password123",
                "Ivan",
                "Ivanov",
                null,
                UserRole.CLIENT,
                2
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(dockRepository.findById(2)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> userServiceImpl.createUser(request)
        );

        verify(userRepository, never()).save(any(User.class));
    }
}
