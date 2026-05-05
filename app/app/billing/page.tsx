import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { BillingCheckoutButton } from "@/app/components/BillingCheckoutButton";
import { AppServiceShell, StepCard } from "@/app/components/ServiceFlow";

export const dynamic = "force-dynamic";

const billingSteps = [
  {
    n: "01",
    title: "Plan selected",
    agent: "Sakinah",
    state: "ready",
    body: "The user chooses service access in-app. No sales call and no WhatsApp invoice loop.",
  },
  {
    n: "02",
    title: "Checkout",
    agent: "Sakinah",
    state: "gate",
    body: "Stripe Checkout opens when STRIPE_SECRET_KEY and STRIPE_PRICE_ID are configured.",
  },
  {
    n: "03",
    title: "Receipt",
    agent: "Hafiz",
    state: "gate",
    body: "Webhook-confirmed payment should unlock matching and record a timestamped service event.",
  },
  {
    n: "04",
    title: "Manage",
    agent: "Sakinah",
    state: "gate",
    body: "Billing portal is the target for pause, cancel, and card updates without staff mediation.",
  },
] as const;

export default async function BillingPage() {
  await requireDbUser();

  return (
    <AppServiceShell
      body="Payments are part of the zero-human service promise. The route is wired for Stripe Checkout, but production should keep it launch-gated until the Stripe keys, price, and webhook are configured."
      cta={{ href: "/app/matches" as Route, label: "Next: matches" }}
      eyebrow="Step 03 · billing"
      title={
        <>
          Pay without
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            a sales handoff.
          </span>
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <section className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-6">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
            Launch checkout
          </p>
          <h2 className="mt-5 font-serif text-[1.8rem] leading-tight">
            Self-serve payment
          </h2>
          <p className="mt-4 text-sm leading-6 text-[var(--color-ink-soft)]">
            If Stripe is configured, this opens a hosted Checkout Session. If
            not, the API returns a clear launch-gate response instead of
            pretending payment is live.
          </p>
          <div className="mt-6">
            <BillingCheckoutButton />
          </div>
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          {billingSteps.map((step) => (
            <StepCard key={step.n} {...step} />
          ))}
        </div>
      </div>
    </AppServiceShell>
  );
}
