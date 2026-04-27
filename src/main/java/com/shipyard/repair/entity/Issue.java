package com.shipyard.repair.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "issues")
@Getter
@Setter
@NoArgsConstructor
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repair_id", nullable = false)
    private Repair repair;

    @Column(name = "issue_type", nullable = false, length = 120)
    private String issueType;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false, length = 50)
    private String impact;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "reported_by", nullable = false, length = 120)
    private String reportedBy;

    @Column(name = "reported_at", nullable = false)
    private LocalDateTime reportedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    private void onCreate() {
        if (reportedAt == null) {
            this.reportedAt = LocalDateTime.now();
        }
    }
}
