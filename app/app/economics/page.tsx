import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AppServiceShell, StepCard } from "@/app/components/ServiceFlow";

export const dynamic = "force-dynamic";

const model = [
  {
    n: "01",
    title: "Free trust layer",
    agent: "Sakinah",
    state: "ready",
    body: "Public trust, account creation, intake draft, and privacy contract stay accessible.",
  },
  {
    n: "02",
    title: "Paid service access",
    agent: "Sakinah",
    state: "gate",
    body: "Web subscription unlocks verified matching once Stripe is configured.",
  },
  {
    n: "03",
    title: "Android policy",
    agent: "Sabr",
    state: "gate",
    body: "Android payments wait for Google Play Billing; no external checkout copy inside app.",
  },
  {
    n: "04",
    title: "Scholarship pool",
    agent: "Hafiz",
    state: "ready",
    body: "A future subsidy ledger can support access without manual exception handling.",
  },
] as const;

export default async function EconomicsPage() {
  await requireDbUser();

  return (
    <AppServiceShell
      body="This is the sustainability design, not a live price sheet. It keeps the zero-human service promise compatible with payments, app-store policy, and trust."
      cta={{ href: "/app/billing" as Route, label: "Open billing gate" }}
      eyebrow="Business model · draft"
      title={
        <>
          How this exists
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            after year one.
          </span>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            v1 stance
          </p>
          <p className="mt-3 font-serif text-[1.6rem] leading-tight">
            Trust before monetization
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            The product earns permission before asking for payment.
          </p>
        </article>
        <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            paid unit
          </p>
          <p className="mt-3 font-serif text-[1.6rem] leading-tight">
            Service access
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            Charge for verified service progress, not attention or endless
            browsing.
          </p>
        </article>
        <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            retention
          </p>
          <p className="mt-3 font-serif text-[1.6rem] leading-tight">
            Outcomes, not addiction
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            The system should close loops, not maximize time spent.
          </p>
        </article>
      </section>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {model.map((item) => (
          <StepCard key={item.n} {...item} />
        ))}
      </div>
    </AppServiceShell>
  );
}
