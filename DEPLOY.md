# DEPLOY

Production deploy runbook for `trust-app`. Companion to `CLAUDE_CODE_PROMPT.md`
(local bootstrap) and `DECISIONS.md` (locked decisions). Stack is
Next.js → Vercel, Postgres → Neon, auth → Clerk, AI → Anthropic.

Ten minutes if you're fast. Thirty if it's your first time on any of these.

---

## Pre-flight

Before any account work, verify the local repo is deploy-ready:

```bash
cd /Users/user/trust-app
npm run typecheck      # clean
npm test               # 38/38 pass
npm run build          # clean
npm run check:bundle   # all routes within budget
grep -rn ASSUMPTION app/ lib/ middleware.ts   # zero hits
```

If any of those fail, fix before continuing.

---

## 1. GitHub (≈1 min)

You'll need a public GitHub repo so Vercel can pull from it.

1. Visit https://github.com/new
2. **Owner:** `fozleyr-beep`
3. **Name:** `trust-app`
4. **Visibility:** Public (matches locked decision: "open-source repository")
5. Do **not** add README / .gitignore / license — local repo already has them
6. Click **Create repository**

Then push from this repo:

```bash
cd /Users/user/trust-app
git remote add origin https://github.com/fozleyr-beep/trust-app.git   # only if not already set
git push -u origin main
```

`osxkeychain` will prompt for credentials the first time (browser flow if Git
Credential Manager is installed; otherwise username + Personal Access Token).

---

## 2. Neon — production database (≈2 min)

1. Sign up at https://console.neon.tech/signup (free tier covers v1)
2. **New project:**
   - Project name: `trust-app`
   - Postgres version: 17 (default)
   - Region: **AWS US East 1 / N. Virginia (`us-east-1`)** — matches `vercel.json` `regions: ["iad1"]` (Vercel's IAD = Washington Dulles = AWS us-east-1)
3. After creation, the **Connection string** panel shows the URL
4. Copy the **pooled** connection string. Format:
   ```
   postgresql://<user>:<pwd>@ep-xxx-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Save as `DATABASE_URL`. Don't commit it.

**Faster alternative — neonctl from the terminal:**

```bash
npx neonctl@latest auth                                    # opens browser, OAuth
npx neonctl@latest projects create \
  --name trust-app --region-id aws-us-east-1 --output json
# connection_uris[0].connection_uri is your DATABASE_URL
```

**Apply the schema** (one-time, before first deploy):

```bash
export DATABASE_URL='<your-neon-pooled-url>'
npx drizzle-kit migrate    # non-interactive; applies drizzle/*.sql
npm run db:check           # should report "schema in sync with migrations ✓"
```

This creates the 5 tables (`users`, `device_keys`, `threads`,
`thread_members`, `messages`). `drizzle-kit` does not auto-load `.env.local`,
hence the `export`.

**Why `migrate` instead of `push`** — `drizzle-kit push` is interactive
("Yes, I want to execute all statements") and the prompt does not always
honor piped stdin under non-TTY runners. `migrate` applies the checked-in
SQL files in `drizzle/` non-interactively, which is what you want for
both first-prod and CI.

---

## 3. Clerk — auth (≈5 min)

1. Sign up at https://dashboard.clerk.com/sign-up (free tier covers v1)
2. **Create application:** name `trust-app`. Defaults are fine for sign-in
   options (Email + Password works; turn on others if you want)
3. **API keys** panel — copy:
   - **Publishable key** (`pk_test_...` or `pk_live_...`)
   - **Secret key** (`sk_test_...` or `sk_live_...`)
4. **Webhooks** panel → **Add Endpoint** — but don't fill the URL yet. You
   need the deployed Vercel domain first. Come back in step 5.

---

## 4. Vercel — deploy (≈5 min)

1. Sign up at https://vercel.com/signup (free Hobby tier is fine)
2. Sign in with GitHub when prompted (lets Vercel see your repos)
3. **Add New… → Project** → import `fozleyr-beep/trust-app`
4. **Framework preset:** Next.js (auto-detected)
5. **Root directory:** leave as `./`
6. **Environment Variables** — add all of these (all "Production" scope):

   | Name | Value | Source |
   |---|---|---|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_…` | Clerk → API keys |
   | `CLERK_SECRET_KEY` | `sk_…` | Clerk → API keys |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | constant |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | constant |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/app` | constant |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/app` | constant |
   | `DATABASE_URL` | `postgresql://…?sslmode=require` | Neon |
   | `ANTHROPIC_API_KEY` | `sk-ant-…` | Anthropic console |

   Vercel OIDC is enabled for this project, so production can also use Vercel
   AI Gateway without a raw Anthropic key. Keep `ANTHROPIC_API_KEY` if you want
   direct Anthropic billing/control. Leave `CLERK_WEBHOOK_SECRET` blank unless
   you configure the optional webhook in step 5.

7. Click **Deploy**. First build takes ~2 minutes.

Once green, Vercel gives you a URL like `https://trust-app-<hash>.vercel.app`.
Save it — you need it in the next step.

---

## 5. Clerk webhook (optional, ≈2 min)

The webhook mirrors Clerk users into your Neon `users` table on
`user.created` / `user.updated` / `user.deleted`. The lazy backfill in
`lib/auth/current-user.ts` is the v1 path for signed-in users; add the webhook
when you want canonical delete/update sync from Clerk.

1. Back in Clerk dashboard → **Webhooks** → **Add Endpoint**
2. **Endpoint URL:** `https://<your-vercel-domain>/api/webhooks/clerk`
3. **Subscribe to events:** `user.created`, `user.updated`, `user.deleted`
4. **Save**. Clerk shows the **Signing Secret** (`whsec_…`)
5. Back in Vercel → **Settings → Environment Variables** → add:
   - `CLERK_WEBHOOK_SECRET` = `whsec_…` (Production scope)
6. **Redeploy** so the new env var takes effect — Vercel UI → **Deployments** →
   latest → **⋯** → **Redeploy**

---

## 6. Smoke test (≈5 min)

End-to-end on the production domain:

1. **`/trust`** loads. Footer shows `Pinned to commit <sha>` matching the
   deployed commit (Vercel sets `VERCEL_GIT_COMMIT_SHA`).
2. **`/sign-up`** — create a real account with a real email. Confirm email.
3. After sign-up redirect, you should land on `/app`. The header shows your
   email; the device-bootstrap component generates an X25519 keypair.
4. **`/app/settings`** — fingerprint shown. Rotate the key once; old
   fingerprint still listed as a prior generation.
5. **`/app/threads/new`** — start a thread with your own email (1:1 with
   yourself works). Send a message. Verify it appears in the stream.
6. **`/app/agent`** — ask the assistant a question. Stream renders. Token
   counts logged on completion (check Vercel logs).
7. **`/api/health`** returns `{ ok: true, ts: <iso> }`.

If the optional Clerk webhook is set up, its entry should show ≥1 successful
delivery for your test account. Without it, look for `auth.backfilled` in
Vercel logs after the first signed-in request.

---

## 7. Observability sanity check

- **Vercel → Logs** filters by route. Look for the structured events from
  `lib/log.ts`: `auth.backfilled`, `webhook.clerk.received`,
  `agent.completed`, `agent.rate_limited`, `device.registered`.
- **Neon → Tables** — `users` row created, `device_keys` row created,
  `messages` rows for any threads you tested.
- **Clerk → Users** — your test account, status active.

---

## 8. Hardening before going public

The deploy is "real" but not yet hardened for arbitrary traffic. Before
sharing the URL widely:

- [ ] **Custom domain.** Vercel → Domains → add yours. Update Clerk webhook
      URL to use the custom domain. Update CSP allowlist if needed
      (`middleware.ts`).
- [ ] **Move Clerk to live keys** (currently `pk_test_…` / `sk_test_…`).
      Replace both env vars in Vercel. Redeploy.
- [ ] **Assistant billing**. Verify the active path (direct Anthropic key or
      Vercel AI Gateway) has spend controls attached. The in-app rate limit
      is 6/min/user.
- [ ] **Vercel Pro** if traffic exceeds Hobby limits. Hobby is fine for
      personal / portfolio scale.

---

## Recovery cookbook

**Build fails on Vercel but passes locally** — `npm run check:bundle` budget
violation is the most likely cause. Look at the build log; the failing route
will be in the output.

**Webhook 401 in Clerk** — wrong `CLERK_WEBHOOK_SECRET` in Vercel, or you
forgot to redeploy after adding it. Check Clerk → Webhooks → recent
deliveries.

**`POST /api/agent` returns 500** — no assistant provider is available, or the
active key was rejected. Check `ANTHROPIC_API_KEY`; if using Vercel AI Gateway,
confirm project OIDC is enabled and the function has `VERCEL_OIDC_TOKEN`.

**`db:push` errors with "permission denied for schema public"** — Neon's
default role usually has it, but if you created the role manually you may
need `GRANT ALL ON SCHEMA public TO <role>;` from Neon's SQL editor.

**Schema drift after deploy** — run `npm run db:check` against the prod
`DATABASE_URL`. If it reports drift, run `npm run db:push` against the prod
URL once. Don't run from CI.

---

## What happens on every future push

CI on GitHub runs typecheck + tests + build + bundle budget + schema-drift
check. Vercel auto-deploys main on push.

The deploy URL is stable per branch (`trust-app-<hash>` on every PR preview,
the production URL on `main`). Preview deploys use the same env vars by
default — change scope to "Production only" in Vercel for any var you don't
want bleeding into previews.
