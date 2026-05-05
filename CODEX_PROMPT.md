# Sakinah.family — Codex Prompt Pack (v7)

> Paste **SYSTEM MESSAGE** below as the system prompt in ChatGPT Codex.
> Then issue **TASK** prompts one PR at a time. Always end task prompts with:
> *"Reference CODEX_HANDOFF.yaml and the v7 design canvas. Match component
> contracts in §6 exactly."*

---

## SYSTEM MESSAGE

You are building **Sakinah.family**, a zero-human-touch matrimonial platform
for Muslim families. Your specs come from `CODEX_HANDOFF.yaml`. Your visual
reference is `Sakinah v7.html`. Your component contracts are §6 of the YAML.
These three sources are non-negotiable.

**Hard constraints (§1 of the YAML — internalize before writing code):**

1. Every trust chip MUST name an agent (Watim, Hafiz, Adil, or Sabr), the
   action, and the timestamp. No anonymous "Verified" badges. Reject your
   own code if you produce one.
2. The four agents have explicit boundaries. Adil cannot reveal messages to
   Sakinah staff. Watim cannot read messages once a thread opens. Hafiz hashes
   ID and discards. Sabr never contacts the other party and never surfaces to
   Sakinah staff. Enforce these in the server, not just the UI.
3. The wali observer is read-only. Server must reject any POST to a thread
   from an observer's user_id. Return 403, not 401. Wali digests are written
   by Adil in non-verbatim prose — server validates that no message ciphertext
   appears in `wali_digest.body`.
4. No photo is decryptable before mutual interest. Server enforces this with
   per-photo access tokens issued only after both `interest` rows exist.
5. All numeric strings render in `--mono` with `font-feature-settings: "tnum"`.
6. Sage (`#8A9A7B`) is reserved for trust state. Brass (`#A88547`) appears
   ONCE per page, only on the marketing landing, only as the right-edge thread.
   Reject your own code if either color leaks into other surfaces.
7. Bilingual scaffolding day 1: every component must render correctly with
   `dir=rtl` and Arabic strings, even if Arabic catalog is empty.
8. Sabr surfaces to the seeker only. Sabr's human-review queue lives at
   `/admin/sabr` and is gated by `role=safety_reviewer`. Sakinah staff never
   see message content; reviewers see classifier signals only.

**Stack (locked, do not propose alternatives):**

- Next.js 15 app router · React 18 · Tailwind v4 · TypeScript strict
- Postgres (Neon) · Drizzle ORM
- Clerk + Twilio Verify
- Anthropic Claude Sonnet 4.5 (zero-retention) for Watim, Adil, Sabr decisioning
- Persona + Stripe Identity for Hafiz
- libsodium for end-to-end message encryption
- next-intl for i18n
- Vercel Cron for weekly discovery + daily wali digest

**Anti-patterns (reject your own code if these appear — §2 of the YAML):**

- swipe / streak / infinite feed / leaderboards / read receipts
- mosque silhouettes, crescents, minarets, filigree
- emoji in product copy, drop shadows on cards, decorative gradients
- any "Verified" without an agent name
- referral rewards on `/invite`
- Sabr surfacing to Sakinah staff

---

## PR SEQUENCE — eight PRs, in order

Each task below is a single PR. Open a draft PR per task. Title format:
`feat(<scope>): <PR title>`. Link to the canvas section in the PR body. Run
the §13 acceptance checks before moving to the next.

---

### TASK PR-01 — Project skeleton + brand + i18n

Initialize the Next.js 15 app router project, TypeScript strict, Tailwind v4
with the brand tokens from §4 of the YAML. Set up next-intl with `[en, ar]`
locales and `dir=rtl` support day one. Wire Clerk + Twilio Verify. Drizzle
schema for the **full §5 table set** (including the v7 tables: `salaam_quota`,
`wali_digest`, `wali_note`, `sabr_event`, `donation`, plus `role` column on
`user`).

Lint rules to add:

- Block `<Verified />` and any chip without `agent` prop.
- Block raw `#8A9A7B` outside `components/trust/*`.
- Block raw `#A88547` outside `app/(marketing)/*`.

Playwright base config; one smoke test (`/` returns 200).

---

### TASK PR-02 — Marketing surface

Build the marketing routes. The landing is the **recruiting surface** — get
this right before private surfaces.

- `app/page.tsx` — desktop landing. Hero, honest fold (dark surface), how it
  works, covenant (5 promises), stories, closing dua. Match `Sakinah v7.html`
  artboard `h1` exactly for type, spacing, and motion.
- Mobile landing at 390px — same content, vertical-scroll layout. See artboard
  `ml-1`.
- `/trust` — long-form four-agent argument. Each agent expands; covenant in
  code (server-enforced list); audit-log live demo (read-only, your own).
  Artboard `td-1`.
- `/for-families` — the page parents read. Three principles, four FAQs,
  walis-are-free callout. Artboard `ff-1`.
- `Girih.tsx` — 8-fold khatim SVG that draws stroke-by-stroke on first paint
  and breathes on a 14s loop. Honors `prefers-reduced-motion` (renders static).
- `ArchFrame.tsx` — Persian four-centred arch, hairline draws in over 2.4s.
- `BrassThread.tsx` — single-instance enforcement via React context guard;
  throws in dev if rendered twice.

---

### TASK PR-03 — Onboarding (4 routes) + Hafiz

Build the four onboarding screens as a stepped flow under
`app/onboarding/[step]`. Steps: `greet`, `verify`, `voice`, `family`.

- **greet** — Watim greets, sets expectations, lists the four steps.
- **verify** — Hafiz: ID capture viewport + selfie liveness via Persona +
  Stripe Identity webhooks. ID hashed and discarded; selfie not stored.
- **voice** — Watim. Voice recorder + waveform + Web Speech API live
  transcription + Watim drafts the public profile layer via Anthropic SDK.
  User reviews and approves before publish. Voice file deleted from R2 within
  24h of draft (Vercel cron).
- **family** — invite observers form (optional, skippable).

Target onboarding length: 12 minutes. The voice intake is the heart of the
experience — draw it carefully.

---

### TASK PR-04 — Discovery + Profile + PhotoGate

- `/discovery` — 3 considered matches per week. No infinite scroll. No swipe.
  Each card: PhotoGate (silhouette default), name + age, one-line bio, Watim
  reasoning paragraph, FamilyObserverBadge, ID-verified TrustChip. Empty
  state: *"Watim is still considering this week's three."*
- `/profile/edit` — three-layer editor (public / gated / family).
- `/profile/preview` — match-eye preview.
- `PhotoGate` component with all four modes (`blur`, `soft`, `mosaic`,
  `silhouette`); default silhouette. Per-photo signed URL pattern; R2 bucket
  policy denies direct reads.

---

### TASK PR-05 — Thread + Adil + Salaam

- `/thread/:id` — Adil-mediated chat with libsodium E2E. Server cannot
  decrypt.
- `AgentBubble` for Adil interventions. Distinct from user bubbles: cream-2
  background, sage dot, mono uppercase `ADIL · ` prefix.
- Adil suggests three openers when a thread opens.
- Adil brokers consent prompts: *"Aisha's family asked: does he pray? May I
  share your salaah summary?"* Explicit accept/decline; revocable.
- Salaam: one tap, no message body. 14-day expiry. 3/week quota. Quota meter:
  *"you have N salaam left this week."* Expiring soon (≤2 days): hairline
  pulse, no notification spam.
- `HandoffCeremony` — surfaced by Adil after ≥4 weeks active. Both consent.
  Final wali summary (non-verbatim). Contact details revealed. Thread closes
  within 7 days. Encrypted messages purged.
- `SabrIntervention` in-thread surface: *"Sabr paused this thread for review."*

---

### TASK PR-06 — Wali observer surfaces

- `/observe` — digest list, multiple threads.
- `/observe/:thread_id` — desktop-leaning split. Main pane: read-only thread
  view, no input box. Right rail: trust timeline. Top bar: side-channel
  ("Send a thought to Yusuf") and `/observe/ask-watim` private agent channel.
- Server-side guard: any POST to `/api/threads/:id/messages` from a user_id
  in `family_link.observer_id` returns 403. Playwright test asserts this.
- Adil daily wali digest cron — writes to `wali_digest`. Non-verbatim prose
  only. Server validates no message ciphertext is referenced in body.
- `WaliDigestCard` component.
- `/observe/notes` side-channel (libsodium, scoped to family_link).

---

### TASK PR-07 — Settings + Audit + Invite + Sabr triage

- `/settings/agents` — agent permission toggles. Some toggles are LOCKED
  (enforced by Sakinah's promises). Locked toggles render with opacity 0.4
  and label `enforced · cannot disable`.
- `/settings/audit` — every agent decision in last 90 days, filterable by
  agent, exportable as JSON. Each row: timestamp, agent, action, tag, state.
- `/settings/family-link` — manage observers, including step-back.
- `/invite` — invite-a-loved-one flow. Three steps. **No funnel telemetry
  back to sender.** No referral rewards. Invite expires silently after 30 days.
- `/admin/sabr` — triage console for `role=safety_reviewer`. Surfaces:
  paused threads, classifier confidence, recommended action. Reviewer can:
  confirm pause, reverse pause, escalate to law enforcement. Reviewer cannot:
  read message plaintext, contact users directly.
- Role-based middleware: admin route hard-gated; non-reviewer roles get 404
  (not 403 — don't reveal route existence).

---

### TASK PR-08 — Accessibility, perf, observability, ship

- Lighthouse a11y ≥ 95 on every public route.
- `prefers-reduced-motion` audited everywhere: girih still, tawaf still,
  settles instant.
- PostHog wired with privacy-conserving config — **no per-user funnels in
  observer flows** (parents are not a growth surface).
- Sentry wired.
- Every agent decision flows into `audit_event` with hashed prompt+response.
- Final RTL pass with a native Arabic-speaking reviewer.
- Production env vars + secrets review.

---

## ACCEPTANCE — run before declaring any PR done

```bash
pnpm exec tsc --noEmit                    # strict types
pnpm exec eslint . --max-warnings=0
pnpm test                                  # vitest
pnpm exec playwright test                  # e2e
```

Playwright must cover, by PR-08:

- RTL render of every public + auth route.
- Observer attempting POST → 403.
- Unauthenticated photo fetch → 403.
- Salaam quota: 4th send in a week → blocked.
- Wali digest body never contains message ciphertext (regex assertion + size).
- `/admin/sabr` from non-reviewer role → 404.
- `prefers-reduced-motion: reduce` → no animations run (assert `getComputedStyle`).

Plus manual checks:

- [ ] No `<Verified />` without an agent name anywhere in the DOM.
- [ ] `#8A9A7B` appears only inside `components/trust/*`.
- [ ] `#A88547` appears only on marketing routes.
- [ ] Mobile landing renders cleanly at 360, 390, 428.
- [ ] Page loads with JS disabled show meaningful content (RSC).

---

## DELIVERY

Open a draft PR per task. Title format: `feat(<scope>): <title>`.
Link to the v7 canvas artboard in the PR body. Tag design for visual review
before requesting eng review. Do not merge until §13 acceptance is green.

**When you finish PR-08, you have a shippable v1.**
