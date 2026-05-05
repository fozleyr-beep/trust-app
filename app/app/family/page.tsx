import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import {
  AppServiceShell,
  PlatformWorkbenchPanel,
  StepCard,
} from "@/app/components/ServiceFlow";
import {
  AgentBubble,
  FamilyObserverBadge,
  TrustChip,
} from "@/app/components/SakinahPrimitives";
import { getPlatformSnapshot } from "@/lib/service/platform";

export const dynamic = "force-dynamic";

const observerRules = [
  {
    n: "01",
    title: "Read only",
    agent: "Adil",
    state: "live",
    body: "Observer accounts can read the room but cannot send messages. Server-side role enforcement now blocks observer posting.",
  },
  {
    n: "02",
    title: "Visible",
    agent: "Sabr",
    state: "ready",
    body: "Every participant sees when family observers are present. No silent watchers.",
  },
  {
    n: "03",
    title: "No approval",
    agent: "Sakinah",
    state: "ready",
    body: "Observers witness context; they cannot block, approve, or override the seeker.",
  },
  {
    n: "04",
    title: "Exportable",
    agent: "Hafiz",
    state: "gate",
    body: "Observer access and agent decisions should be exportable as an audit trail.",
  },
] as const;

export default async function FamilyPage() {
  const me = await requireDbUser();
  const snapshot = await getPlatformSnapshot(me.id);
  const roomStage =
    snapshot.stages.find((item) => item.href === "/app/threads") ??
    snapshot.stages[5];
  const familyActions = snapshot.actions.filter(
    (item) =>
      item.subject === "family" ||
      item.subject === "safety" ||
      item.agentId === "sabr" ||
      item.agentId === "adil",
  );

  return (
    <AppServiceShell
      body="Family involvement is core to Sakinah, but it cannot become human gatekeeping inside the product. The observer path is visible, read-only, and bounded."
      cta={{ href: "/app/threads" as Route, label: "Open encrypted rooms" }}
      eyebrow="Step 06 · family observers"
      title={
        <>
          Witnessing,
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            not controlling.
          </span>
        </>
      }
    >
      <PlatformWorkbenchPanel
        actions={familyActions}
        metrics={[
          {
            label: "Rooms",
            value: String(snapshot.threads.length),
            body: "Room membership is enforced server-side.",
          },
          {
            label: "Salaam",
            value: String(snapshot.salaams.length),
            body: "Family can witness only after product consent state exists.",
          },
          {
            label: "Observer posting",
            value: "blocked",
            body: "Messaging authz rejects observer sends.",
          },
        ]}
        stage={{
          ...roomStage,
          label: "Family observer boundary",
          owner: "Sabr",
          status: "complete",
          detail:
            "Observer posting is blocked at the messaging authorization layer; family presence must remain visible.",
        }}
      />
      <section className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <FamilyObserverBadge count={2} />
          <TrustChip agent="Adil" action="observer cannot post" timestamp="live" />
        </div>
        <div className="mt-6">
          <AgentBubble agent="Sabr">
            The product should make family presence safer by making it explicit,
            not by turning relatives into hidden moderators or manual approvers.
          </AgentBubble>
        </div>
      </section>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {observerRules.map((rule) => (
          <StepCard key={rule.n} {...rule} />
        ))}
      </div>
    </AppServiceShell>
  );
}
