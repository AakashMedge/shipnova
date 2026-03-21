# API Documentation

Base URL (local):
- `http://localhost:5000/api`

Authentication:
- Protected routes require `Authorization: Bearer <token>`

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`
- `GET /auth/agents`
- `POST /auth/agents`
- `PATCH /auth/agents/:id`

## Shipments
- `POST /shipments`
- `GET /shipments`
- `GET /shipments/:id`
- `POST /shipments/:id/assign-agent`
- `PATCH /shipments/:id/status`
- `POST /shipments/:id/status`
- `PUT /shipments/:id`
- `GET /shipments/analytics`
- `POST /shipments/verify-hub`
- `PATCH /shipments/bulk/status`
- `GET /shipments/track/:trackingId`
- `PATCH /shipments/track/:trackingId/status`

## Assessment Alias Tracking Route
- `GET /track/:tracking_id`

## Tenants
- `POST /tenants`
- `GET /tenants`
- `GET /tenants/my-tenant`
- `PATCH /tenants/subscription`
- `GET /tenants/:id`
- `PATCH /tenants/:id/toggle-status`

## Hubs
- `POST /hubs`
- `GET /hubs`
- `GET /hubs/:id`
- `PATCH /hubs/:id`
- `POST /hubs/:hubId/assign-shipment`
- `GET /hubs/:id/incoming`
- `POST /hubs/:id/verify-shipment`
- `GET /hubs/:id/qr`
- `GET /hubs/shipment-qr/:trackingId`
- `POST /hubs/:id/agent-handover`
- `GET /hubs/:id/chat`
- `POST /hubs/:id/chat`

## Plans
- `GET /plans`
- `POST /plans`
- `PUT /plans/:id`
- `DELETE /plans/:id`

## Super Admin
- `POST /super-admin/login`
- `GET /super-admin/stats`
- `GET /super-admin/admin-requests`
- `GET /super-admin/all-admins`
- `PATCH /super-admin/admin-requests/:id/approve`
- `PATCH /super-admin/admin-requests/:id/reject`
- `POST /super-admin/create-admin`

## Upload
- `POST /upload/pod`

## Postman
- Import collection from: `docs/postman/Shipnova.postman_collection.json`
- Set collection variables:
  - `baseUrl`
  - `token`
  - `trackingId`
  - `shipmentId`
  - `hubId`
