package com.shipyard.fleet.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class EventContractValidator {

    public void validate(JsonNode root) {
        requireText(root, "eventId");
        requireText(root, "eventType");
        requireText(root, "occurredAt");
        requireText(root, "source");

        if (!root.has("version") || !root.get("version").canConvertToInt()) {
            throw new IllegalArgumentException("Missing or invalid event field: version");
        }

        JsonNode payload = root.get("payload");
        if (payload == null || !payload.isObject()) {
            throw new IllegalArgumentException("Missing or invalid event field: payload");
        }
    }

    private void requireText(JsonNode root, String field) {
        JsonNode value = root.get(field);
        if (value == null || !value.isTextual() || value.asText().isBlank()) {
            throw new IllegalArgumentException("Missing or invalid event field: " + field);
        }
    }
}
