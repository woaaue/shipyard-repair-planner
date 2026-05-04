package com.shipyard.repair.service.user;

import com.shipyard.repair.dto.user.CreateUserRequest;
import com.shipyard.repair.dto.user.ResetPasswordResponse;
import com.shipyard.repair.dto.user.UpdateUserRequest;
import com.shipyard.repair.dto.user.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();
    UserResponse getUserById(Integer id);
    List<UserResponse> getSubordinates(Integer id);
    UserResponse createUser(CreateUserRequest request);
    UserResponse updateUser(Integer id, UpdateUserRequest request);
    UserResponse blockUser(Integer id);
    UserResponse unblockUser(Integer id);
    ResetPasswordResponse resetPassword(Integer id);
    void deleteUserById(Integer id);
}
