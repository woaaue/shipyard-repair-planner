# Event Contracts: Planning <-> Execution

## Transport

1. Broker: Kafka.
2. Encoding: JSON.
3. Metadata required in all events:
- `eventId` (UUID)
- `eventType` (string)
- `occurredAt` (ISO-8601 datetime)
- `source` (service name)
- `version` (integer)

## Topics and contracts

### 1. `repair.request.approved` (planning -> execution)

Used to create initial execution workload.

```json
{
  "eventId": "8f4f1ca0-0563-4df4-95bc-d26716440ec6",
  "eventType": "repair.request.approved",
  "occurredAt": "2026-04-27T12:00:00Z",
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

### 2. `work.item.status.changed` (execution -> planning)

Used to update execution progress in planning timeline.

```json
{
  "eventId": "574f3f45-c7ea-4f89-b4a4-88b5b73fba8b",
  "eventType": "work.item.status.changed",
  "occurredAt": "2026-04-27T12:10:00Z",
  "source": "execution-service",
  "version": 1,
  "payload": {
    "workItemId": 501,
    "repairId": 32,
    "repairRequestId": 91,
    "status": "IN_PROGRESS",
    "actualHours": 4
  }
}
```

### 3. `downtime.registered` (execution -> planning)

Used to recalculate dock schedule and risks.

```json
{
  "eventId": "f27e3d1a-8ca3-4ad4-a9e8-6f179c5f7bc8",
  "eventType": "downtime.registered",
  "occurredAt": "2026-04-27T12:20:00Z",
  "source": "execution-service",
  "version": 1,
  "payload": {
    "downtimeId": 601,
    "dockName": "Dock 2",
    "reason": "Weather",
    "startDate": "2026-04-27T12:20:00Z",
    "expectedEndDate": "2026-04-27T17:00:00Z"
  }
}
```

### 4. `issue.reported` (execution -> planning)

Used to create replanning tasks for blockers and delays.

```json
{
  "eventId": "6615589b-3e91-4420-88e8-c9089472f1a4",
  "eventType": "issue.reported",
  "occurredAt": "2026-04-27T12:25:00Z",
  "source": "execution-service",
  "version": 1,
  "payload": {
    "issueId": 801,
    "repairId": 32,
    "issueType": "DEFECT",
    "impact": "HIGH",
    "status": "OPEN"
  }
}
```

## Compatibility rules

1. Consumers must ignore unknown fields.
2. Breaking changes require `version` increment.
3. Producers must preserve field semantics for the same version.
4. Consumer processing policy:
- Validate envelope fields (`eventId`, `eventType`, `occurredAt`, `source`, `version`, `payload`).
- Retry up to 3 attempts.
- After final failure, publish original event to DLQ topic `<source-topic>.dlq`.
