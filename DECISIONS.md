# DECISIONS

The locked product, design, and stack decisions for `trust-app`.

Originally reverse-engineered from the codebase at PR-11; every previously-
GUESSED item was reconciled in PR-12 (two passes: ratify-as-is for the
technically-defensible defaults, then human-locked values for the remaining
placeholder/product calls). Every decision here is "locked" in the sense
that the code already reflects it; "locked" does not mean "right." If the
right answer changes, follow the process in [§ Open](#open-decisions).

---

## Stack

| | |
|---|---|
| Framework | Next.js 15.5.15 (App Router, typedRoutes) |
| Language | TypeScript 5.7, strict |
| Styling | Tailwind v4 (CSS-first, `@theme` in `app/globals.css`) |
| Database | Postgres on Neon (`@neondatabase/serverless` HTTP driver) |
| ORM | Drizzle 0.36 |
| Auth | Clerk 6 (catch-all `/sign-in`, `/sign-up`, webhook to mirror users) |
| AI | Anthropic SDK, model `claude-sonnet-4-5` (locked) |
| E2E crypto | `tweetnacl` (`crypto_box` = X25519 + XSalsa20-Poly1305) |
| Validation | Zod 4 at every API body |
| Tests | Vitest |
| CI | GitHub Actions: typecheck + test + build on every push and PR |

### Crypto primitive — locked

- `crypto_box` (X25519 key agreement + XSalsa20-Poly1305 authenticated encryption).
- Implementation: `tweetnacl`.
- **Deviation from the original brief**, which said `libsodium`. Reason:
  `libsodium-wrappers` ships a broken ESM bundle and its `package.json`
  `exports` field blocks the CJS subpath, so it cannot be loaded by Next.js's
  webpack. `tweetnacl` is the same primitive and same wire format, audited,
  with a clean ESM build. If the audit lineage on libsodium specifically is
  required later, switch to `libsodium.js` (the JS-only fork) — same primitive,
  no bundler issue.

### Model — locked

- `claude-sonnet-4-5` is the only model used for the assistant surface.
- 1024 max tokens per response (`app/api/agent/route.ts`).
- 6 requests / minute / user rate limit (in-memory token bucket).

---

## Product surfaces

Three surfaces, sharply distinct in what they can read.

| Surface | Path | Encrypted? | Server can read? |
|---|---|---|---|
| Trust contract | `/trust` | n/a (public marketing) | yes |
| Threads with people | `/app/threads/[id]` | yes (libsodium-style E2E) | **no** — ciphertext only |
| Assistant (Claude) | `/app/agent` | no (server-mediated) | yes (it's the point) |

The split is a **load-bearing decision**: the assistant cannot read messages
between people. This is enforced, not just promised — see `tests/agent-isolation.test.ts`,
which fails the build if any file under `app/api/agent/` references the
`messages`, `threads`, `thread_members`, or `device_keys` schema.

---

## Product operating model

Sakinah's launch direction is zero human operator from customer onboarding
through payment and service delivery. Named AI agents can verify, introduce,
mediate, bill, guardrail, and close the journey; Sakinah staff should not act as
intake coordinators, matchmakers, moderators, sales reps, or service operators.
Where code does not yet enforce that boundary, the public surface must label it
as a launch gate rather than a live guarantee.

The in-app route map now follows that operating model:
`/app/onboarding`, `/app/verification`, `/app/billing`, `/app/matches`,
`/app/salaam`, `/app/family`, then encrypted rooms in `/app/threads`.
Stripe Checkout is allowed without a new product decision because it supports
self-serve payment. The payment entitlement model is `billing_events` for
idempotent webhook receipt plus `service_entitlements` as the user-facing access
gate; it must stay launch-gated until `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`,
and `STRIPE_WEBHOOK_SECRET` are configured in production.

The four named service agents are canonical in `lib/agents/registry.ts`:
Hafiz (verification), Watim (match reasoning), Adil (consent), and Sabr
(pressure and observer safety). Every signed-in user gets a baseline
`agent_actions` ledger surfaced on `/app` and through `/api/agents/actions`.
This ledger may hold product state and launch gates; it must not store
encrypted-room plaintext or raw identity evidence.

Mobile is the primary product surface. The chosen path is Expo React Native in
`mobile/`, Android-first for Google Play Console, with iOS kept open through the
same codebase once an Apple Developer account exists. Do not ship Android
in-app paid access through Stripe until the Play payments policy decision is
resolved; default to Google Play Billing for in-app unlocks unless a documented
exception applies. The mobile app must expose account deletion and privacy
policy links before Play review; the current public routes are `/account/delete`
and `/privacy`. Native Clerk uses `@clerk/expo`, secure `tokenCache`, native
email/password sign-in, and verified email sign-up.

---

## Encryption model — locked

### Per-device fanout

- Every user has one or more **device key generations**.
- A device key is an X25519 keypair generated in the browser; the secret
  half lives in IndexedDB, never on the server.
- Sending a message to a thread of N members produces **one ciphertext row
  per active device** across all members (and across all of the sender's
  own active devices, for self-sync).
- **NOT** a sender-key / MLS group-state model. Rationale: simpler to reason
  about for v1; trades server storage for cryptographic clarity.

### Multi-generation per device

- Rotating a device's key keeps the prior generation in IndexedDB so the
  user can still decrypt messages encrypted to the old key.
- Server revokes the prior `device_keys` row (sets `revokedAt`) when a new
  pubkey is registered with the same `deviceId`.
- Decryption tries every known secret key in turn (`getAllSecretKeys()`).

### Key recovery — none, by choice

- If you clear browser storage you lose every generation for that device.
- Past messages encrypted to those keys become unrecoverable on this device.
- This is **stated on `/trust`** as the cost of holding no key on the server.
- No passphrase-wrapped backup, no social recovery — by choice. Recovery is a
  v2-or-later question; the privacy story for v1 is "no key on the server,"
  and any recovery scheme reintroduces a key on the server in some form.

### Fingerprint verification — in scope

- Each device's first 16 pubkey bytes, hex-grouped, shown in `/app/settings`
  and on the thread page header.
- Out-of-band verification via "read it aloud over a separate channel."
- In v1 scope. Aligns with the restraint register: small surface area, no
  third-party dependency, and gives users a non-trust-us channel to verify peers.

### Decrypt-fail visibility — surface, don't drop

- If `<MessageStream>` cannot decrypt an incoming row with any of this
  device's known secret keys, it renders a dashed-border italic
  `[encrypted — this device cannot decrypt]` placeholder rather than
  silently dropping the row.
- Rationale: silence reads as "no message exists"; the placeholder reads
  as "something exists you can't read here." The latter is honest and
  prompts the user to investigate (rotation, wrong device, etc.).

---

## Messaging surface — locked

### Real-time delivery via SSE

- New messages flow over `GET /api/threads/[id]/stream` as
  Server-Sent Events. Server-side polls the `messages` table every 1.5s
  and pushes deltas; the client EventSource handles reconnection via
  `Last-Event-ID`.
- The legacy `GET /api/threads/[id]/messages?since=` endpoint is
  retained for one-shot history loads (thread mount, full export) but is
  **not** used in any tight client polling loop.
- `<MessageStream>` tears down its EventSource when the tab is hidden
  (`document.visibilityState === "hidden"`) and reopens on visible. Saves
  one server-side poll loop per backgrounded tab.

### Optimistic composer UX

- `<Composer>` dispatches `trust-app:optimistic-send` immediately on
  submit, before any encryption or network call. `<MessageStream>` renders
  the optimistic message in `state="sending"` so users see their own
  message at ~0ms perceived latency. SSE delivery (~1.5s) replaces the
  optimistic entry in place by matching `senderId + plaintext`.
- On send failure, `state="failed"` styling and a draft restore.

### Group threads — up to 10 members per thread

- `createThread` accepts comma- or whitespace-separated emails, capped at
  9 recipients (10 members total).
- Schema always supported N members; the cap is enforced at the action
  layer to keep per-send fanout bounded.

---

## Server-side data — locked

### What the server stores in plaintext

- Clerk `userId` ↔ Drizzle UUID mapping
- Email address (for thread-by-email lookup)
- Public keys (public by design)
- Message metadata: thread id, sender id, recipient device key id, ciphertext
  size, sent_at timestamp
- Anything sent to the assistant in that conversation

### What the server does NOT have

- Plaintext message bodies
- Any key that decrypts a message between people
- Cross-thread aggregation (no read receipts, no presence, no typing indicators)

### What the server enforces

- **Membership check on send** — every recipient device key in the fanout
  must belong to a current member of the thread. No duplicates either.
  Logic in `lib/messaging/authz.ts`, called from
  `app/api/threads/[id]/messages/route.ts`, locked by 6 unit tests in
  `lib/messaging/authz.test.ts`.
- **Rate limit** on `/api/agent` (Anthropic costs money): 6 requests
  per minute per user (in-memory token bucket).
- **Pagination cap** of 200 rows on `GET /api/threads/[id]/messages`.
- **Per-route bundle budget** of 200 KB First Load JS, 130 KB shared.
  CI-enforced (`npm run check:bundle`).
- **Drizzle schema drift** check in CI (`npm run db:check`) — fails the
  build if the schema diverges from committed migrations.

---

## Auth model — locked

- Clerk owns the password / session / 2FA story.
- A `users` row is mirrored on `user.created` / `user.updated` via the
  Clerk webhook (`/api/webhooks/clerk`), verified with `svix`.
- `requireDbUser()` does a **lazy backfill** — if the webhook hasn't fired
  yet (local dev, or a transient delivery failure), the helper creates the
  row from `currentUser()` on first authed request. Idempotent via
  `onConflictDoUpdate`. Means every protected page Just Works on first
  sign-in.
- Account self-delete (`POST /api/me/delete`): soft-deletes the Drizzle
  row, revokes every device key, hard-deletes from Clerk via the admin API.

---

## UX register — locked

- Restraint over ornament. Server-rendered first, client JS only where
  encryption requires it.
- No third-party scripts. **Enforced** by a strict CSP with
  `'strict-dynamic'` + per-request nonce (see `middleware.ts`). Anyone
  trying to drop in Segment / GA / Hotjar gets blocked at the browser
  unless they explicitly amend the allowlist.
- Visual tokens are now Sakinah **Sand & Sage** in `app/globals.css`: cream,
  cream-2, ink scale, sage reserved for trust state, serif italic wordmark,
  sans body copy, and mono tabular numbers.

---

## Security headers — locked

- `Content-Security-Policy` (strict, nonce-based)
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

All applied unconditionally — the CSP works whether or not Clerk env vars
are configured.

---

## Open decisions

None. All 20 originally-GUESSED decisions are locked as of PR-12 (Pass A
ratified #5–11, #13–16, #20; Pass B locked #1–4, #12, #17–19). The locked
state is reflected in the prose sections above and in the source —
`grep -rn ASSUMPTION app/ lib/ middleware.ts` should return zero hits.

If a future change reopens any of these (e.g. swapping Clerk-hosted for a
custom UI, replacing the ink-on-paper palette with a brand-locked one), the
process is:

1. Edit the relevant prose section above to describe the new locked state.
2. Update `handoff.yaml` if the change is structural (data model, routes, tokens).
3. Land the code change in its own PR, with a body referencing this file.

The `# n` numbering used in earlier drafts is retired; cite the prose section
by name when referring back.
