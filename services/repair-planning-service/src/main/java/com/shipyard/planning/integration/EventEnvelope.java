package com.shipyard.planning.integration;

import java.time.Instant;
import java.util.UUID;

public record EventEnvelope(
        UUID eventId,
        String eventType,
        Instant occurredAt,
        String source,
        int version,
        Object payload
) {
}
