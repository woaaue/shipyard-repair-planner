package com.shipyard.repair.entity;

import com.shipyard.repair.embeddable.ShipyardAddress;
import com.shipyard.repair.enums.ShipyardStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "shipyards")
@Getter @Setter
@NoArgsConstructor
public class Shipyard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, length = 50, unique = true)
    private String name;

    @Embedded
    private ShipyardAddress shipyardAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ShipyardStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    private void OnCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    private void OnUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
