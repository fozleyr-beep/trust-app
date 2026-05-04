# trust-app

A trust-stack messaging product: end-to-end encrypted threads with people +
a separate Claude assistant that cannot read those messages, with the
contract written down on `/trust` and enforced by tests and a strict CSP.

Stack:

- Next.js 15 (App Router) + TypeScript strict
- Tailwind v4 (CSS-first config)
- Drizzle ORM on Postgres / Neon
- Clerk auth (+ webhook → Drizzle user mirror)
- Claude Sonnet 4.5 (`claude-sonnet-4-5`)
- `tweetnacl` for `crypto_box` (X25519 + XSalsa20-Poly1305) — see
  [DECISIONS.md § Crypto primitive](./DECISIONS.md) for why this isn't
  libsodium

Source of truth:

- [`DECISIONS.md`](./DECISIONS.md) — locked product/design/stack decisions
- [`handoff.yaml`](./handoff.yaml) — tokens, agents, data model, flows, routes
- [`CLAUDE_CODE_PROMPT.md`](./CLAUDE_CODE_PROMPT.md) — PR plan + bootstrap

## Setup

```bash
cp .env.example .env.local
# fill: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
#       CLERK_WEBHOOK_SECRET, DATABASE_URL, ANTHROPIC_API_KEY
npm install
npm run db:push     # one-time — creates the 5 tables in Neon
npm run doctor      # preflight: env + connectivity probes
npm test            # 11/11
npm run dev         # http://localhost:3000
```

## Deploy (Vercel)

1. Push to GitHub.
2. Import in Vercel; Next.js auto-detected.
3. Set env vars from `.env.example` in the Vercel project settings.
4. Provision a Neon database and paste `DATABASE_URL`.
5. Run migrations: `DATABASE_URL=… npm run db:push`.
6. In Clerk dashboard → Webhooks, add an endpoint pointing to
   `https://<your-domain>/api/webhooks/clerk`. Copy the signing secret into
   `CLERK_WEBHOOK_SECRET`.

## Layout

```
app/
  layout.tsx                 # root, conditional ClerkProvider
  page.tsx                   # / → /trust
  trust/page.tsx             # the human-readable trust contract
  sign-in/[[...sign-in]]/    # Clerk-hosted UI
  sign-up/[[...sign-up]]/
  app/                       # post-auth surfaces
    page.tsx                 # dashboard
    threads/                 # E2E messaging
    agent/                   # Claude assistant (separate, not E2E)
    settings/                # fingerprint, rotate, export, delete
  api/
    agent/                   # streaming Anthropic, rate-limited
    device-keys/             # POST register / rotate
    sender-keys/             # POST fetch peer pubkeys
    threads/[id]/messages/   # POST fanout, GET decrypt-list
    threads/[id]/recipient-keys/
    me/threads/              # GET own thread metadata
    me/delete/               # POST self-delete
    webhooks/clerk/          # svix-verified user mirror
    health/
  components/                # client components only
lib/
  ai/client.ts               # Anthropic SDK + system prompt
  api/{schemas,parse,rate-limit}.ts
  auth/current-user.ts       # Clerk → Drizzle resolver + lazy backfill
  crypto/{index,keystore,messaging}.ts
  db/{index,schema,threads}.ts
  log.ts                     # JSON logger
middleware.ts                # Clerk auth + strict nonce-based CSP
tests/
  agent-isolation.test.ts    # asserts agent never touches messages
drizzle/                     # migrations
scripts/
  doctor.ts                  # npm run doctor
.github/workflows/ci.yml     # typecheck + test + build
```

## What `/trust` says, and how it's enforced

| Promise on `/trust` | How it's enforced |
|---|---|
| Messages between people are end-to-end encrypted | `lib/crypto/messaging.test.ts` — 5 round-trip tests |
| The assistant cannot read those messages | `tests/agent-isolation.test.ts` — 5 forbidden-pattern tests |
| No third-party analytics, pixels, replay | Strict CSP with nonce + `'strict-dynamic'` (`middleware.ts`) |
| You can verify with a fingerprint | `/app/settings` + thread page header |
| You can rotate if compromised | `/app/settings` → Rotate, preserves past-message access |
| You can export your full history | `/app/settings` → Export, runs entirely in the browser |
| You can delete your account | `/app/settings` → Danger zone (typed confirmation) |
| Server holds metadata, not plaintext | `lib/db/schema.ts` — `messages.ciphertext` is bytea only |

## License

MIT — see [LICENSE](./LICENSE). The `/trust` page describes the security
model; [SECURITY.md](./SECURITY.md) describes how to report issues.
