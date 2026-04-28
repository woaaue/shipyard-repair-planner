package com.shipyard.execution.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class DeadLetterPublisher {

    private static final Logger log = LoggerFactory.getLogger(DeadLetterPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public DeadLetterPublisher(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publish(String sourceTopic, String rawEvent, String errorMessage) {
        try {
            Map<String, Object> dlqMessage = new LinkedHashMap<>();
            dlqMessage.put("sourceTopic", sourceTopic);
            dlqMessage.put("failedAt", OffsetDateTime.now().toString());
            dlqMessage.put("error", errorMessage);
            dlqMessage.put("event", objectMapper.readTree(rawEvent));
            kafkaTemplate.send(sourceTopic + ".dlq", objectMapper.writeValueAsString(dlqMessage));
        } catch (Exception ex) {
            log.error("Failed to publish event to DLQ for topic {}", sourceTopic, ex);
        }
    }
}
