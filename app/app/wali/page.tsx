import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import {
  AppServiceShell,
  PlatformWorkbenchPanel,
  StepCard,
} from "@/app/components/ServiceFlow";
import { AgentBubble, FamilyObserverBadge } from "@/app/components/SakinahPrimitives";
import { getPlatformSnapshot } from "@/lib/service/platform";

export const dynamic = "force-dynamic";

const waliRows = [
  ["Can see", "Room metadata, participant names, accepted salaam state"],
  ["Cannot do", "Post, approve, decline, edit preferences, or silently watch"],
  ["Must see", "Their own observer status and the exact room boundary"],
] as const;

export default async function WaliPage() {
  const me = await requireDbUser();
  const snapshot = await getPlatformSnapshot(me.id);

  return (
    <AppServiceShell
      body="A wali or family observer needs a real product surface, not a vague promise. This view defines what they see, what they cannot do, and how the boundary is explained."
      cta={{ href: "/app/family" as Route, label: "Back to family" }}
      eyebrow="Family · wali observer"
      title={
        <>
          A witness view,
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            not a control panel.
          </span>
        </>
      }
    >
      <PlatformWorkbenchPanel
        actions={snapshot.actions.filter(
          (item) => item.agentId === "adil" || item.agentId === "sabr",
        )}
        metrics={[
          {
            label: "Rooms",
            value: String(snapshot.threads.length),
            body: "Observer role is stored on thread membership.",
          },
          {
            label: "Posting",
            value: "denied",
            body: "Server authz rejects observer messages.",
          },
          {
            label: "Visibility",
            value: "required",
            body: "No silent family observers.",
          },
        ]}
        stage={{
          detail:
            "Observer presence must be visible to participants, and observer posting is blocked by the messaging authorization layer.",
          label: "Wali observer view",
          owner: "Adil",
          status: "complete",
        }}
      />
      <section className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <FamilyObserverBadge count={1} />
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            observer mode
          </p>
        </div>
        <div className="mt-6 grid gap-3">
          {waliRows.map(([label, body]) => (
            <div
              className="grid gap-2 border-t border-[var(--color-rule)] pt-4 md:grid-cols-[10rem_1fr]"
              key={label}
            >
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                {label}
              </p>
              <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                {body}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <AgentBubble agent="Sabr">
            Family support becomes safer when power is narrower and visibility
            is higher.
          </AgentBubble>
        </div>
      </section>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StepCard
          agent="Adil"
          body="The observer cannot post because room authorization checks the member role."
          n="01"
          state="live"
          title="Read-only role"
        />
        <StepCard
          agent="Sabr"
          body="Every participant should see when a wali or family observer is present."
          n="02"
          state="ready"
          title="Visible witness"
        />
        <StepCard
          agent="Hafiz"
          body="Observer access must appear in service export and account deletion impact."
          n="03"
          state="gate"
          title="Export trail"
        />
      </div>
    </AppServiceShell>
  );
}
