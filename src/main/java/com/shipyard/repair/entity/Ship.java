package com.shipyard.repair.entity;

import com.shipyard.repair.embeddable.ShipDimensions;
import com.shipyard.repair.enums.ShipStatus;
import com.shipyard.repair.enums.ShipType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ships")
@Getter @Setter
@NoArgsConstructor
public class Ship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "reg_number", nullable = false, length = 20, unique = true)
    private String regNumber;

    @Column(nullable = false, length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShipType shipType;

    @Embedded
    private ShipDimensions shipDimensions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShipStatus shipStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dock_id")
    private Dock dock;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    private void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    private void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
