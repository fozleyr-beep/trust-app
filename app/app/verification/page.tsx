import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { DeviceBootstrap } from "@/app/components/DeviceBootstrap";
import { ServiceRunButton } from "@/app/components/ServiceControls";
import {
  AppServiceShell,
  PlatformWorkbenchPanel,
  StepCard,
} from "@/app/components/ServiceFlow";
import { getPlatformSnapshot } from "@/lib/service/platform";

export const dynamic = "force-dynamic";

const checks = [
  {
    n: "01",
    title: "Identity document",
    agent: "Hafiz",
    state: "gate",
    body: "Provider-backed ID check. Raw evidence must be discarded or reduced to a non-reversible verification result.",
  },
  {
    n: "02",
    title: "Selfie liveness",
    agent: "Hafiz",
    state: "gate",
    body: "Confirms the person is present today. The launch build must not retain the raw capture.",
  },
  {
    n: "03",
    title: "Phone + email",
    agent: "Hafiz",
    state: "ready",
    body: "Two active channels for account recovery, salaam expiry, payment receipts, and family-link notices.",
  },
  {
    n: "04",
    title: "Duplicate account",
    agent: "Sabr",
    state: "gate",
    body: "Risk signals should stop repeat accounts before they reach matching, without exposing private evidence.",
  },
] as const;

export default async function VerificationPage() {
  const me = await requireDbUser();
  const snapshot = await getPlatformSnapshot(me.id);
  const stage =
    snapshot.stages.find((item) => item.href === "/app/verification") ??
    snapshot.stages[1];
  const verificationActions = snapshot.actions.filter(
    (item) => item.subject === "verification" || item.agentId === "hafiz",
  );

  return (
    <AppServiceShell
      body="Hafiz should verify a seeker without a manual reviewer sitting behind the curtain. Until an identity provider is wired, this page marks those checks as launch gates."
      cta={{ href: "/app/billing" as Route, label: "Next: billing" }}
      eyebrow="Step 02 · Hafiz verification"
      title={
        <>
          Verification needs
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            proof, not staff.
          </span>
        </>
      }
    >
      <DeviceBootstrap />
      <div className="mb-5">
        <ServiceRunButton agentId="hafiz">Refresh Hafiz checks</ServiceRunButton>
      </div>
      <PlatformWorkbenchPanel
        actions={verificationActions}
        metrics={[
          {
            label: "Device key",
            value: stage.status === "complete" ? "present" : "missing",
            body: "Private rooms need a registered public device key.",
          },
          {
            label: "Profile",
            value: snapshot.profile?.readiness ?? "not started",
            body: "Hafiz uses consented profile state only.",
          },
          {
            label: "ID provider",
            value: "launch gate",
            body: "Raw ID evidence is not stored in the product database.",
          },
        ]}
        stage={stage}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {checks.map((check) => (
          <StepCard key={check.n} {...check} />
        ))}
      </div>
    </AppServiceShell>
  );
}
