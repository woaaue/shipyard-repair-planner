# Traffic Migration Runbook (Gateway 100%)

## Goal

Switch all external API traffic to the microservice gateway and keep monolith only as rollback fallback during the control window.

## Preconditions

1. Shadow parity-check passed with zero mismatches:
   - `powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-shadow-parity-check.ps1`
2. All gateway-backed services are healthy (`/actuator/health` and `/actuator/health/readiness`).
3. Deployment window is approved and rollback owner is assigned.

## Migration steps

1. Freeze direct monolith API exposure at ingress/load balancer level.
2. Route 100% external `/api/*` traffic to gateway endpoint (`:8088` in local setup).
3. Keep monolith runtime online, but not publicly routed.
4. Run gateway smoke-check:
   - `powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-gateway-smoke-check.ps1`
5. Monitor error rates, p95 latency, and Kafka consumer lag for rollback window.

## Rollback window

1. Recommended minimum window: 48 hours after traffic switch.
2. Rollback trigger examples:
   - Critical endpoint availability below SLO.
   - Persistent functional mismatch vs expected domain behavior.
   - Unrecoverable event processing lag/error spike.
3. Rollback action:
   - Re-enable monolith ingress route.
   - Shift `/api/*` traffic back from gateway to monolith.
   - Keep incident record with timestamps and affected endpoints.

## Completion criteria

1. Smoke-check passes after switch.
2. No critical regression during rollback window.
3. Incident-free cutover approved by service owners.
