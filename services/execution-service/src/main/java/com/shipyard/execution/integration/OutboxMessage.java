package com.shipyard.execution.integration;

public record OutboxMessage(
        String topic,
        EventEnvelope envelope
) {
}
