package com.shipyard.identity.controller;

import com.shipyard.identity.dto.user.CreateUserRequest;
import com.shipyard.identity.dto.user.ResetPasswordResponse;
import com.shipyard.identity.dto.user.UpdateUserRequest;
import com.shipyard.identity.dto.user.UserResponse;
import com.shipyard.identity.service.IdentityStore;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final IdentityStore identityStore;

    public UserController(IdentityStore identityStore) {
        this.identityStore = identityStore;
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.status(HttpStatus.OK).body(identityStore.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK).body(identityStore.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(identityStore.createUser(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Integer id, @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.status(HttpStatus.OK).body(identityStore.updateUser(id, request));
    }

    @PostMapping("/{id}/block")
    public ResponseEntity<UserResponse> blockUser(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK).body(identityStore.blockUser(id));
    }

    @PostMapping("/{id}/unblock")
    public ResponseEntity<UserResponse> unblockUser(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK).body(identityStore.unblockUser(id));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ResetPasswordResponse> resetPassword(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK).body(identityStore.resetPassword(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserById(@PathVariable Integer id) {
        identityStore.deleteUserById(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
