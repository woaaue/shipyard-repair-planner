package com.shipyard.execution.integration;

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
                  "eventId": "8f4f1ca0-0563-4df4-95bc-d26716440ec6",
                  "eventType": "repair.request.approved",
                  "occurredAt": "2026-04-27T12:00:00Z",
                  "source": "repair-planning-service",
                  "version": 1,
                  "payload": {"repairRequestId": 91}
                }
                """;

        assertDoesNotThrow(() -> validator.validate(objectMapper.readTree(raw)));
    }

    @Test
    void rejectsEventWithoutPayload() throws Exception {
        String raw = """
                {
                  "eventId": "8f4f1ca0-0563-4df4-95bc-d26716440ec6",
                  "eventType": "repair.request.approved",
                  "occurredAt": "2026-04-27T12:00:00Z",
                  "source": "repair-planning-service",
                  "version": 1
                }
                """;

        assertThrows(IllegalArgumentException.class, () -> validator.validate(objectMapper.readTree(raw)));
    }
}
