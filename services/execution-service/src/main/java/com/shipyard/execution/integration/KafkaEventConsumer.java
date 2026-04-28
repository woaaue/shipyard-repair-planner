package com.shipyard.execution.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.stereotype.Component;
import org.springframework.messaging.handler.annotation.Header;

import java.util.UUID;

@Component
public class KafkaEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventConsumer.class);

    private final ObjectMapper objectMapper;
    private final EventContractValidator eventContractValidator;
    private final ProcessedEventStore processedEventStore;
    private final DeadLetterPublisher deadLetterPublisher;

    public KafkaEventConsumer(
            ObjectMapper objectMapper,
            EventContractValidator eventContractValidator,
            ProcessedEventStore processedEventStore,
            DeadLetterPublisher deadLetterPublisher
    ) {
        this.objectMapper = objectMapper;
        this.eventContractValidator = eventContractValidator;
        this.processedEventStore = processedEventStore;
        this.deadLetterPublisher = deadLetterPublisher;
    }

    @KafkaListener(topics = {"repair.request.approved", "repair.schedule.validated"}, groupId = "execution-service")
    public void handleEvent(String raw, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        final int maxAttempts = 3;
        Exception lastError = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                JsonNode root = objectMapper.readTree(raw);
                eventContractValidator.validate(root);
                UUID eventId = UUID.fromString(root.path("eventId").asText());
                if (processedEventStore.isProcessed(eventId)) {
                    return;
                }
                processedEventStore.markProcessed(eventId);
                log.info("Execution service consumed event {}", root.path("eventType").asText());
                return;
            } catch (Exception ex) {
                lastError = ex;
                log.warn("Execution service attempt {}/{} failed for topic {}", attempt, maxAttempts, topic, ex);
            }
        }

        deadLetterPublisher.publish(topic, raw, lastError == null ? "unknown error" : lastError.getMessage());
        log.error("Execution service moved event from topic {} to DLQ after {} attempts", topic, maxAttempts);
    }
}
