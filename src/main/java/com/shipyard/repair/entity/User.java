package com.shipyard.repair.entity;

import com.shipyard.repair.converter.UserRoleConverter;
import com.shipyard.repair.enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, length = 50, unique = true)
    private String email;

    @Column(name = "encoded_password", nullable = false)
    private String encodedPassword;

    @Column(nullable = false, length = 50)
    private String firstName;

    @Column(nullable = false, length = 50)
    private String lastName;

    @Column(length = 50)
    private String patronymic;

    @Column(nullable = false)
    @Convert(converter = UserRoleConverter.class)
    private UserRole role;

    @Column(nullable = false)
    private boolean enabled;

    @Column(nullable = false)
    private LocalDate createdAt;

    @Column(nullable = false)
    private LocalDate updatedAt;

//    TO DO: added entity
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "dock_id", nullable = false)
//    private Dock dock;

    @PrePersist
    private void onCreate() {
        createdAt = LocalDate.now();
        updatedAt = LocalDate.now();
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = LocalDate.now();
    }
}
