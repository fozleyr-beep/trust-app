# DECISIONS

The locked product, design, and stack decisions for `trust-app`.

This file is reverse-engineered from the codebase as it stands at commit
`0b3094c` (PR-11). Every decision here is "locked" in the sense that the
code already reflects it; "locked" does not mean "right." Where I had to
guess (because the original DECISIONS.md / handoff.yaml / CLAUDE_CODE_PROMPT.md
were never on disk), I marked the line **GUESSED** and listed alternatives
under [§ Open](#open-decisions). Edit those, then run a single reconciliation
pass.

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

- **Membership check on send** (`app/api/threads/[id]/messages/route.ts`):
  every recipient device key in the fanout must belong to a current member
  of the thread. Closes a pollution / exfiltration channel.
- **Rate limit** on `/api/agent` (Anthropic costs money).
- **Pagination cap** of 200 rows on `GET /api/threads/[id]/messages`.

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
- Tokens (colors, fonts) currently **placeholders** in `app/globals.css`
  — see [§ Open](#open-decisions) #1.

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

These are the things still **GUESSED**, awaiting human input. Each maps to one
or more `ASSUMPTION:` flags in the source. Run
`grep -rn ASSUMPTION app/ lib/ middleware.ts` to find the call site.

Numbers are stable across reconciliation passes — gaps mean the row was locked
in an earlier pass (PR-12 Pass A locked #5–11, #13–16, #20).

| # | Decision | Current guess | Where to look |
|---|---|---|---|
| 1 | **Visual tokens** (color, type, type-scale) | Restrained ink-on-paper placeholder | `app/globals.css` |
| 2 | **Sign-in/sign-up UI** | Clerk-hosted (default) | `app/sign-in/`, `app/sign-up/` |
| 3 | **`/` route** | redirects to `/trust` | `app/page.tsx` |
| 4 | **Post-auth landing** | `/app` | `app/app/page.tsx` |
| 12 | **Agent system prompt** | minimal placeholder | `lib/ai/client.ts` |
| 17 | **Repo visibility** | public (`/trust` says "open-source") | `/trust` |
| 18 | **Disclosure email** | `security@example.com` (placeholder) | `/trust` |
| 19 | **Clerk hosted UI domain in CSP** | `*.clerk.accounts.dev` | `middleware.ts` |

---

## How to reconcile

When you change any of the above:

1. Edit this file to lock the new decision.
2. Update `handoff.yaml` if it's structural (data model, routes, tokens).
3. Find every `ASSUMPTION:` flag for that decision: `grep -rn ASSUMPTION app/ lib/ middleware.ts`.
4. Edit the call site to match. Remove the `ASSUMPTION:` comment.
5. Run `npm run typecheck && npm test && npm run build`.
6. Commit as `feat(reconcile): <decision number> — <one-line summary>`.
