import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import {
  AgentBubble,
  ButtonLink,
  Eyebrow,
  TrustChip,
  Wordmark,
} from "@/app/components/SakinahPrimitives";

type StageState = "live" | "ready" | "gate";

export const serviceStages = [
  {
    n: "01",
    agent: "Hafiz",
    title: "Onboard",
    href: "/app/onboarding",
    state: "ready",
    body: "Profile, intent, family context, and voice intake without a coordinator call.",
  },
  {
    n: "02",
    agent: "Hafiz",
    title: "Verify",
    href: "/app/verification",
    state: "gate",
    body: "Identity, liveness, contact, and family-link checks. Provider wiring is the launch gate.",
  },
  {
    n: "03",
    agent: "Sakinah",
    title: "Bill",
    href: "/app/billing",
    state: "gate",
    body: "Self-serve checkout and billing portal. No sales call, no invoice chase.",
  },
  {
    n: "04",
    agent: "Watim",
    title: "Match",
    href: "/app/matches",
    state: "ready",
    body: "A small shortlist with the reason each person is being shown.",
  },
  {
    n: "05",
    agent: "Adil",
    title: "Salaam",
    href: "/app/salaam",
    state: "ready",
    body: "Mutual consent before a room opens. Observers can witness; they cannot post.",
  },
  {
    n: "06",
    agent: "Sabr",
    title: "Family",
    href: "/app/family",
    state: "gate",
    body: "Read-only family observer model. Server-side role enforcement is still a launch gate.",
  },
] as const;

export const agentAudit = [
  {
    agent: "Hafiz",
    action: "intake packet prepared",
    timestamp: "step 01",
  },
  {
    agent: "Watim",
    action: "shortlist reason visible",
    timestamp: "step 04",
  },
  {
    agent: "Adil",
    action: "consent before room",
    timestamp: "step 05",
  },
  {
    agent: "Sabr",
    action: "pressure checks queued",
    timestamp: "always",
  },
] as const;

const stateLabel: Record<StageState, string> = {
  live: "live",
  ready: "operator-free design",
  gate: "launch gate",
};

export function AppServiceShell({
  eyebrow,
  title,
  body,
  children,
  cta,
}: {
  eyebrow: string;
  title: ReactNode;
  body: string;
  children: ReactNode;
  cta?: { href: Route; label: string };
}) {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <header className="mb-12 flex items-center justify-between gap-6">
        <Wordmark compact />
        <ButtonLink href={"/app" as Route} tone="secondary">
          Dashboard
        </ButtonLink>
      </header>
      <section className="grid gap-10 lg:grid-cols-[0.9fr_0.55fr]">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="max-w-3xl font-serif text-[2.8rem] font-normal leading-tight md:text-[4rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--color-ink-soft)]">
            {body}
          </p>
          {cta && (
            <div className="mt-8">
              <ButtonLink href={cta.href}>{cta.label}</ButtonLink>
            </div>
          )}
        </div>
        <AgentAuditRail />
      </section>
      <div className="mt-12">{children}</div>
    </main>
  );
}

export function ServiceStageGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {serviceStages.map((stage) => (
        <Link
          className="group flex min-h-60 flex-col rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-ink-muted)]"
          href={stage.href as Route}
          key={stage.href}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[0.68rem] text-[var(--color-ink-faint)]">
              {stage.n}
            </p>
            <StatusPill state={stage.state} />
          </div>
          <h2 className="mt-7 font-serif text-[1.65rem] leading-tight">
            {stage.title}
          </h2>
          <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            by {stage.agent}
          </p>
          <p className="mt-4 flex-1 text-sm leading-6 text-[var(--color-ink-soft)]">
            {stage.body}
          </p>
          <span className="mt-5 text-sm underline decoration-from-font underline-offset-4 group-hover:text-[var(--color-ink)]">
            Open step
          </span>
        </Link>
      ))}
    </div>
  );
}

export function StatusPill({ state }: { state: StageState }) {
  return (
    <span className="rounded-full border border-[var(--color-rule)] px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-[var(--color-ink-muted)]">
      {stateLabel[state]}
    </span>
  );
}

export function AgentAuditRail() {
  return (
    <aside className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-5">
      <p className="mb-5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
        Agent audit rail
      </p>
      <div className="space-y-3">
        {agentAudit.map((item) => (
          <TrustChip
            action={item.action}
            agent={item.agent}
            key={`${item.agent}-${item.action}`}
            timestamp={item.timestamp}
          />
        ))}
      </div>
      <div className="mt-5">
        <AgentBubble agent="Sabr">
          Every step must be executable without a Sakinah operator. If the code
          cannot enforce it yet, the UI marks it as a launch gate.
        </AgentBubble>
      </div>
    </aside>
  );
}

export function StepCard({
  n,
  title,
  body,
  agent,
  state = "ready",
}: {
  n: string;
  title: string;
  body: string;
  agent: "Watim" | "Hafiz" | "Adil" | "Sabr" | "Sakinah";
  state?: StageState;
}) {
  return (
    <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[0.68rem] text-[var(--color-ink-faint)]">
          {n}
        </p>
        <StatusPill state={state} />
      </div>
      <h2 className="mt-6 font-serif text-[1.45rem] leading-tight">{title}</h2>
      <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {agent}
      </p>
      <p className="mt-4 text-sm leading-6 text-[var(--color-ink-soft)]">
        {body}
      </p>
    </article>
  );
}
