# Shipyard Repair Planner: Microservices Roadmap

## Target Architecture

The current codebase is a modular monolith. The migration target is a domain-oriented microservice architecture with clear ownership and async integration between services.

### Planned services

1. Identity Service
- Users, roles, authentication, token issuing/validation.

2. Fleet Service
- Ships, shipyards, docks, dock dimensions and availability state.

3. Repair Planning Service
- Repair requests, approvals, repair scheduling, repair lifecycle.

4. Execution Service
- Work items, issue tracking, dock downtimes, progress updates.

5. Notification Service
- User notifications, delivery channels, read/unread status.

6. Audit Service
- Immutable audit records, query API for reports and investigations.

## Integration style

1. Synchronous APIs
- Public and internal APIs via HTTP/JSON.
- Gateway routes external traffic.

2. Asynchronous events
- Domain events via Kafka.
- Examples: `repair.request.approved`, `repair.started`, `downtime.registered`, `work-item.completed`.
- Contract draft: see `docs/event-contracts-planning-execution.md`.
- Contract draft (planning/fleet): see `docs/event-contracts-planning-fleet.md`.

## Data ownership boundaries

1. Each service owns its database schema.
2. No cross-service table joins.
3. Read models are built by API composition or projected views.

## Migration phases

1. Foundation (current stage)
- Shared infra for local microservice development.
- Domain boundaries and contracts documented.

2. Extraction wave 1
- Extract Notification and Audit services first (low coupling, high value).
- Status: delivered (service skeletons and gateway routes added).

3. Extraction wave 2
- Extract Execution service (work items/issues/downtimes).
- Status: delivered (service skeleton and gateway routes added).

4. Extraction wave 3
- Extract Repair Planning service and integrate with Fleet service.
- Status: in progress (planning and fleet service skeletons with gateway routes added).

5. Finalization
- Split Identity and Fleet if still hosted in monolith.
- Decommission monolith endpoints behind gateway.
- Status: in progress (Kafka outbox/idempotency foundation added for planning/execution/fleet, identity-service extracted, legacy API cutover barrier enabled at gateway).
- Legacy cutover notes: `docs/legacy-cutover-plan.md`.

## Non-functional requirements

1. Traceability: distributed tracing for all cross-service calls.
 - Status: delivered baseline (Micrometer tracing enabled with OTel bridge, 100% sampling for local environment, trace/span correlation pattern in logs).
2. Reliability: idempotent event handlers and retry policy.
 - Status: delivered baseline (event envelope validation, 3-attempt consumer retry, DLQ publish to `<topic>.dlq`).
3. Security: JWT + role checks at gateway and service level.
 - Status: delivered baseline (JWT validation filter and role-based access policy enabled in extracted services; `/api/auth/**` open only in identity-service, write operations restricted to non-client roles).
4. Observability: unified logs, service health probes, metrics.
 - Status: delivered baseline (`/actuator/health`, `/actuator/health/readiness`, `/actuator/prometheus` enabled for extracted services).
