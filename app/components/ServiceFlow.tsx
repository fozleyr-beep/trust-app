import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import {
  AgentBubble,
  ButtonLink,
  Eyebrow,
  TrustChip,
} from "@/app/components/SakinahPrimitives";
import type { AgentActionView } from "@/lib/agents/actions";
import {
  agentActionBaselines,
  agentName,
  agentStageLabels,
  serviceStages,
  type AgentStageState,
} from "@/lib/agents/registry";

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
      <header className="mb-10 flex items-center justify-between gap-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
          Sakinah platform
        </p>
        <ButtonLink href={"/app" as Route} tone="secondary">
          Command
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
            by {agentName(stage.agentId)}
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

export function StatusPill({ state }: { state: AgentStageState }) {
  return (
    <span className="rounded-full border border-[var(--color-rule)] px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-[var(--color-ink-muted)]">
      {agentStageLabels[state]}
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
        {agentActionBaselines.map((item) => (
          <TrustChip
            action={item.action}
            agent={agentName(item.agentId)}
            key={item.key}
            timestamp={item.subject}
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
  state?: AgentStageState;
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

type PlatformWorkbenchStage = {
  label: string;
  owner: string;
  status: "complete" | "active" | "blocked";
  detail: string;
};

type PlatformMetric = {
  label: string;
  value: string;
  body: string;
};

export function PlatformWorkbenchPanel({
  actions,
  metrics,
  stage,
}: {
  actions: AgentActionView[];
  metrics: PlatformMetric[];
  stage: PlatformWorkbenchStage;
}) {
  return (
    <section className="mb-6 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              current stage · {stage.owner}
            </p>
            <h2 className="mt-3 font-serif text-[1.55rem] leading-tight">
              {stage.label}
            </h2>
          </div>
          <StatusPill state={platformStagePill(stage.status)} />
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--color-ink-soft)]">
          {stage.detail}
        </p>
      </article>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <article
            className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
            key={metric.label}
          >
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              {metric.label}
            </p>
            <p className="mt-3 font-serif text-[1.55rem] leading-tight">
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              {metric.body}
            </p>
          </article>
        ))}
      </div>

      <article className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-5 xl:col-span-2">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          latest agent ledger
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {actions.length > 0 ? (
            actions.slice(0, 4).map((item) => (
              <div
                className="border-l border-[var(--color-rule)] pl-4"
                key={item.key}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                    {item.agentName} · {item.subject ?? "service"}
                  </p>
                  <StatusPill state={item.status} />
                </div>
                <p className="mt-2 font-serif text-[1.15rem] leading-tight">
                  {item.action}
                </p>
                {item.detail && (
                  <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                    {item.detail}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
              No ledger rows yet. Run the relevant agent to create visible
              service state.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}

export function AgentOpsPanel({ actions }: { actions: AgentActionView[] }) {
  return (
    <section className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
            Agent operating spine
          </p>
          <h2 className="mt-3 font-serif text-[1.7rem] leading-tight">
            Four agents, one visible ledger.
          </h2>
        </div>
        <ButtonLink href={"/trust" as Route} tone="secondary">
          Boundaries
        </ButtonLink>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {actions.map((item) => (
          <article
            className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4"
            key={item.key}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                {item.agentName} · {item.subject}
              </p>
              <StatusPill state={item.status} />
            </div>
            <h3 className="mt-4 font-serif text-[1.25rem] leading-tight">
              {item.action}
            </h3>
            {item.detail && (
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                {item.detail}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function platformStagePill(
  status: PlatformWorkbenchStage["status"],
): AgentStageState {
  if (status === "complete") return "live";
  if (status === "active") return "ready";
  return "gate";
}
