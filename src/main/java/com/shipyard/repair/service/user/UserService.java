package com.shipyard.repair.service.user;

import com.shipyard.repair.dto.user.CreateUserRequest;
import com.shipyard.repair.dto.user.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();
    UserResponse getUserById(Integer id);
    UserResponse createUser(CreateUserRequest request);
    void deleteUserById(Integer id);
}
