import type { Metadata } from "next";
import {
  AgentBubble,
  Eyebrow,
  TrustChip,
  Wordmark,
} from "@/app/components/SakinahPrimitives";
import { sakinahAgents } from "@/lib/agents/registry";

export const metadata: Metadata = {
  title: "Sakinah — trust & verification",
  description:
    "The Sakinah trust model: four named agents, explicit boundaries, zero human operator constraints, live encryption guarantees, and launch-gated verification promises.",
  robots: { index: true, follow: true },
};

const COMMIT_SHA = (
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GIT_COMMIT_SHA ??
  "dev"
).slice(0, 7);

const liveGuarantees = [
  {
    title: "Messages between people are end-to-end encrypted",
    body: "The server stores ciphertext, nonce, sender, recipient-device key, and timestamps. It does not store plaintext bodies or a key that decrypts them.",
    path: "lib/crypto/messaging.ts",
  },
  {
    title: "The assistant surface is separate",
    body: "The assistant can read only what you type into that assistant conversation. Tests fail if the agent route imports the messaging tables.",
    path: "tests/agent-isolation.test.ts",
  },
  {
    title: "No analytics, pixels, or replay scripts",
    body: "The middleware applies a nonce-based CSP and keeps browser scripts limited to the app, Clerk, and challenge infrastructure.",
    path: "middleware.ts",
  },
  {
    title: "Device fingerprints are visible",
    body: "Each device has a local keypair. Users can compare fingerprints out of band and rotate the active key if a device is suspect.",
    path: "app/app/settings/page.tsx",
  },
] as const;

const verificationSteps = [
  {
    n: "01",
    title: "ID document",
    body: "Government-issued ID. Hafiz must hash or discard evidence after verification.",
    agent: "Hafiz",
    time: "~30s",
  },
  {
    n: "02",
    title: "Selfie liveness",
    body: "Confirms the person is present today. The launch build must not retain the raw capture.",
    agent: "Hafiz",
    time: "~10s",
  },
  {
    n: "03",
    title: "Phone + email",
    body: "Two active channels for account recovery, salaam expiry, and family-link notices.",
    agent: "Hafiz",
    time: "~1m",
  },
  {
    n: "04",
    title: "Voice intake",
    body: "Watim listens for context and drafts the public layer for the seeker to approve.",
    agent: "Watim",
    time: "~6m",
  },
  {
    n: "05",
    title: "Family link",
    body: "Optional but encouraged. Observers witness; they do not approve or reply.",
    agent: "You",
    time: "~3m",
  },
] as const;

const promises = [
  "Read your messages.",
  "See unblurred photos before mutual interest.",
  "Override your family-link settings.",
  "Route onboarding, matching, mediation, or payment to a human operator.",
  "Sell, share, or train models on your data.",
  "Pause your account without written consent.",
] as const;

const beforeLaunch = [
  "Persona or Stripe Identity wiring for Hafiz verification.",
  "Photo storage and silhouette gate enforcement before any photo is visible.",
  "Wali observer route with server-side read-only permissions.",
  "Agent audit log with timestamped decisions and export.",
  "Stripe Checkout plus billing portal: pay, pause, and manage service without a sales call.",
  "Arabic copy pass and RTL visual QA.",
] as const;

export default function TrustPage() {
  return (
    <main>
      <nav className="border-b border-[var(--color-rule)] px-5 py-5 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Wordmark compact />
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            Trust & verification
          </p>
          <p className="hidden text-sm text-[var(--color-ink-muted)] md:block">
            Last updated 05 May 2026
          </p>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-5 py-16 md:px-10 md:py-20">
        <Eyebrow>The thesis</Eyebrow>
        <h1 className="font-serif text-[3.25rem] font-normal leading-[1.04] tracking-normal md:text-[4rem]">
          A platform without people
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            has to earn trust differently.
          </span>
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--color-ink-soft)]">
          Sakinah is designed around named agents, visible boundaries, and a
          zero-human-operator service flow. No Sakinah staff member should
          onboard, match, mediate, bill, or deliver the service. The current
          private build already enforces the encrypted messaging boundary; the
          identity, photo-gate, observer, and payment systems below are launch
          gates, not marketing promises.
        </p>
      </section>

      <section className="border-y border-[var(--color-rule)] bg-[var(--color-paper-soft)]">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-10 lg:px-14">
          <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            The four agents
          </p>
          <h2 className="font-serif text-[2rem] font-normal">
            Each one named. Each one bounded.
          </h2>
        </div>
        <div className="mx-auto grid max-w-7xl border-t border-[var(--color-rule)] md:grid-cols-2">
          {sakinahAgents.map((agent, index) => (
            <article
              className={[
                "border-b border-[var(--color-rule)] bg-[var(--color-paper)] p-6 md:p-8",
                index % 2 === 0 ? "md:border-r" : "",
              ].join(" ")}
              key={agent.name}
            >
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <h3 className="font-serif text-[2rem] leading-tight">
                    {agent.name}
                  </h3>
                  <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-[var(--color-ink-muted)]">
                    {agent.role}
                  </p>
                </div>
                <p className="font-serif text-[1.5rem] italic text-[var(--color-ink-muted)]">
                  {agent.arabic}
                </p>
              </div>
              <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                {agent.promise}
              </p>
              <dl className="mt-5 space-y-3 text-sm text-[var(--color-ink-soft)]">
                <div className="grid gap-1 sm:grid-cols-[6rem_1fr]">
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                    Boundary
                  </dt>
                  <dd>{agent.boundary}</dd>
                </div>
                <div className="grid gap-1 sm:grid-cols-[6rem_1fr]">
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                    Status
                  </dt>
                  <dd>
                    <TrustChip
                      agent={agent.name}
                      action={agent.status}
                      timestamp="now"
                    />
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-10 lg:px-14">
        <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          The verification ladder
        </p>
        <h2 className="mb-8 font-serif text-[2rem] font-normal leading-tight">
          Five steps. Twelve minutes.
        </h2>
        <div className="overflow-hidden rounded-lg border border-[var(--color-rule)] md:grid md:grid-cols-5">
          {verificationSteps.map((step, index) => (
            <article
              className={[
                "flex min-h-[15rem] flex-col bg-[var(--color-paper)] p-5",
                index < verificationSteps.length - 1
                  ? "border-b border-[var(--color-rule)] md:border-b-0 md:border-r"
                  : "",
              ].join(" ")}
              key={step.n}
            >
              <p className="mb-3 font-mono text-xs text-[var(--color-ink-faint)]">
                {step.n}
              </p>
              <h3 className="font-serif text-[1.15rem] leading-tight">
                {step.title}
              </h3>
              <p className="mt-3 flex-1 text-xs leading-5 text-[var(--color-ink-soft)]">
                {step.body}
              </p>
              <p className="mt-4 flex justify-between gap-3 font-mono text-[0.62rem] text-[var(--color-ink-faint)]">
                <span>by {step.agent}</span>
                <span>{step.time}</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-ink)] px-5 py-16 text-[var(--color-paper)] md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            Five promises
          </p>
          <h2 className="max-w-3xl font-serif text-[2rem] font-normal leading-tight">
            What no one at Sakinah can do.
          </h2>
          <div className="mt-9 grid gap-6 md:grid-cols-5">
            {promises.map((promise, index) => (
              <div key={promise}>
                <p className="mb-3 font-mono text-xs text-[var(--color-ink-faint)]">
                  0{index + 1}
                </p>
                <p className="font-serif text-[1.1rem] leading-6">{promise}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-14">
        <div>
          <Eyebrow>Live in this build</Eyebrow>
          <h2 className="font-serif text-[2.5rem] font-normal leading-tight">
            What the code already defends.
          </h2>
        </div>
        <div className="grid gap-4">
          {liveGuarantees.map((item) => (
            <article
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
              key={item.title}
            >
              <h3 className="font-serif text-[1.35rem]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                {item.body}
              </p>
              <p className="mt-4 font-mono text-[0.68rem] text-[var(--color-ink-faint)]">
                {item.path}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--color-rule)] bg-[var(--color-paper-soft)] px-5 py-16 md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            Before public launch
          </p>
          <h2 className="max-w-3xl font-serif text-[2rem] font-normal leading-tight">
            These claims stay blocked until the implementation exists.
          </h2>
          <div className="mt-9 grid gap-5 md:grid-cols-5">
            {beforeLaunch.map((item, index) => (
              <div key={item}>
                <p className="mb-3 font-mono text-xs text-[var(--color-ink-faint)]">
                  0{index + 1}
                </p>
                <p className="font-serif text-[1.1rem] leading-6">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:px-10 lg:grid-cols-[1fr_1fr] lg:px-14">
        <AgentBubble agent="Adil">
          This page is not allowed to outrun the product. If a future deploy
          says Hafiz verified ID, Sabr paused harm, or family observers are
          read-only, the backend must enforce it first.
        </AgentBubble>
        <footer className="text-sm leading-6 text-[var(--color-ink-muted)]">
          <p>
            This trust page is pinned to commit{" "}
            <code className="font-mono text-[0.8rem]">{COMMIT_SHA}</code>.
          </p>
          <p className="mt-3">
            Report issues to{" "}
            <a
              className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-paper-soft)]"
              href="mailto:fozleyr@gmail.com"
            >
              fozleyr@gmail.com
            </a>
            .
          </p>
        </footer>
      </section>
    </main>
  );
}
