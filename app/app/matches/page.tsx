import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AppServiceShell, StepCard } from "@/app/components/ServiceFlow";
import { AgentBubble, PhotoGate, TrustChip } from "@/app/components/SakinahPrimitives";
import {
  MatchResponseButton,
  ServiceRunButton,
} from "@/app/components/ServiceControls";
import { listMatchSuggestions } from "@/lib/service/operations";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const me = await requireDbUser();
  const matches = await listMatchSuggestions(me.id);

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
      <div className="mb-4">
        <ServiceRunButton agentId="watim">Ask Watim for shortlist</ServiceRunButton>
      </div>
      {matches.length === 0 ? (
        <section className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-6">
          <TrustChip agent="Watim" action="no fake matches" timestamp="live" />
          <div className="mt-5">
            <AgentBubble agent="Watim">
              I will not invent candidates. Save a consented profile first, and
              I need at least one other ready profile before I can show a
              shortlist.
            </AgentBubble>
          </div>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {matches.map((match) => (
            <article
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
              key={match.id}
            >
              <div className="mb-4 flex justify-end">
                <TrustChip agent="Watim" action={match.status} timestamp="now" />
              </div>
              <PhotoGate name={match.label} />
              <h2 className="mt-5 font-serif text-[1.7rem] leading-tight">
                {match.label}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                {match.context || "Private profile context"}
              </p>
              <div className="mt-5">
                <AgentBubble agent="Watim">{match.reason}</AgentBubble>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <MatchResponseButton id={match.id} response="request_salaam">
                  Request salaam
                </MatchResponseButton>
                <MatchResponseButton id={match.id} response="dismiss">
                  Dismiss
                </MatchResponseButton>
              </div>
            </article>
          ))}
        </div>
      )}
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
