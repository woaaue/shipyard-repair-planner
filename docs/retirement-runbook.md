# Legacy Monolith Retirement Runbook

## Goal

Disable direct legacy monolith API exposure and keep only microservice gateway as the external API entrypoint.

## Preconditions

1. Shadow mode parity-check completed with no critical mismatches.
2. Traffic migration completed and stable during rollback window.
3. Incident owner and rollback owner assigned.

## Retirement steps

1. Remove public ingress/load-balancer route for monolith `/api/*`.
2. Keep monolith reachable only from internal network (admin/maintenance scope).
3. Verify gateway still serves extracted routes and returns `410 Gone` for unmapped `/api/*`.
4. Run retirement verification script:
   - `powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-retirement-check.ps1`
5. Publish retirement completion note with timestamp and owner.

## Rollback

1. Re-enable monolith ingress route only if gateway-based API has critical outage.
2. Limit rollback window and log exact reason/endpoints impacted.
3. Open follow-up action items before repeating retirement.

## Completion criteria

1. Direct monolith API route is not publicly reachable.
2. Gateway route set is healthy and validated by smoke checks.
3. Retirement verification script passes.
