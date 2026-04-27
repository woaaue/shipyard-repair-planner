# Legacy Monolith Cutover Plan

## Goal

Phase out monolith API traffic behind the gateway after microservices become stable.

## Current routing state

1. Gateway routes active for:
- `/api/notifications`
- `/api/audit-logs`
- `/api/work-items`
- `/api/issues`
- `/api/downtimes`
- `/api/repair-requests`
- `/api/repairs`
- `/api/ships`
- `/api/docks`
- `/api/shipyards`

2. Monolith endpoints remain in codebase as fallback implementation.

## Cutover phases

1. Shadow mode
- Keep monolith running in parallel.
- Compare key responses (status code + payload shape) for critical endpoints.

2. Traffic migration
- Route 100% gateway traffic to microservices.
- Keep monolith only for rollback window.

3. Deprecation notice
- Publish deprecation date for legacy monolith endpoints.
- Return deprecation headers for any direct monolith API calls.

4. Retirement
- Disable direct monolith API exposure.
- Keep only internal admin/maintenance paths if needed.

## Exit criteria

1. No critical regression for 2 consecutive release cycles.
2. Kafka event lag and consumer errors under agreed SLO.
3. Rollback playbook validated in staging.
