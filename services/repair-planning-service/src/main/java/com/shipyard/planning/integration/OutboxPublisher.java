package com.shipyard.planning.integration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final OutboxService outboxService;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public OutboxPublisher(OutboxService outboxService, KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.outboxService = outboxService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelay = 2000)
    public void publishPending() {
        outboxService.pollBatch(100).forEach(message -> {
            try {
                String json = objectMapper.writeValueAsString(message.envelope());
                kafkaTemplate.send(message.topic(), json);
            } catch (JsonProcessingException ex) {
                log.error("Failed to serialize outbox event {}", message.envelope().eventType(), ex);
            }
        });
    }
}
