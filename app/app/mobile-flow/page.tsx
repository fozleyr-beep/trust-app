import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AppServiceShell, StepCard } from "@/app/components/ServiceFlow";
import { MobileFlowPrototype } from "@/app/components/PlatformPrototypeControls";

export const dynamic = "force-dynamic";

export default async function MobileFlowPage() {
  await requireDbUser();

  return (
    <AppServiceShell
      body="A clickable mobile-first path that compresses the product into one believable loop: trust, intake, bounded discovery, salaam, and encrypted room."
      cta={{ href: "/app/discovery" as Route, label: "Next: discovery" }}
      eyebrow="Prototype · mobile end-to-end"
      title={
        <>
          One flow people
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            can actually click.
          </span>
        </>
      }
    >
      <MobileFlowPrototype />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StepCard
          agent="Hafiz"
          body="The prototype starts from trust, not a search box. That is the product stance."
          n="01"
          state="live"
          title="Trust first"
        />
        <StepCard
          agent="Watim"
          body="Discovery is bounded to a few suggestions with reasons, not infinite browsing."
          n="02"
          state="ready"
          title="No swipe feed"
        />
        <StepCard
          agent="Adil"
          body="Salaam is the gate between a match reason and private conversation."
          n="03"
          state="live"
          title="Consent before room"
        />
      </div>
    </AppServiceShell>
  );
}
