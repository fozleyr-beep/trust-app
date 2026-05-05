import { AppServiceShell, StatusPill } from "@/app/components/ServiceFlow";
import { requireDbUser } from "@/lib/auth/current-user";
import {
  getPlatformImprovements,
  type ImprovementStatus,
} from "@/lib/platform/improvements";
import {
  launchCutoverChecklist,
  type LaunchLedgerStatus,
} from "@/lib/platform/launch-ledger";

export const dynamic = "force-dynamic";

export default async function ImprovementsPage() {
  await requireDbUser();
  const plan = getPlatformImprovements();

  return (
    <AppServiceShell
      body="A numbered execution rail for the next fifty platform improvements: score, owner, status, blocker, and next move. This keeps the work sequential without waiting for another handoff."
      eyebrow="Execution rail"
      title={
        <>
          Fifty improvements
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            ranked and moving.
          </span>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-5">
        <Metric label="Total" value={plan.total} />
        <Metric label="Live" value={plan.counts.live} />
        <Metric label="Active" value={plan.counts.active} />
        <Metric label="Blocked" value={plan.counts.blocked} />
        <Metric label="Queued" value={plan.counts.queued} />
      </section>

      <section className="mt-6 rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-5">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          next five by score
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {plan.next.map((item) => (
            <article
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4"
              key={item.n}
            >
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                #{item.n} · {item.score}/10
              </p>
              <h2 className="mt-3 font-serif text-[1.2rem] leading-tight">
                {item.title}
              </h2>
              <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">
                {item.next}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              launch cutover checklist
            </p>
            <h2 className="mt-3 font-serif text-[1.7rem] leading-tight">
              Green means shipped, active means watched, blocked means provider.
            </h2>
          </div>
          <StatusPill state="ready" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {launchCutoverChecklist.map((item) => (
            <article
              className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-4"
              key={item.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                  {item.owner} · {item.proof}
                </p>
                <StatusPill state={pillForLaunch(item.status)} />
              </div>
              <h3 className="mt-3 font-serif text-[1.25rem] leading-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                {item.next}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {plan.items.map((item) => (
          <article
            className="grid gap-4 rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 lg:grid-cols-[4rem_1fr_8rem_8rem]"
            key={item.n}
          >
            <div>
              <p className="font-mono text-[0.68rem] text-[var(--color-ink-faint)]">
                #{String(item.n).padStart(2, "0")}
              </p>
              <p className="mt-2 font-serif text-[1.35rem] leading-none">
                {item.score}/10
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                {item.owner} · {item.phase} · {item.route}
              </p>
              <h2 className="mt-2 font-serif text-[1.45rem] leading-tight">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                {item.next}
              </p>
              {item.blocker && (
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">
                  Blocker: {item.blocker}
                </p>
              )}
            </div>
            <div>
              <StatusPill state={pillFor(item.status)} />
            </div>
            <p className="font-mono text-xs leading-5 text-[var(--color-ink-muted)]">
              {item.route}
            </p>
          </article>
        ))}
      </section>
    </AppServiceShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {label}
      </p>
      <p className="mt-3 font-serif text-[2rem] leading-none">{value}</p>
    </article>
  );
}

function pillFor(status: ImprovementStatus) {
  if (status === "live") return "live";
  if (status === "blocked") return "gate";
  return "ready";
}

function pillForLaunch(status: LaunchLedgerStatus) {
  if (status === "live") return "live";
  if (status === "blocked") return "gate";
  return "ready";
}
