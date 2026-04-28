# Event Contracts: Planning <-> Fleet

## Transport

1. Broker: Kafka.
2. Encoding: JSON.
3. Shared metadata:
- `eventId` (UUID)
- `eventType` (string)
- `occurredAt` (ISO-8601)
- `source` (service name)
- `version` (integer)

## Topics

### 1. `dock.capacity.changed` (fleet -> planning)

Used by planning to recalculate schedules.

```json
{
  "eventId": "8b65d63c-028f-48df-9ff7-b95b9a8dfb5f",
  "eventType": "dock.capacity.changed",
  "occurredAt": "2026-04-27T12:40:00Z",
  "source": "fleet-service",
  "version": 1,
  "payload": {
    "dockId": 2,
    "dockName": "Dock 2",
    "status": "MAINTENANCE",
    "maxLength": 240,
    "maxWidth": 40,
    "maxDraft": 12
  }
}
```

### 2. `ship.status.changed` (fleet -> planning)

Used by planning to update request readiness.

```json
{
  "eventId": "4a63f2b8-c0fc-4e4c-9303-02ec6c1f6055",
  "eventType": "ship.status.changed",
  "occurredAt": "2026-04-27T12:45:00Z",
  "source": "fleet-service",
  "version": 1,
  "payload": {
    "shipId": 20,
    "shipName": "North Wind",
    "status": "WAITING",
    "dockId": 2
  }
}
```

### 3. `repair.schedule.requested` (planning -> fleet)

Used by fleet to validate dock assignment constraints.

```json
{
  "eventId": "8603312a-bf93-4f94-b5db-c812d6b23999",
  "eventType": "repair.schedule.requested",
  "occurredAt": "2026-04-27T12:50:00Z",
  "source": "repair-planning-service",
  "version": 1,
  "payload": {
    "repairRequestId": 91,
    "repairId": 32,
    "shipId": 20,
    "dockId": 2,
    "scheduledStartDate": "2026-05-02T08:00:00Z",
    "scheduledEndDate": "2026-05-10T18:00:00Z"
  }
}
```

### 4. `repair.schedule.validated` (fleet -> planning)

Used by planning to confirm or reject assignment.

```json
{
  "eventId": "15f2dfb8-c860-4557-85c0-3c6e0f4936e4",
  "eventType": "repair.schedule.validated",
  "occurredAt": "2026-04-27T12:51:00Z",
  "source": "fleet-service",
  "version": 1,
  "payload": {
    "repairId": 32,
    "dockId": 2,
    "isValid": true,
    "reason": null
  }
}
```

## Compatibility rules

1. Consumers ignore unknown fields.
2. Breaking change requires version bump.
3. Event names are immutable after production adoption.
4. Consumer processing policy:
- Validate envelope fields (`eventId`, `eventType`, `occurredAt`, `source`, `version`, `payload`).
- Retry up to 3 attempts.
- After final failure, publish original event to DLQ topic `<source-topic>.dlq`.
