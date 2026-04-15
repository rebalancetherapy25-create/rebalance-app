# Rebalance Monorepo

This repository contains four production surfaces:

- `frontend`: customer-facing Next.js application
- `admin`: admin Next.js application
- `therapist`: therapist portal Next.js application
- `backend`: Node.js + Express API

## Environment Model

Production environment variables must be configured in the hosting platform, not committed to the repo.

- `frontend`, `admin`, `therapist`:
  - required in production: `NEXT_PUBLIC_API_URL`
- `backend`:
  - required in production: `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
  - required for therapist auth in production: `THERAPIST_JWT_SECRET`, `THERAPIST_JWT_REFRESH_SECRET`
  - optional provider integrations: `RESEND_API_KEY`, `EMAIL_FROM`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, Cloudinary credentials

Use checked-in `.env.example` files only as documentation. Local `.env`, `.env.local`, and deployment secrets must stay out of Git.

## Health Checks

The backend exposes:

- `/api/health`: liveness
- `/api/health/ready`: readiness, including Mongo connection state

Use both endpoints in deployment smoke checks and monitoring.

## CI

GitHub Actions runs monorepo verification in `.github/workflows/monorepo-checks.yml`:

- backend typecheck and tests
- frontend build
- admin build
- therapist build

## Local Verification

```bash
cd backend && npm run typecheck && npm test
cd frontend && NEXT_PUBLIC_API_URL=http://localhost:5000/api npm run build
cd admin && NEXT_PUBLIC_API_URL=http://localhost:5000/api npm run build
cd therapist && NEXT_PUBLIC_API_URL=http://localhost:5000/api npm run build
```
