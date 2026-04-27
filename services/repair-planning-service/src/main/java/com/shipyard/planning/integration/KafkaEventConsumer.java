package com.shipyard.planning.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class KafkaEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventConsumer.class);

    private final ObjectMapper objectMapper;
    private final ProcessedEventStore processedEventStore;

    public KafkaEventConsumer(ObjectMapper objectMapper, ProcessedEventStore processedEventStore) {
        this.objectMapper = objectMapper;
        this.processedEventStore = processedEventStore;
    }

    @KafkaListener(topics = {
            "work.item.status.changed",
            "downtime.registered",
            "issue.reported",
            "dock.capacity.changed",
            "ship.status.changed",
            "repair.schedule.validated"
    }, groupId = "repair-planning-service")
    public void handleEvent(String raw) {
        try {
            JsonNode root = objectMapper.readTree(raw);
            UUID eventId = UUID.fromString(root.path("eventId").asText());
            if (processedEventStore.isProcessed(eventId)) {
                return;
            }
            processedEventStore.markProcessed(eventId);
            log.info("Planning service consumed event {}", root.path("eventType").asText());
        } catch (Exception ex) {
            log.error("Planning service failed to process inbound event", ex);
        }
    }
}
