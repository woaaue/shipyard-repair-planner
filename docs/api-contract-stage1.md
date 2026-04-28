# API Contract Baseline (Stage 1)

This file captures the agreed backend API surface used by frontend services after stage 1 alignment.

## Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Users

- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `POST /api/users/{id}/block`
- `POST /api/users/{id}/unblock`
- `POST /api/users/{id}/reset-password`
- `DELETE /api/users/{id}`

## Docks

- `GET /api/docks`
- `GET /api/docks/{id}`
- `POST /api/docks`
- `PUT /api/docks/{id}`
- `GET /api/docks/{id}/schedule`
- `GET /api/docks/{id}/load`
- `DELETE /api/docks/{id}`

## Ships

- `GET /api/ships?search=&status=`
- `GET /api/ships/{id}`
- `POST /api/ships`
- `PUT /api/ships/{id}`
- `DELETE /api/ships/{id}`

## Repair Requests

- `GET /api/repair-requests?clientId=&shipId=&status=`
- `GET /api/repair-requests/{id}`
- `POST /api/repair-requests`
- `PUT /api/repair-requests/{id}`
- `PATCH /api/repair-requests/{id}/status`
- `DELETE /api/repair-requests/{id}`

## Repairs

- `GET /api/repairs?dockId=&repairRequestId=&status=`
- `GET /api/repairs/{id}`
- `POST /api/repairs`
- `PUT /api/repairs/{id}`
- `PATCH /api/repairs/{id}/status`
- `DELETE /api/repairs/{id}`

## Work Items

- `GET /api/work-items?repairRequestId=&repairId=&category=&status=`
- `GET /api/work-items/{id}`
- `POST /api/work-items`
- `PUT /api/work-items/{id}`
- `PATCH /api/work-items/{id}/status`
- `DELETE /api/work-items/{id}`
