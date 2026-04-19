package com.shipyard.repair.controller;

import com.shipyard.repair.dto.user.CreateUserRequest;
import com.shipyard.repair.dto.user.ResetPasswordResponse;
import com.shipyard.repair.dto.user.UpdateUserRequest;
import com.shipyard.repair.dto.user.UserResponse;
import com.shipyard.repair.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.status(HttpStatus.OK)
                .body(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(userService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest createUserRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.createUser(createUserRequest));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Integer id, @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(userService.updateUser(id, request));
    }

    @PostMapping("/{id}/block")
    public ResponseEntity<UserResponse> blockUser(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(userService.blockUser(id));
    }

    @PostMapping("/{id}/unblock")
    public ResponseEntity<UserResponse> unblockUser(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(userService.unblockUser(id));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ResetPasswordResponse> resetPassword(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(userService.resetPassword(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserById(@PathVariable Integer id) {
        userService.deleteUserById(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
