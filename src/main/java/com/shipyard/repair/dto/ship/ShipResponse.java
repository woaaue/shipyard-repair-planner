package com.shipyard.repair.dto.ship;

import com.shipyard.repair.enums.ShipStatus;
import com.shipyard.repair.enums.ShipType;

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
