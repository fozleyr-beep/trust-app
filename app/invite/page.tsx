import type { Metadata } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { InviteLovedOneFlow } from "@/app/components/V7Controls";
import { AgentBubble, Eyebrow, TrustChip } from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invite — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function InvitePage() {
  await requireDbUser();
  return (
    <main className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Invite a loved one</Eyebrow>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h1 className="font-serif text-[3rem] font-normal leading-tight">
          Ask someone
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            to witness.
          </span>
        </h1>
        <TrustChip agent="Hafiz" action="invite expires silently" timestamp="30d" />
      </div>
      <div className="mt-8">
        <InviteLovedOneFlow />
      </div>
      <div className="mt-6">
        <AgentBubble agent="Sabr">
          This flow has no referral reward and no funnel telemetry back to the
          sender. The loved one is not a growth surface.
        </AgentBubble>
      </div>
    </main>
  );
}
