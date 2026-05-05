# Sakinah Engineering Plan

Last updated: 2026-05-05

## Goal

Ship Sakinah as a platform, not a landing page: trust contract, intake, verification gates, bounded discovery, salaam consent, family observers, encrypted rooms, billing, mobile release, and auditability.

## Current shipped spine

- Next.js App Router web app on Vercel.
- Clerk authentication.
- Neon Postgres with Drizzle migrations.
- Device-key registration and end-to-end encrypted user rooms.
- Assistant route isolated from messaging tables by test.
- Service profile, agent ledger, match suggestions, salaam consent, observer role enforcement, billing entitlement tables.
- Android preview/release train exists; Play Console publication waits on account verification.

## Milestones

1. Platform loop: landing -> onboarding -> discovery -> salaam -> encrypted room.
2. Verification: provider-backed identity/liveness result, no raw ID evidence persistence.
3. Discovery: hard gates, soft preferences, explainable shortlist, no fake candidates.
4. Family: wali observer invite, visible presence, read-only authz, export trail.
5. Safety: pause/report flows, stale salaam expiry, pressure flags, no plaintext access.
6. Billing: Stripe web checkout, billing portal, webhook entitlement, Android Play Billing.
7. Admin/ops: service health and abuse metadata without manual service delivery.
8. Mobile: Android internal test, Play Billing, iOS-ready shared API surface.

## Verification loop

Every product slice should pass:

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check:bundle`
- `npm run db:check` when schema/API state changes
- production smoke for `/api/health`, public docs, and protected app boundary

## Non-negotiables

- Agents do not import messaging tables.
- Agents do not decrypt or inspect user-room plaintext.
- Raw identity evidence is not a product record.
- Android does not link to external payment.
- Wali/observer accounts cannot post.
- Empty inventory is shown as empty inventory, not fabricated matches.
