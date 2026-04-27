package com.shipyard.planning.integration;

public record OutboxMessage(
        String topic,
        EventEnvelope envelope
) {
}
