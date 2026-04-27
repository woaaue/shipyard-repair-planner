package com.shipyard.fleet.integration;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ProcessedEventStore {

    private final Set<UUID> processed = ConcurrentHashMap.newKeySet();

    public boolean isProcessed(UUID eventId) {
        return processed.contains(eventId);
    }

    public void markProcessed(UUID eventId) {
        processed.add(eventId);
    }
}
