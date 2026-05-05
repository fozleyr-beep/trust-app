# trust-app / Sakinah.family

A private Sakinah.family build inside the `trust-app` repo: end-to-end
encrypted rooms with people, a separate Claude assistant that cannot read those
messages, self-serve Stripe-ready billing, a four-agent operating ledger, and a
Sand & Sage public trust surface based on the Sakinah design archive. The
product direction is zero-human-operator: onboarding, verification, payment,
matching, salaam, observer access, and handoff should run through named agents,
not staff.

Stack:

- Next.js 15 (App Router) + TypeScript strict
- Tailwind v4 (CSS-first config)
- Sakinah Sand & Sage visual tokens in `app/globals.css`
- Drizzle ORM on Postgres / Neon
- Clerk auth (+ webhook → Drizzle user mirror)
- Claude Sonnet 4.5 via Anthropic direct key or Vercel AI Gateway OIDC
- `tweetnacl` for `crypto_box` (X25519 + XSalsa20-Poly1305) — see
  [DECISIONS.md § Crypto primitive](./DECISIONS.md) for why this isn't
  libsodium

Source of truth:

- [`DECISIONS.md`](./DECISIONS.md) — locked product/design/stack decisions
- [`MOBILE.md`](./MOBILE.md) — Android-first Expo strategy and Play policy gates
- [`handoff.yaml`](./handoff.yaml) — tokens, agents, data model, flows, routes
- [`CLAUDE_CODE_PROMPT.md`](./CLAUDE_CODE_PROMPT.md) — PR plan + bootstrap

## Setup

```bash
cp .env.example .env.local
# fill: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
#       DATABASE_URL
# optional local assistant probe: AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY
# optional self-serve billing: STRIPE_SECRET_KEY, STRIPE_PRICE_ID
npm install
npx drizzle-kit migrate  # one-time — creates the 8 tables in Neon
npm run doctor      # preflight: env + connectivity probes
npm test
npm run dev         # http://localhost:3000
```

## Deploy (Vercel)

1. Push to GitHub.
2. Import in Vercel; Next.js auto-detected.
3. Set env vars from `.env.example` in the Vercel project settings.
4. Provision a Neon database and paste `DATABASE_URL`.
5. Run migrations: `DATABASE_URL=… npx drizzle-kit migrate`.
6. Assistant calls use Vercel AI Gateway through the project OIDC token in
   production. No raw Anthropic key is required on Vercel.
7. Optional payments: add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and
   `STRIPE_WEBHOOK_SECRET`, then run migrations. `/api/billing/webhook`
   verifies Stripe signatures, records idempotent billing events, and updates
   `service_entitlements`. Without checkout keys, the billing API returns a
   clear launch-gate response.
8. Optional: in Clerk dashboard → Webhooks, add an endpoint pointing to
   `https://<your-domain>/api/webhooks/clerk`. Copy the signing secret into
   `CLERK_WEBHOOK_SECRET`. Lazy backfill still covers signed-in users without
   the webhook.

## Layout

```
app/
  layout.tsx                 # root, conditional ClerkProvider
  page.tsx                   # Sakinah landing page
  trust/page.tsx             # the human-readable trust contract
  privacy/page.tsx           # public privacy policy for web/mobile stores
  account/delete/page.tsx    # public account deletion instructions
  sign-in/[[...sign-in]]/    # Clerk-hosted UI
  sign-up/[[...sign-up]]/
  app/                       # post-auth surfaces
    page.tsx                 # dashboard
    onboarding/              # Hafiz/Watim intake path, no coordinator call
    verification/            # Hafiz verification launch gates
    billing/                 # self-serve Stripe Checkout surface
    matches/                 # Watim shortlist, no swipe feed
    salaam/                  # Adil consent gate
    family/                  # read-only observer model
    threads/                 # E2E messaging
    agent/                   # Claude assistant (separate, not E2E)
    settings/                # fingerprint, rotate, export, delete
  api/
    agent/                   # streaming Anthropic, rate-limited
    agents/actions/          # protected four-agent ledger
    billing/checkout/        # Stripe Checkout if env configured
    billing/webhook/         # Stripe signature verification + entitlements
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
  agents/{registry,actions}.ts # Hafiz/Watim/Adil/Sabr contracts + ledger
  auth/current-user.ts       # Clerk → Drizzle resolver + lazy backfill
  crypto/{index,keystore,messaging}.ts
  db/{index,schema,threads}.ts
  log.ts                     # JSON logger
middleware.ts                # Clerk auth + strict nonce-based CSP
tests/
  agent-spine.test.ts        # asserts four-agent source of truth
  agent-isolation.test.ts    # asserts agent never touches messages
  mobile-app.test.ts         # asserts Android-first mobile scaffold
mobile/
  App.tsx                    # Expo React Native mobile shell
  app.json                   # Android package + future iOS bundle id
  eas.json                   # internal APK + production AAB profiles
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
| Paid service access is self-serve | `service_entitlements` updated by `/api/billing/webhook` |
| Named agents operate without staff | `agent_actions` + `/api/agents/actions` + `tests/agent-spine.test.ts` |
| Server holds metadata, not plaintext | `lib/db/schema.ts` — `messages.ciphertext` is bytea only |

## License

MIT — see [LICENSE](./LICENSE). The `/trust` page describes the security
model; [SECURITY.md](./SECURITY.md) describes how to report issues.
