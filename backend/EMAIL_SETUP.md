## Email (Resend) Setup

The backend sends transactional emails via the Resend HTTP API.

### Environment Variables

- `RESEND_API_KEY`: Resend API key.
- `EMAIL_FROM`: Sender address that is verified in Resend.
  - Example: `ReBalance <no-reply@yourdomain.com>`
  - If you do not have a verified domain yet, the backend now falls back to `Rebalance <onboarding@resend.dev>`.
  - Do not append other shell assignments to this value. A broken value like `"Rebalance <no-reply@yourdomain.com>"NODE_ENV=production` will be rejected by Resend.
- `THERAPIST_URL`: Therapist portal base URL.
  - Dev default: `http://localhost:3002`

### Emails Sent

- Therapist portal invite
  - Trigger: `POST /api/admin/therapists` with `email` and `portalAccess.create=true`, or `POST /api/admin/therapist-accounts`
  - Template: `backend/src/emails/templates/therapistInvite.ts`
- Therapist portal password reset
  - Trigger: `PUT /api/admin/therapist-accounts/:id` with `password`
  - Template: `backend/src/emails/templates/therapistPasswordReset.ts`
- Booking confirmation
  - Trigger: `POST /api/bookings/verify`
  - Template: `backend/src/emails/templates/bookingConfirmed.ts`
- Booking rescheduled / cancelled
  - Trigger: `PUT /api/admin/bookings/:id` or `PUT /api/therapist/bookings/:id` with `reschedule` or `status=cancelled`
  - Templates: `backend/src/emails/templates/bookingRescheduled.ts`, `backend/src/emails/templates/bookingCancelled.ts`
