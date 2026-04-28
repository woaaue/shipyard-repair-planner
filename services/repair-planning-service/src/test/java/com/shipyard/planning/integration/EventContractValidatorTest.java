package com.shipyard.planning.integration;

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
                  "eventId": "574f3f45-c7ea-4f89-b4a4-88b5b73fba8b",
                  "eventType": "work.item.status.changed",
                  "occurredAt": "2026-04-27T12:10:00Z",
                  "source": "execution-service",
                  "version": 1,
                  "payload": {"workItemId": 501}
                }
                """;

        assertDoesNotThrow(() -> validator.validate(objectMapper.readTree(raw)));
    }

    @Test
    void rejectsEventWithoutEventId() throws Exception {
        String raw = """
                {
                  "eventType": "work.item.status.changed",
                  "occurredAt": "2026-04-27T12:10:00Z",
                  "source": "execution-service",
                  "version": 1,
                  "payload": {"workItemId": 501}
                }
                """;

        assertThrows(IllegalArgumentException.class, () -> validator.validate(objectMapper.readTree(raw)));
    }
}
