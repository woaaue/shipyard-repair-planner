# Local Microservices Foundation

This directory contains local infrastructure required to start the microservice transition without affecting the existing monolith setup.

## What is included

1. Postgres database for service data.
2. Redis for caching/session workloads.
3. Kafka + Zookeeper for domain events.
4. Keycloak for centralized identity (planned integration).
5. API gateway placeholder container for route-level validation.

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

## Notes

1. Existing monolith `docker-compose.yml` remains unchanged.
2. This compose file is intentionally infrastructure-only for stage-by-stage migration.
