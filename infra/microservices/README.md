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
8. API gateway with initial routing for extracted services.

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

## Notes

1. Existing monolith `docker-compose.yml` remains unchanged.
2. This compose file is intentionally infrastructure-only for stage-by-stage migration.
