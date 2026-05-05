import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import {
  AppServiceShell,
  PlatformWorkbenchPanel,
  StepCard,
} from "@/app/components/ServiceFlow";
import { ServiceRunButton } from "@/app/components/ServiceControls";
import { getPlatformSnapshot } from "@/lib/service/platform";

export const dynamic = "force-dynamic";

const queues = [
  {
    title: "Pressure watch",
    body: "Pending salaam, stale response, repeated nudges, or observer imbalance.",
    status: "live",
  },
  {
    title: "Identity gate",
    body: "Provider-backed identity is not wired yet, so the route stays launch-gated.",
    status: "gate",
  },
  {
    title: "Report path",
    body: "The next build needs explicit pause/report actions without reading room plaintext.",
    status: "ready",
  },
] as const;

export default async function SabrPage() {
  const me = await requireDbUser();
  const snapshot = await getPlatformSnapshot(me.id);
  const sabrActions = snapshot.actions.filter(
    (item) => item.agentId === "sabr" || item.subject === "safety",
  );

  return (
    <AppServiceShell
      body="Sabr's console is the safety and moderation spine. It surfaces product states that can be handled without reading encrypted message plaintext."
      cta={{ href: "/app/settings" as Route, label: "Open audit export" }}
      eyebrow="Ops · Sabr console"
      title={
        <>
          Moderation without
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            private-message access.
          </span>
        </>
      }
    >
      <div className="mb-5">
        <ServiceRunButton agentId="sabr">Refresh Sabr state</ServiceRunButton>
      </div>
      <PlatformWorkbenchPanel
        actions={sabrActions}
        metrics={[
          {
            label: "Pending salaam",
            value: String(snapshot.pendingSalaams.length),
            body: "Visible pressure state, not a staff note.",
          },
          {
            label: "Rooms",
            value: String(snapshot.threads.length),
            body: "Sabr sees metadata only, never plaintext.",
          },
          {
            label: "Audit rows",
            value: String(snapshot.actions.length),
            body: "Agent decisions are exportable service state.",
          },
        ]}
        stage={{
          detail:
            "Safety flags come from consent state, observer roles, stale flows, reports, and account metadata - not decrypted room content.",
          label: "Safety triage",
          owner: "Sabr",
          status: "complete",
        }}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {queues.map((queue, index) => (
          <StepCard
            agent="Sabr"
            body={queue.body}
            key={queue.title}
            n={`0${index + 1}`}
            state={queue.status}
            title={queue.title}
          />
        ))}
      </div>
    </AppServiceShell>
  );
}
