import { AppServiceShell, StatusPill } from "@/app/components/ServiceFlow";
import { AgentBubble } from "@/app/components/SakinahPrimitives";
import { requireDbUser } from "@/lib/auth/current-user";
import {
  getProviderReadiness,
  type ProviderReadinessStatus,
} from "@/lib/platform/readiness";

export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  await requireDbUser();
  const readiness = getProviderReadiness();

  return (
    <AppServiceShell
      body="One page for the launch gates that sit outside product code: auth webhooks, billing, verification, media storage, cron, and telemetry."
      eyebrow="Launch gates"
      title={
        <>
          Provider readiness
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            without hidden blockers.
          </span>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Live" value={readiness.live} />
        <Metric label="Blocked" value={readiness.blocked} />
        <Metric label="Optional" value={readiness.optional} />
        <Metric label="Ready" value={`${readiness.percent}%`} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {readiness.items.map((gate) => (
          <article
            className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
            key={gate.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                  {gate.owner}
                </p>
                <h2 className="mt-2 font-serif text-[1.55rem] leading-tight">
                  {gate.label}
                </h2>
              </div>
              <StatusPill state={pillFor(gate.status)} />
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-ink-soft)]">
              {gate.detail}
            </p>
            <div className="mt-4 rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                Required env
              </p>
              <p className="mt-2 break-words font-mono text-xs leading-5 text-[var(--color-ink-soft)]">
                {gate.env.join(", ")}
              </p>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-ink-muted)]">
              {gate.next}
            </p>
          </article>
        ))}
      </section>

      <div className="mt-6">
        <AgentBubble agent="Sabr">
          Blocked means the platform refuses to pretend a provider-backed
          promise is live. Optional means useful, but not part of service
          delivery.
        </AgentBubble>
      </div>
    </AppServiceShell>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {label}
      </p>
      <p className="mt-3 font-serif text-[2rem] leading-none">{value}</p>
    </article>
  );
}

function pillFor(status: ProviderReadinessStatus) {
  if (status === "live") return "live";
  if (status === "optional") return "ready";
  return "gate";
}
