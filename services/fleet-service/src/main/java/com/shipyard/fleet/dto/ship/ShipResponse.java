package com.shipyard.fleet.dto.ship;

import com.shipyard.fleet.model.ShipStatus;
import com.shipyard.fleet.model.ShipType;

import java.time.LocalDateTime;

public record ShipResponse(
        int id,
        String regNumber,
        String name,
        ShipType shipType,
        ShipStatus shipStatus,
        ShipDimensionsResponse shipDimensions,
        int userId,
        String ownerName,
        Integer dockId,
        String dockName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
