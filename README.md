# Shipnova - Multi-Tenant Courier Tracking SaaS

This repository contains the submission-ready implementation for the Courier Tracking SaaS assessment.

## 1. Project Overview
Shipnova is a multi-tenant courier platform where each courier company operates as an isolated tenant.

Key capabilities:
- Company onboarding and tenant provisioning
- Shipment lifecycle management with tracking events
- Public package tracking by tracking ID
- Hub operations and handover workflows
- Delivery agent mobile-friendly operations
- Role-based dashboards for Super Admin, Company Admin, Hub Manager, Agent, and Customer

## 2. Tech Stack
- Frontend: Next.js 16, React 19, Tailwind CSS, Framer Motion
- Backend: Node.js, Express 5, Mongoose
- Database: MongoDB
- Security: JWT, express-rate-limit, multer validation, express-validator
- Optional enhancements used: Redis cache layer, email queue fallback, AI insights/prediction, QR workflows

## 3. Repository Structure
- `shipnova-backend/` - Express API + MongoDB models + business logic
- `shipnova-frontend/` - Next.js app (admin, hub manager, agent, customer, tracking)
- `docs/` - architecture, API docs, enhancements, postman collection

## 4. Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (Atlas or local)

## 5. Environment Variables

### 5.1 Backend (`shipnova-backend/.env`)
Create `shipnova-backend/.env` with:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
JWT_SECRET=<your_jwt_secret>
REDIS_URL=redis://127.0.0.1:6379
EMAIL_USER=<smtp_user>
EMAIL_PASS=<smtp_password>
GEMINI_API_KEY=<your_gemini_key>
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

Notes:
- Redis is optional. App works even when Redis is unavailable.
- Email requires valid SMTP credentials.
- Gemini key is optional; fallback text is used if unavailable.

### 5.2 Frontend (`shipnova-frontend/.env.local`)
Create `shipnova-frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## 6. Installation and Local Run

### 6.1 Backend
```bash
cd shipnova-backend
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

### 6.2 Frontend
```bash
cd shipnova-frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

## 7. Initial Data Seeding

### 7.1 Seed plans
```bash
cd shipnova-backend
node seed_plans.js
```

### 7.2 Seed super admin
```bash
cd shipnova-backend
node src/utils/seedSuperAdmin.js
```

Default seeded super admin credentials:
super admin runs at `http://localhost:3000/super-admin/login`.
- Email: `superadmin@shipnova.com`
- Password: `SuperAdmin@123`

## 8. Core API Base
- Base URL: `http://localhost:5000/api`
- Key required endpoint alias for assessment:
  - `GET /api/track/:tracking_id`

See `docs/API_DOCUMENTATION.md` for endpoint reference.

## 9. Submission Artifacts
- Architecture overview: `ARCHITECTURE.md`
- API documentation: `docs/API_DOCUMENTATION.md`
- Postman collection: `docs/postman/Shipnova.postman_collection.json`
- Implemented enhancements list: `docs/IMPLEMENTED_ADVANCED_ENHANCEMENTS.md`

## 10. Deployment Links (Fill Before Final Submission)
- Frontend: `<add deployed frontend URL>`
- Backend: `<add deployed backend URL>`

## 11. Git Repository Link (Fill Before Final Submission)
- `<add repository URL>`
# shipnova
