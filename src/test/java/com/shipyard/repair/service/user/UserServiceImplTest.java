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
import java.util.List;
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
    void getAllUsers() {
        User user1 = new User();
        user1.setId(1);
        user1.setEmail("ivan@mail.ru");
        user1.setFirstName("Ivan");
        user1.setLastName("Ivanov");
        user1.setRole(UserRole.CLIENT);

        User user2 = new User();
        user2.setId(2);
        user2.setEmail("petya@mail.ru");
        user2.setFirstName("Petya");
        user2.setLastName("Petrov");
        user2.setRole(UserRole.WORKER);

        when(userRepository.findAll()).thenReturn(List.of(user1, user2));
        when(userMapper.toResponse(user1)).thenReturn(new UserResponse(1, "ivan@mail.ru", "Ivan", "Ivanov", null, UserRole.CLIENT, null, LocalDate.now()));
        when(userMapper.toResponse(user2)).thenReturn(new UserResponse(2, "petya@mail.ru", "Petya", "Petrov", null, UserRole.WORKER, null, LocalDate.now()));

        List<UserResponse> result = userServiceImpl.getAllUsers();

        assertEquals(2, result.size());
        assertEquals("ivan@mail.ru", result.get(0).email());
        assertEquals("petya@mail.ru", result.get(1).email());
    }

    @Test
    void getUserById_success() {
        User user = new User();
        user.setId(1);

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userMapper.toResponse(user)).thenReturn(new UserResponse(1, null, null, null, null, UserRole.CLIENT, null, LocalDate.now()));

        UserResponse result = userServiceImpl.getUserById(1);

        assertNotNull(result);
    }

    @Test
    void getUserById_null_id() {
        assertThrows(BadRequestException.class, () -> userServiceImpl.getUserById(null));
        verify(userRepository, never()).findById(any());
    }

    @Test
    void getUserById_not_found() {
        when(userRepository.findById(999)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userServiceImpl.getUserById(999));
    }

    @Test
    void deleteUserById_success() {
        when(userRepository.existsById(1)).thenReturn(true);

        userServiceImpl.deleteUserById(1);

        verify(userRepository).existsById(1);
        verify(userRepository).deleteById(1);
    }

    @Test
    void deleteUserById_null_id() {
        assertThrows(BadRequestException.class, () -> userServiceImpl.deleteUserById(null));
        verify(userRepository, never()).deleteById(1);
    }

    @Test
    void deleteUserById_not_found() {
        when(userRepository.existsById(999)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> userServiceImpl.deleteUserById(999));
        verify(userRepository, never()).deleteById(any());
    }

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
    void createUser_withSupervisor_success() {
        CreateUserRequest request = new CreateUserRequest(
            "worker@mail.ru",
            "password123",
            "Ivan",
            "Worker",
            null,
            UserRole.WORKER,
            null,
            7
        );

        User master = new User();
        master.setId(7);
        master.setRole(UserRole.MASTER);

        User user = new User();
        user.setId(1);
        user.setEmail("worker@mail.ru");
        user.setFirstName("Ivan");
        user.setLastName("Worker");
        user.setRole(UserRole.WORKER);

        UserResponse expectedResponse = new UserResponse(
                1, "worker@mail.ru", "Ivan", "Worker", null, UserRole.WORKER, null, 7, null, LocalDate.now()
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.findById(7)).thenReturn(Optional.of(master));
        when(userMapper.toEntity(request)).thenReturn(user);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toResponse(user)).thenReturn(expectedResponse);

        UserResponse result = userServiceImpl.createUser(request);

        assertEquals(7, user.getReportsTo().getId());
        assertEquals(7, result.reportsToUserId());
    }

    @Test
    void createUser_withWrongSupervisorRole_throws() {
        CreateUserRequest request = new CreateUserRequest(
                "worker@mail.ru",
                "password123",
                "Ivan",
                "Worker",
                null,
                UserRole.WORKER,
                null,
                8
        );

        User operator = new User();
        operator.setId(8);
        operator.setRole(UserRole.OPERATOR);

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.findById(8)).thenReturn(Optional.of(operator));

        assertThrows(BadRequestException.class, () -> userServiceImpl.createUser(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getSubordinates_success() {
        User master = new User();
        master.setId(7);

        User worker = new User();
        worker.setId(9);
        worker.setReportsTo(master);

        UserResponse response = new UserResponse(9, "worker@mail.ru", "Ivan", "Worker", null, UserRole.WORKER, null, 7, null, LocalDate.now());

        when(userRepository.existsById(7)).thenReturn(true);
        when(userRepository.findByReportsToId(7)).thenReturn(List.of(worker));
        when(userMapper.toResponse(worker)).thenReturn(response);

        List<UserResponse> result = userServiceImpl.getSubordinates(7);

        assertEquals(1, result.size());
        assertEquals(7, result.get(0).reportsToUserId());
    }

    @Test
    void updateUser_reportsToSelf_throws() {
        User existing = new User();
        existing.setId(1);
        existing.setEmail("old@mail.ru");
        existing.setRole(UserRole.WORKER);

        UpdateUserRequest request = new UpdateUserRequest(
                "old@mail.ru",
                "Ivan",
                "Worker",
                null,
                UserRole.WORKER,
                null,
                1
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(existing));
        when(userRepository.findByEmail("old@mail.ru")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> userServiceImpl.updateUser(1, request));
    }

    @Test
    void updateUser_Success() {
        User existing = new User();
        existing.setId(1);
        existing.setEmail("old@mail.ru");
        existing.setFirstName("Old");
        existing.setLastName("Name");
        existing.setRole(UserRole.CLIENT);

        Dock dock = new Dock();
        dock.setId(2);

        UpdateUserRequest request = new UpdateUserRequest(
                "new@mail.ru",
                "Ivan",
                "Ivanov",
                "Ivanovich",
                UserRole.OPERATOR,
                2
        );

        UserResponse expected = new UserResponse(1, "new@mail.ru", "Ivan", "Ivanov", "Ivanovich", UserRole.OPERATOR, dock, LocalDate.now());

        when(userRepository.findById(1)).thenReturn(Optional.of(existing));
        when(userRepository.findByEmail("new@mail.ru")).thenReturn(Optional.empty());
        when(dockRepository.findById(2)).thenReturn(Optional.of(dock));
        when(userRepository.save(existing)).thenReturn(existing);
        when(userMapper.toResponse(existing)).thenReturn(expected);

        UserResponse result = userServiceImpl.updateUser(1, request);

        assertEquals("new@mail.ru", result.email());
        assertEquals(UserRole.OPERATOR, result.role());
        verify(userRepository).save(existing);
    }

    @Test
    void blockUser_Success() {
        User existing = new User();
        existing.setId(1);
        existing.setEnabled(true);

        UserResponse expected = new UserResponse(1, null, null, null, null, UserRole.CLIENT, null, LocalDate.now());

        when(userRepository.findById(1)).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);
        when(userMapper.toResponse(existing)).thenReturn(expected);

        userServiceImpl.blockUser(1);

        assertFalse(existing.isEnabled());
        verify(userRepository).save(existing);
    }

    @Test
    void resetPassword_Success() {
        User existing = new User();
        existing.setId(1);
        existing.setEnabled(false);

        when(userRepository.findById(1)).thenReturn(Optional.of(existing));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(userRepository.save(existing)).thenReturn(existing);

        ResetPasswordResponse response = userServiceImpl.resetPassword(1);

        assertNotNull(response.tempPassword());
        assertEquals(12, response.tempPassword().length());
        assertTrue(existing.isEnabled());
        verify(passwordEncoder).encode(response.tempPassword());
        verify(userRepository).save(existing);
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
