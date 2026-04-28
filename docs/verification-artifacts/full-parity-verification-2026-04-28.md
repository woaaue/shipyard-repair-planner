# Full Parity Verification - 2026-04-28

## Environment

- Date: 2026-04-28
- Microservices stack: `infra/microservices/docker-compose.yml`
- Monolith: local `mvn spring-boot:run` on `:8080`

## Monolith run overrides

- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/shipyard_microservices`
- `SPRING_DATASOURCE_USERNAME=postgres`
- `SPRING_DATASOURCE_PASSWORD=postgres`
- `JWT_SECRET=<base64 local dev value>`
- `JWT_EXPIRATION_MS=86400000`

## Executed checks

1. `run-cutover-e2e-check.ps1` (full mode, without skip flags)

## Result

1. Shadow parity-check: passed (`Matched: 11/11`, `Mismatched: 0`)
2. Gateway contract coverage check: passed
3. Gateway smoke-check: passed
4. Retirement check: passed
5. Full cutover E2E: passed

## Logs

- `docs/verification-artifacts/full-parity-e2e.log`
