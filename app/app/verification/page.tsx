import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AppServiceShell, StepCard } from "@/app/components/ServiceFlow";

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
  await requireDbUser();

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {checks.map((check) => (
          <StepCard key={check.n} {...check} />
        ))}
      </div>
    </AppServiceShell>
  );
}
