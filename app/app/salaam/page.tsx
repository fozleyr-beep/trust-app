import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AppServiceShell, StepCard } from "@/app/components/ServiceFlow";
import { AgentBubble, TrustChip } from "@/app/components/SakinahPrimitives";
import {
  SalaamResponseButton,
  ServiceRunButton,
} from "@/app/components/ServiceControls";
import {
  getSalaamQuotaStatus,
  listSalaamRequests,
} from "@/lib/service/operations";

export const dynamic = "force-dynamic";

const consentRules = [
  {
    n: "01",
    title: "Request",
    agent: "Adil",
    body: "A seeker can send salaam only after viewing the match reason and privacy boundaries.",
  },
  {
    n: "02",
    title: "Expiry",
    agent: "Sabr",
    body: "Unanswered salaam should expire automatically. No staff follow-up, nudging, or pressure.",
  },
  {
    n: "03",
    title: "Mutual",
    agent: "Adil",
    body: "A room opens only when both sides accept. Mutual interest precedes chat and photo reveal.",
  },
  {
    n: "04",
    title: "Handoff",
    agent: "Sakinah",
    body: "When the thread has done enough, Sakinah closes the room and families continue offline.",
  },
] as const;

export default async function SalaamPage() {
  const me = await requireDbUser();
  const salaams = await listSalaamRequests(me.id);
  const quota = await getSalaamQuotaStatus(me.id);

  return (
    <AppServiceShell
      body="Salaam is the consent gate between a match reason and an encrypted room. It keeps the zero-human service respectful without becoming a manual moderator workflow."
      cta={{ href: "/app/family" as Route, label: "Next: family observers" }}
      eyebrow="Step 05 · salaam"
      title={
        <>
          One tap,
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            no pressure.
          </span>
        </>
      }
    >
      <div className="mb-4">
        <ServiceRunButton agentId="adil">Refresh Adil consent state</ServiceRunButton>
      </div>
      <section className="mb-4 grid gap-4 md:grid-cols-3">
        <QuotaMetric label="Salaam left" value={`${quota.left}/${quota.limit}`} />
        <QuotaMetric label="Sent this week" value={String(quota.sent)} />
        <QuotaMetric label="Resets" value={quota.resetsAt} />
      </section>
      {salaams.length > 0 && (
        <section className="mb-4 grid gap-3">
          {salaams.map((salaam) => (
            <article
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
              key={salaam.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
                    {salaam.side} · {salaam.status}
                  </p>
                  <h2 className="mt-3 font-serif text-[1.45rem] leading-tight">
                    {salaam.counterpartyEmail}
                  </h2>
                </div>
                <TrustChip agent="Adil" action={salaam.status} timestamp="live" />
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                Requester: {salaam.requesterStatus}. Recipient:{" "}
                {salaam.recipientStatus}.
                {salaam.threadId ? ` Room: ${salaam.threadId}` : " Room closed."}
              </p>
              {salaam.expiresAt && (
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">
                  {salaam.expired
                    ? "Waiting window has expired."
                    : `Waiting window ends ${salaam.expiresAt.slice(0, 10)}.`}
                </p>
              )}
              {salaam.status === "requested" && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <SalaamResponseButton id={salaam.id} response="accept">
                    Accept
                  </SalaamResponseButton>
                  <SalaamResponseButton id={salaam.id} response="decline">
                    Decline
                  </SalaamResponseButton>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
      <section className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
              Consent preview
            </p>
            <h2 className="mt-4 font-serif text-[1.9rem] leading-tight">
              Yusuf → Aisha
            </h2>
          </div>
          <TrustChip agent="Adil" action="consent boundary visible" timestamp="now" />
        </div>
        <div className="mt-6">
          <AgentBubble agent="Adil">
            I will open a room only if both sides accept. Family observers can
            witness the room, but cannot post or approve on your behalf.
          </AgentBubble>
        </div>
      </section>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {consentRules.map((rule) => (
          <StepCard key={rule.n} {...rule} />
        ))}
      </div>
    </AppServiceShell>
  );
}

function QuotaMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {label}
      </p>
      <p className="mt-2 font-serif text-[1.35rem] leading-tight">{value}</p>
    </article>
  );
}
