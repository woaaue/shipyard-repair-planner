# Local Microservices Foundation

This directory contains local infrastructure required to start the microservice transition without affecting the existing monolith setup.

## What is included

1. Postgres database for service data.
2. Redis for caching/session workloads.
3. Kafka + Zookeeper for domain events.
4. Keycloak for centralized identity (planned integration).
5. Notification service (`/api/notifications`).
6. Audit service (`/api/audit-logs`).
7. Execution service (`/api/work-items`, `/api/issues`, `/api/downtimes`).
8. Repair planning service (`/api/repair-requests`, `/api/repairs`).
9. Fleet service (`/api/ships`, `/api/docks`, `/api/shipyards`).
10. Identity service (`/api/auth`, `/api/users`).
11. API gateway with initial routing for extracted services.

## Quick start

1. Copy env template:
```bash
cp .env.example .env
```

2. Start local infrastructure:
```bash
docker compose -f docker-compose.yml --env-file .env up -d
```

3. Stop infrastructure:
```bash
docker compose -f docker-compose.yml --env-file .env down
```

## Smoke checks

1. Gateway health:
```bash
curl http://localhost:8088/health
```

2. Notifications via gateway:
```bash
curl http://localhost:8088/api/notifications
```

3. Audit logs via gateway:
```bash
curl http://localhost:8088/api/audit-logs
```

4. Work items via gateway:
```bash
curl http://localhost:8088/api/work-items
```

5. Issues via gateway:
```bash
curl http://localhost:8088/api/issues
```

6. Downtimes via gateway:
```bash
curl http://localhost:8088/api/downtimes
```

7. Repair requests via gateway:
```bash
curl http://localhost:8088/api/repair-requests
```

8. Repairs via gateway:
```bash
curl http://localhost:8088/api/repairs
```

9. Ships via gateway:
```bash
curl http://localhost:8088/api/ships
```

10. Docks via gateway:
```bash
curl http://localhost:8088/api/docks
```

11. Shipyards via gateway:
```bash
curl http://localhost:8088/api/shipyards
```

12. Auth login via gateway:
```bash
curl -X POST http://localhost:8088/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@shipyard.local\",\"password\":\"admin12345\"}"
```

13. Users via gateway:
```bash
curl http://localhost:8088/api/users
```

14. Service health (example: execution):
```bash
curl http://localhost:8093/actuator/health
```

15. Service readiness (example: execution):
```bash
curl http://localhost:8093/actuator/health/readiness
```

16. Service metrics (example: execution):
```bash
curl http://localhost:8093/actuator/prometheus
```

17. Trace/span in logs (example):
```bash
# look for correlation pattern: [traceId,spanId]
docker logs execution-service
```

18. Authenticated API call (example):
```bash
curl http://localhost:8088/api/work-items -H "Authorization: Bearer <jwt>"
```

19. Shadow mode parity-check (monolith vs gateway):
```powershell
powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-shadow-parity-check.ps1
```
Output report:
- `infra/microservices/shadow-parity-report.json`

20. Gateway smoke-check after traffic switch:
```powershell
powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-gateway-smoke-check.ps1
```

## Notes

1. Existing monolith `docker-compose.yml` remains unchanged.
2. This compose file is intentionally infrastructure-only for stage-by-stage migration.
