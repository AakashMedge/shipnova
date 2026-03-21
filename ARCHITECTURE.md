# Architecture Overview

## 1. High-Level Design
Shipnova follows a two-tier architecture:
- Next.js frontend for role-specific user interfaces
- Express + MongoDB backend for API, business rules, and persistence

## 2. Multi-Tenant Model
- `tenant_id` is used across tenant-scoped entities.
- Access is enforced in controllers and middleware by comparing user tenant context with resource tenant.
- Hub chat is isolated by both `tenant_id` and `hub`.

## 3. Core Domain Collections
- `tenants` - courier organizations and subscription state
- `users` - all platform users and roles
- `shipments` - parcel records and current state
- `shipmentevents` - immutable tracking history events
- `hubs` - sorting/distribution hubs
- `plans` - subscription plans
- `auditlogs` - operational audit entries
- `hubchatmessages` - admin/hub communication scoped to hub+tenant

## 4. Role-Based Access
- Super Admin: platform-level management
- Company Admin: shipment/hub/agent operations inside own tenant
- Hub Manager: assigned hub operations and chat
- Agent: delivery execution and status updates
- Customer: tracking and own shipment visibility

## 5. Shipment Lifecycle
Supported statuses:
1. Created
2. Picked Up
3. At Sorting Facility
4. In Transit
5. Out for Delivery
6. Delivered
7. Failed / Retry / Returned

Each transition writes tracking history and event records.

## 6. Security Controls
- JWT authentication (`Authorization: Bearer`)
- Role authorization middleware
- Backend validation via `express-validator`
- Rate limiting on API/auth/tracking routes
- File upload restrictions (type + size)
- Tenant and hub-level authorization checks
- Audit logging for key actions

## 7. Real-Time Behavior Strategy
- Frontend uses polling for near-real-time UX (dashboard/tracking/chat refresh).
- Optional Redis cache is used for tracking and analytics acceleration.

## 8. Advanced Enhancements Implemented
- AI-based delivery prediction and AI dispatch insights
- QR generation and scanner workflows
- Mobile-friendly delivery agent interface
- Simulated live GPS/telemetry updates in tracking and agent flows

## 9. Key Flow Example (Hub Chat Isolation)
1. Admin opens hub-specific chat route
2. Hub Manager opens own hub chat
3. Backend validates:
   - same tenant
   - hub manager belongs to that hub
4. Messages are persisted with `tenant_id + hub` and only returned to same scope
