# CLAUDE_CODE_PROMPT

The PR plan and bootstrap pre-conditions for `trust-app`.

This file describes the sequence that produced the codebase as it stands at
PR-25. PRs 1–25 are on `main`; PR-12 was the reconciliation pass that locked
every originally-GUESSED decision, and PRs 14–19 added real-time messaging
(SSE), group threads (up to 10), optimistic composer UX, and a tested fanout
authz module.

If you are picking this project up cold, read in this order:

1. `DECISIONS.md` — what's locked
2. `handoff.yaml` — the structural source of truth
3. This file — how to extend without compounding the assumption pile

---

## Bootstrap pre-conditions (for a fresh clone)

```bash
cd trust-app
cp .env.example .env.local
# fill in: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
#         DATABASE_URL
# optional local assistant probe: AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY
npm install
npm run db:push       # one-time, creates the 5 tables in Neon
npm run doctor        # verify env + connectivity (red lines = blockers)
npm run db:check      # Drizzle schema vs. live DB drift check
npm test              # 38/38 should pass
npm run check:bundle  # per-route First Load JS budget (200 KB / 130 KB shared)
npm run dev           # http://localhost:3000
```

Required accounts for a real run:

- **Clerk** — for auth. Get a publishable + secret key. The webhook at
  `<your-domain>/api/webhooks/clerk` is optional for canonical user sync;
  lazy-backfill covers signed-in users in v1.
- **Neon** — for Postgres. Get a `DATABASE_URL`.
- **Assistant provider** — direct Anthropic via `ANTHROPIC_API_KEY`, or Vercel
  AI Gateway via project OIDC in production.

The build passes without any of the above; the runtime requires them.

---

## PR plan

### Already on `main`

Each PR landed with `npm run typecheck && npm test && npm run build` clean.

| PR | Commit | Scope |
|---|---|---|
| 01 | `484ecb7` | Scaffold + `/trust` page (server-rendered, public) |
| 02 | `8ae8e35` | Clerk auth + sign-in/up routes + webhook → users mirror |
| 03 | `a11332d` | Messaging schema (threads, members, messages, device_keys) |
| 04 | `6aad53b` | Real E2E encryption surface (composer + stream + device keystore) |
| 05 | `41acd6a` | Anthropic Sonnet 4.5 streaming agent at `/app/agent` |
| 06 | `9b792f8` | Settings: fingerprint, peer fingerprints, plaintext export |
| 07 | `84be6a4` | Vitest, crypto round-trip tests, Zod, rate limit, GitHub Actions CI |
| 08 | `9320202` | Backfill + counterparty display + fanout authz + agent isolation test |
| 09 | `9f24a50` | Strict CSP + structured JSON logging + sign-out redirect |
| 10 | `9984678` | Key rotation (multi-generation) + account self-delete |
| 11 | `0b3094c` | `npm run doctor` preflight |
| 12 | `4de28fb` | Reconciliation. All 20 originally-GUESSED decisions in `DECISIONS.md` locked; `grep -rn ASSUMPTION app/ lib/ middleware.ts` returns zero hits. |
| 13 | `96b6423` | `SECURITY.md` + Drizzle schema-drift check (`npm run db:check`) in CI. |
| 14 | `f0d5232` | SSE replaces 4-second polling on `/api/threads/[id]/stream`; legacy `?since=` GET retained for one-shot history. |
| 15 | `ce30121` | `vercel.json` + per-route bundle budget (`npm run check:bundle`) in CI. |
| 16 | `d3c0316` | Group threads (up to 10 members), SSE idle pause when tab hidden, audit-log gap fixes. |
| 17 | `af78b0a` | Load full thread history on mount, then connect SSE for deltas — fixes a race that dropped early messages. |
| 18 | `17aad04` | Optimistic composer UX + connection-state indicator. |
| 19 | `5352d5d` | Fanout authz extracted into `lib/messaging/authz.ts` with 6 tests; Enter-to-send; decrypt-fail placeholder. |
| 20 | `a632f51` | Docs sync: `DECISIONS.md` + `handoff.yaml` reflect PR-14..19 reality. |
| 21 | `eed8c6e` | `noindex` on private surfaces + composer cap + SSE rate limit + seen-ids cap + commit-hash badge on `/trust`. |
| 22 | `2f94e96` | Extract & test `parseRecipientEmails`. |
| 23 | `0df9c59` | Rate-limit unit tests + Composer concurrent-send guard. |
| 24 | `ea75332` | MIT `LICENSE` + Dependabot config. |
| 25 | `a471a86` | Extract & test the bundle-budget parser. |
| 26 | `65baf98` | Sync `CLAUDE_CODE_PROMPT.md` with PR-12..25 reality. |
| 27 | (in flight) | Live deploy. Production URL: **https://trust-app-three.vercel.app**. Vercel project `fozleyr-beeps-projects/trust-app` connected to GitHub, 8 production env vars set, schema applied to Neon (`odd-scene-06932368` in `aws-us-east-1`), Clerk dev app `app_3DGyGaZc5v47bXDEQiYZK1zIf1k` with email-only sign-in. Public surface (`/trust`, `/sign-in`, `/api/health`) verified 200. Auth-protected redirect (`/app` → `/sign-in?redirect_url=…`) verified in browser. |

### Outstanding (PR-27 follow-ups)

| Item | Why |
|---|---|
| Optional: add Clerk webhook for `user.created` / `user.updated` / `user.deleted` + set `CLERK_WEBHOOK_SECRET` in Vercel | Lazy-backfill in `lib/auth/current-user.ts` covers v1; webhook is only for canonical delete/update sync |

### Possible follow-ups (none ordered, none blocked on each other)

- ~~Replace 4-second polling with SSE on the message stream~~ — done in PR-14
- ~~Bundle analysis + perf budgets in CI~~ — done in PR-15 / PR-25
- ~~Group threads larger than 1:1~~ — done in PR-16 (10-member cap)
- Sender-key / MLS group state if scaling beyond ~10 members needs lower
  fanout cost
- Passphrase-wrapped key backup if `DECISIONS.md` ever commits to recovery
- Custom sign-in / sign-up UI matching `/trust`'s visual register
- Sentry / equivalent for client + server error capture
- Email-based thread invite when recipient hasn't signed up yet

---

## How to add a PR

The pattern that worked for PRs 1–11:

1. **One concept per PR.** Each PR has a single, defensible scope you can
   write in two sentences.
2. **Build/typecheck/test green at every commit.** No "WIP" commits on
   main.
3. **Flag any guess inline.** `// ASSUMPTION: ...` with enough context that
   `grep -rn ASSUMPTION` is a complete reconciliation list.
4. **Tests over docs.** Where a decision is loadbearing (encryption
   round-trip, agent isolation), write a test that fails the build if the
   property breaks. Don't put load-bearing guarantees in prose.
5. **Don't relitigate locked decisions.** If something is in `DECISIONS.md`
   without `GUESSED`, it doesn't open up in the PR.

---

## House style notes

- **Tight scope.** A PR that says "and also" is two PRs.
- **No comments that just restate the code.** Only write comments when
  they explain *why*, or describe a non-obvious invariant.
- **No emoji in source.** Anywhere.
- **Restraint over ornament.** This applies to copy and visuals on
  `/trust` and `/app/*`, not just the brand.
- **Server-rendered first.** Client components only where encryption (or
  IndexedDB, or live streaming) requires it.
- **Type the boundaries.** Zod at every API body. Drizzle inferred types
  at every DB call. Don't trust shapes from `JSON.parse()` ever.

---

## What this scaffold does NOT include

Listed for clarity so the gap is visible, not as TODOs:

- Read receipts, presence, typing indicators (deliberately — privacy)
- Search across encrypted messages (no server-side index possible)
- Group threads larger than ~10 (per-device fanout grows linearly; the
  `createThread` action enforces this cap today)
- Mobile native apps (web only)
- Voice / video (out of scope for a messaging trust contract)
- Federation / interop with other E2E protocols (Signal, Matrix, MLS)

If any of those is actually needed, it needs a `DECISIONS.md` update before
scoping a PR.
