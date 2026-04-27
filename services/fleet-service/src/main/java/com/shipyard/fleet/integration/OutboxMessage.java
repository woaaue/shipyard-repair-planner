package com.shipyard.fleet.integration;

public record OutboxMessage(
        String topic,
        EventEnvelope envelope
) {
}
