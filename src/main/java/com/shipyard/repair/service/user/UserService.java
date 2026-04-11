package com.shipyard.repair.service.user;

import com.shipyard.repair.dto.user.CreateUserRequest;
import com.shipyard.repair.dto.user.UserResponse;

public interface UserService {

    UserResponse createUser(CreateUserRequest request);
}
