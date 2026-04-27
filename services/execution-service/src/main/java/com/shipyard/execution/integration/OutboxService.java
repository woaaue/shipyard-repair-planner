package com.shipyard.execution.integration;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
public class OutboxService {

    private final Queue<OutboxMessage> queue = new ConcurrentLinkedQueue<>();

    public void enqueue(String topic, String eventType, Map<String, Object> payload) {
        queue.add(new OutboxMessage(
                topic,
                new EventEnvelope(
                        UUID.randomUUID(),
                        eventType,
                        Instant.now(),
                        "execution-service",
                        1,
                        payload
                )
        ));
    }

    public List<OutboxMessage> pollBatch(int limit) {
        List<OutboxMessage> result = new ArrayList<>();
        for (int i = 0; i < limit; i++) {
            OutboxMessage message = queue.poll();
            if (message == null) {
                break;
            }
            result.add(message);
        }
        return result;
    }
}
