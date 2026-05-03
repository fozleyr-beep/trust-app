# trust-app

PR-01 scaffold. Stack is locked:

- Next.js 15 (App Router)
- Tailwind v4 (CSS-first config)
- Drizzle ORM on Postgres / Neon
- Clerk auth
- Claude Sonnet 4.5 (`claude-sonnet-4-5`)
- libsodium for message E2E

## Setup

```bash
cp .env.example .env.local   # fill in keys
npm install
npm run dev
```

Open http://localhost:3000/trust

## Status

This is the PR-01 scaffold:

- `/trust` page is the only page rendered
- Drizzle / Clerk / Anthropic / libsodium are wired as **stubs** so the app
  compiles and routing works — full integration lands in PR-02 onward
- Every content claim on `/trust` is flagged with `ASSUMPTION` in the source.
  When `DECISIONS.md` and `CLAUDE_CODE_PROMPT.md` arrive, grep the codebase
  for `ASSUMPTION` and reconcile each one before merge.

## Layout

```
app/
  layout.tsx              # root, font setup, no auth
  page.tsx                # / → 307 to /trust for now
  trust/page.tsx          # the PR-01 deliverable
  globals.css             # Tailwind v4 entrypoint + tokens
lib/
  ai/client.ts            # Anthropic SDK init, model = claude-sonnet-4-5
  crypto/index.ts         # libsodium init wrapper
  db/index.ts             # Drizzle + Neon HTTP client
  db/schema.ts            # placeholder tables — replace per handoff.yaml
middleware.ts             # Clerk; /trust and / are public
drizzle.config.ts
```
