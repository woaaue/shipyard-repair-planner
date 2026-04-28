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
- `/api/auth`
- `/api/users`

2. Monolith endpoints remain in codebase as fallback implementation.

## Cutover phases

1. Shadow mode
- Keep monolith running in parallel.
- Compare key responses (status code + payload shape) for critical endpoints.
 - Status: delivered baseline (automated parity-check script at `infra/microservices/scripts/run-shadow-parity-check.ps1`, JSON report output for mismatch tracking).

2. Traffic migration
- Route 100% gateway traffic to microservices.
- Keep monolith only for rollback window.
- Status: delivered baseline (step-by-step runbook at `docs/traffic-migration-runbook.md` and automated gateway smoke-check at `infra/microservices/scripts/run-gateway-smoke-check.ps1`).

3. Deprecation notice
- Publish deprecation date for legacy monolith endpoints.
- Return deprecation headers for any direct monolith API calls.
 - Status: delivered baseline (`Deprecation`, `Sunset`, `Link` headers on `/api/*` responses).
 - Gateway returns `410 Gone` for unmapped `/api/*` routes (explicit cutover barrier).

4. Retirement
- Disable direct monolith API exposure.
- Keep only internal admin/maintenance paths if needed.
- Status: delivered baseline (retirement runbook at `docs/retirement-runbook.md` and verification script at `infra/microservices/scripts/run-retirement-check.ps1`).

## Exit criteria

1. No critical regression for 2 consecutive release cycles.
2. Kafka event lag and consumer errors under agreed SLO.
3. Rollback playbook validated in staging (E2E checklist: `docs/e2e-verification-checklist.md`).
4. Direct monolith `/api/*` public route removed and retirement check passed.
