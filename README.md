# Gatherly Backend (Node.js + Express + MySQL)

This is the Gatherly Event Management System backend. Tech stack:
- Node.js 20, Express.js
- MySQL 8 via Sequelize ORM
- JWT + bcrypt auth
- Stripe for payments (to be wired with your keys)
- Nodemailer (SMTP) for email notifications
- Docker + Docker Compose for local dev
- Jest + Supertest for tests

## Quick start (Docker)

1. Copy environment example:

```bash
cp .env.example .env
```

2. Edit `.env` as needed (or rely on docker-compose environment for DB).

3. Start services:

```bash
docker compose up --build
```

API will be available at http://localhost:5000

4. Seed demo data:

```bash
docker compose exec app npm run seed
```

This creates demo users and a sample event/tickets.

## Local without Docker

- Ensure MySQL is running and credentials in `.env` are correct.
- Install deps: `npm install`
- Run dev: `npm run dev`

## API surface
- `GET /health` – health check
- `GET /api` – API metadata
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- Events:
  - `GET /api/events`
  - `GET /api/events/:id`
  - `POST /api/events`
  - `PUT /api/events/:id`
  - `DELETE /api/events/:id`
- Tickets:
  - `GET /api/events/:eventId/tickets`
  - `POST /api/events/:eventId/tickets`
  - `PUT /api/events/:eventId/tickets/:ticketId`
  - `DELETE /api/events/:eventId/tickets/:ticketId`
- Attendees:
  - `GET /api/events/:eventId/attendees`
  - `POST /api/events/:eventId/attendees/register`
  - `POST /api/events/:eventId/attendees/waitlist/claim`
  - `GET /api/events/:eventId/attendees/waitlist/offers`
  - `POST /api/events/:eventId/attendees/me/safety`
  - `GET /api/events/:eventId/attendees/safety/summary`
  - `POST /api/events/:eventId/attendees/scan/checkin`
  - `POST /api/events/:eventId/attendees/:attendeeId/checkin`
  - `DELETE /api/events/:eventId/attendees/:attendeeId`
- Scholarships:
  - `POST /api/events/:eventId/scholarships/tickets/:ticketId/apply`
  - `GET /api/events/:eventId/scholarships`
  - `POST /api/events/:eventId/scholarships/:id/review`
- Team & approvals:
  - `GET /api/events/:eventId/team`
  - `POST /api/events/:eventId/team`
  - `DELETE /api/events/:eventId/team/:memberId`
  - `POST /api/events/:eventId/team/approvals/request`
  - `GET /api/events/:eventId/team/approvals/list`
  - `POST /api/events/:eventId/team/approvals/:id/resolve`
- Comments:
  - `GET /api/events/:eventId/comments`
  - `POST /api/events/:eventId/comments`
  - `DELETE /api/events/:eventId/comments/:id`
- Payments:
  - `GET /api/payments/:userId`
  - `GET /api/payments/flagged/list`
  - `POST /api/payments/purchase/:ticketId`
  - `GET /api/payments/refund-preview/:id`
  - `POST /api/payments/refund/:id`
- Notifications:
  - `GET /api/notifications`
  - `POST /api/notifications/send`
  - `POST /api/notifications/emergency/broadcast`
  - `POST /api/notifications/:id/read`
- Analytics:
  - `GET /api/analytics/events/:id`
  - `GET /api/analytics/users`
- Public:
  - `GET /api/public/transparency`
- Outbox:
  - `GET /api/outbox`
  - `POST /api/outbox/process`
- Privacy:
  - `POST /api/privacy/consents`
  - `GET /api/privacy/consents/me`
  - `POST /api/privacy/requests/export`
  - `POST /api/privacy/requests/delete`
  - `GET /api/privacy/requests/me`
  - `POST /api/privacy/requests/:id/resolve`
  - `POST /api/privacy/retention/run`
- Webhooks:
  - `POST /api/webhooks/stripe`

## Advanced features added (portfolio-grade)
- Waitlist auto-promotion with expiring claim offers.
- Fraud/risk scoring for purchases with flagged payment queue.
- Emergency broadcast and attendee safety check-ins.
- Accessibility metadata support and filtering-ready event schema.
- Donation + scholarship ticket workflows.
- Policy-based partial/full refund preview and execution.
- Organizer team roles with approval request workflows.
- Reliable outbox pattern for webhook/event delivery retries.
- Public transparency dashboard for social-impact metrics.
- Privacy/compliance APIs (consent logs, export/delete requests, retention jobs).

## API docs and collection
- Swagger UI: `GET /api/docs`
- OpenAPI spec: `src/docs/openapi.json`
- Postman collection: `src/docs/postman_collection.json`

## Default product flow
1. Attendee registers and logs in for JWT.
2. Organizer/Admin creates and publishes an event.
3. Organizer creates ticket tiers for that event.
4. Attendee purchases ticket with Stripe (`/api/payments/purchase/:ticketId`).
5. Stripe webhook confirms payment and issues a signed QR ticket payload.
6. Organizer checks attendees in via anti-fraud signed QR scanning, then reviews analytics and notifications.

## Tests

```bash
npm test
```

## Quality gates (CI)

```bash
npm run ci
```

This runs:
- automated tests
- OpenAPI + Postman contract checks (`npm run check:docs`)

GitHub Actions workflow file: `.github/workflows/ci.yml`

## Portfolio demo flow (scripted)

Run the API first (`docker compose up --build` or your local setup), then execute:

```bash
npm run demo:flow
```

The script performs a full journey:
1. health check
2. organizer login
3. event creation
4. ticket creation
5. attendee registration/login
6. attendee event registration
7. attendee comment submission
8. organizer signed-QR attendee check-in
9. optional purchase flow (if Stripe is configured)
10. event analytics fetch

## Pro feature highlight: anti-fraud QR check-in

Gatherly now uses signed check-in QR tokens instead of predictable attendee IDs.

- Token signing utility: `src/utils/checkinToken.js`
- Scanner endpoint (Organizer/Admin): `POST /api/events/:eventId/attendees/scan/checkin`
- Registration returns a check-in token for attendee pass flows.
- Stripe e-ticket generation embeds the signed token into the QR payload.

This materially improves venue safety and fraud resistance by preventing forged/guessable QR payloads.

Optional env overrides:
- `DEMO_BASE_URL` (default `http://localhost:5000`)
- `DEMO_ORGANIZER_EMAIL` (default `org1@gatherly.local`)
- `DEMO_ORGANIZER_PASSWORD` (default `Organizer@1234`)
- `DEMO_ATTENDEE_EMAIL` (auto-generated if unset)
- `DEMO_ATTENDEE_NAME` (auto-generated if unset)
- `DEMO_ATTENDEE_PASSWORD` (default `Attendee@1234`)

## Environment variables
See `.env.example`. Important ones:
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET, JWT_EXPIRES_IN
- STRIPE_SECRET (test/live key), STRIPE_WEBHOOK_SECRET
- SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM
- CORS_ORIGINS
- UPLOAD_DIR, TICKET_PDF_DIR

## Notes
- Storage for images and ticket PDFs is local by default under `storage/`.
- In development, you can use Mailpit/Mailhog for SMTP testing.
- For production, make sure to set strong JWT_SECRET and proper SMTP/Stripe secrets.
