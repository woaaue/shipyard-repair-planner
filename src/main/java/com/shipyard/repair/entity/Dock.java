package com.shipyard.repair.entity;

import com.shipyard.repair.converter.DockStatusConverter;
import com.shipyard.repair.embeddable.DockDimensions;
import com.shipyard.repair.enums.DockStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "docks")
@Getter @Setter
@NoArgsConstructor
public class Dock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, length = 100)
    private String name;

    @Embedded
    private DockDimensions dimensions;

    @Column(nullable = false, length = 50)
    @Convert(converter = DockStatusConverter.class)
    private DockStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipyard_id", nullable = false)
    private Shipyard shipyard;

    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDate updatedAt;

    @PrePersist
    private void onCreate() {
        this.createdAt = LocalDate.now();
        this.updatedAt = LocalDate.now();
    }

    @PreUpdate
    private void onUpdate() {
        this.updatedAt = LocalDate.now();
    }
}
