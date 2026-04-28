package com.shipyard.fleet.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EventContractValidatorTest {

    private final EventContractValidator validator = new EventContractValidator();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void acceptsValidEventEnvelope() throws Exception {
        String raw = """
                {
                  "eventId": "8603312a-bf93-4f94-b5db-c812d6b23999",
                  "eventType": "repair.schedule.requested",
                  "occurredAt": "2026-04-27T12:50:00Z",
                  "source": "repair-planning-service",
                  "version": 1,
                  "payload": {"repairId": 32}
                }
                """;

        assertDoesNotThrow(() -> validator.validate(objectMapper.readTree(raw)));
    }

    @Test
    void rejectsEventWithInvalidVersion() throws Exception {
        String raw = """
                {
                  "eventId": "8603312a-bf93-4f94-b5db-c812d6b23999",
                  "eventType": "repair.schedule.requested",
                  "occurredAt": "2026-04-27T12:50:00Z",
                  "source": "repair-planning-service",
                  "version": "v1",
                  "payload": {"repairId": 32}
                }
                """;

        assertThrows(IllegalArgumentException.class, () -> validator.validate(objectMapper.readTree(raw)));
    }
}
