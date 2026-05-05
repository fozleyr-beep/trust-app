import type { Metadata } from "next";
import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import {
  listMatchSuggestions,
  getServiceProfile,
} from "@/lib/service/operations";
import { MatchResponseButton, ServiceRunButton } from "@/app/components/ServiceControls";
import {
  AgentBubble,
  ButtonLink,
  FamilyObserverBadge,
  PhotoGate,
  TrustChip,
} from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discovery — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function DiscoveryPage() {
  const me = await requireDbUser();
  const [matches, profile] = await Promise.all([
    listMatchSuggestions(me.id),
    getServiceProfile(me.id),
  ]);
  const shown = matches.slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            Discovery · 3 per week
          </p>
          <h1 className="font-serif text-[3rem] font-normal leading-tight">
            Considered matches,
            <br />
            <span className="italic text-[var(--color-ink-muted)]">
              no infinite scroll.
            </span>
          </h1>
        </div>
        <ServiceRunButton agentId="watim">Ask Watim to consider</ServiceRunButton>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Metric label="Weekly cap" value="3" />
        <Metric label="Ready profile" value={profile?.readiness ?? "missing"} />
        <Metric label="Shown now" value={String(shown.length)} />
      </section>

      {shown.length === 0 ? (
        <section className="mt-8 rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-6">
          <TrustChip agent="Watim" action="still considering" timestamp="this week" />
          <p className="mt-5 font-serif text-[1.8rem] leading-tight">
            Watim is still considering this week&apos;s three.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            If the verified pool is too small, the system says so instead of
            inventing a candidate.
          </p>
        </section>
      ) : (
        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {shown.map((match) => (
            <article
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
              key={match.id}
            >
              <div className="mb-4 flex justify-between gap-3">
                <FamilyObserverBadge count={1} mode="contextual" />
                <TrustChip agent="Hafiz" action="ID verified" timestamp="now" />
              </div>
              <PhotoGate mode="silhouette" name={match.label} />
              <h2 className="mt-5 font-serif text-[1.7rem] leading-tight">
                {match.label}, age private
              </h2>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                {match.context || "One-line bio appears after profile approval."}
              </p>
              <div className="mt-5">
                <AgentBubble agent="Watim">{match.reason}</AgentBubble>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <MatchResponseButton id={match.id} response="request_salaam">
                  Send salaam
                </MatchResponseButton>
                <MatchResponseButton id={match.id} response="dismiss">
                  Pass
                </MatchResponseButton>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="mt-8">
        <ButtonLink href={"/profile/preview" as Route} tone="secondary">
          Match-eye preview
        </ButtonLink>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {label}
      </p>
      <p className="mt-2 font-serif text-[1.7rem]">{value}</p>
    </div>
  );
}
