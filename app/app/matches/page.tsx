import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AppServiceShell, StepCard } from "@/app/components/ServiceFlow";
import { AgentBubble, PhotoGate, TrustChip } from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

const matches = [
  {
    name: "Aisha",
    context: "Karachi → London · Architect",
    reason: "Family involvement, city flexibility, and timeline overlap.",
    chip: "match reason visible",
  },
  {
    name: "Yusuf",
    context: "London · Product lead",
    reason: "Strong alignment on deen practice, relocation window, and work rhythm.",
    chip: "shortlist candidate",
  },
  {
    name: "Layla",
    context: "Manchester · Teacher",
    reason: "Compatible family expectations and a low-pressure introduction path.",
    chip: "profile gated",
  },
] as const;

export default async function MatchesPage() {
  await requireDbUser();

  return (
    <AppServiceShell
      body="Watim should produce a small shortlist, not an infinite feed. Every card needs a reason, every photo remains gated, and the next action is consent rather than chat access."
      cta={{ href: "/app/salaam" as Route, label: "Next: salaam" }}
      eyebrow="Step 04 · Watim shortlist"
      title={
        <>
          Three considered,
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            not endless browsing.
          </span>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {matches.map((match) => (
          <article
            className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
            key={match.name}
          >
            <div className="mb-4 flex justify-end">
              <TrustChip agent="Watim" action={match.chip} timestamp="now" />
            </div>
            <PhotoGate name={match.name} />
            <h2 className="mt-5 font-serif text-[1.7rem] leading-tight">
              {match.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {match.context}
            </p>
            <div className="mt-5">
              <AgentBubble agent="Watim">{match.reason}</AgentBubble>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <StepCard
          agent="Watim"
          body="No swipe queue, no popularity ranking, no manual matchmaker intervention."
          n="01"
          title="Limited set"
        />
        <StepCard
          agent="Hafiz"
          body="Photo remains blurred until mutual interest; no one can buy their way past the gate."
          n="02"
          title="Photo gate"
        />
        <StepCard
          agent="Adil"
          body="The next action is a salaam request, not an immediate open thread."
          n="03"
          title="Consent next"
        />
      </div>
    </AppServiceShell>
  );
}
