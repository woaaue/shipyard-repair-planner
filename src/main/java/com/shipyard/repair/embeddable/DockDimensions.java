package com.shipyard.repair.embeddable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter @Setter
@NoArgsConstructor
public class DockDimensions {

    @Column(name = "max_length", nullable = false)
    private Integer maxLength;

    @Column(name = "max_width", nullable = false)
    private Integer maxWidth;

    @Column(name = "max_draft", nullable = false)
    private Integer maxDraft;
}
