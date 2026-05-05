import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import {
  AppServiceShell,
  PlatformWorkbenchPanel,
  StepCard,
} from "@/app/components/ServiceFlow";
import { DiscoveryFilterWorkbench } from "@/app/components/PlatformPrototypeControls";
import { getPlatformSnapshot } from "@/lib/service/platform";

export const dynamic = "force-dynamic";

export default async function DiscoveryPage() {
  const me = await requireDbUser();
  const snapshot = await getPlatformSnapshot(me.id);
  const matchStage =
    snapshot.stages.find((item) => item.href === "/app/matches") ??
    snapshot.stages[3];
  const watimActions = snapshot.actions.filter(
    (item) => item.agentId === "watim" || item.subject === "matching",
  );
  const savedPreferences = snapshot.profile?.preferences?.trim();

  return (
    <AppServiceShell
      body="This is Sakinah's answer to the search/filter problem: explicit dealbreakers, explainable preferences, and a small weekly set instead of a marketplace browse loop."
      cta={{ href: "/app/matches" as Route, label: "Open shortlist" }}
      eyebrow="Discovery · bounded filters"
      title={
        <>
          Filters without
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            becoming a catalogue.
          </span>
        </>
      }
    >
      <PlatformWorkbenchPanel
        actions={watimActions}
        metrics={[
          {
            label: "Suggestions",
            value: String(snapshot.matches.length),
            body: "Watim only shows real explainable candidates.",
          },
          {
            label: "Profile",
            value: snapshot.profile?.readiness ?? "not started",
            body: "Discovery waits for consented intake state.",
          },
          {
            label: "Weekly cap",
            value: "3",
            body: "The cap is a product constraint, not a missing feature.",
          },
        ]}
        stage={matchStage}
      />
      {savedPreferences && (
        <section className="mb-6 rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            saved preference contract
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            {savedPreferences}
          </p>
        </section>
      )}
      <DiscoveryFilterWorkbench />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StepCard
          agent="Watim"
          body="Sect, geography, marital intent, and family context can block a suggestion."
          n="01"
          state="ready"
          title="Hard gates"
        />
        <StepCard
          agent="Watim"
          body="Values and lifestyle shape the shortlist without creating an endless search page."
          n="02"
          state="ready"
          title="Soft preferences"
        />
        <StepCard
          agent="Sabr"
          body="If filters make the pool too thin, the platform says so instead of inventing matches."
          n="03"
          state="live"
          title="No fake inventory"
        />
      </div>
    </AppServiceShell>
  );
}
