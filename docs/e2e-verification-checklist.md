# E2E Verification Checklist (Cutover)

## Purpose

Single execution checklist for validating cutover readiness in a live environment (gateway + extracted services + monolith fallback).

## Preconditions

1. Infrastructure is up:
   - `docker compose -f infra/microservices/docker-compose.yml --env-file infra/microservices/.env up -d`
2. Gateway is reachable.
3. Monolith is reachable for parity checks, or run with `-SkipParity` if monolith is intentionally offline.

## Full E2E run

```powershell
powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-cutover-e2e-check.ps1
```

## Optional run (without retirement stage)

```powershell
powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-cutover-e2e-check.ps1 -SkipRetirement
```

## Optional run (without parity stage)

```powershell
powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-cutover-e2e-check.ps1 -SkipParity
```

## Pass criteria

1. Shadow parity-check passes with zero mismatches.
2. Gateway contract coverage check passes (stage1 API contract is mapped by gateway routes).
3. Gateway smoke-check passes.
4. Retirement check passes (or intentionally skipped for pre-retirement rehearsal).
5. No critical errors in service logs during the run window.

## Evidence to attach to release/cutover ticket

1. `infra/microservices/shadow-parity-report.json`.
2. Console output from `run-cutover-e2e-check.ps1`.
3. Short note with timestamp, environment, and operator name.
