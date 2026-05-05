import type { Metadata } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AgentPermissionToggles } from "@/app/components/V7Controls";
import { AgentBubble, Eyebrow } from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agent settings — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function AgentSettingsPage() {
  await requireDbUser();
  return (
    <main className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Settings · agents</Eyebrow>
      <h1 className="font-serif text-[3rem] font-normal leading-tight">
        Some promises
        <br />
        <span className="italic text-[var(--color-ink-muted)]">
          cannot be disabled.
        </span>
      </h1>
      <div className="mt-8">
        <AgentPermissionToggles />
      </div>
      <div className="mt-6">
        <AgentBubble agent="Sabr">
          Locked rows are enforced by Sakinah&apos;s promises. The UI is not
          allowed to make privacy optional where the covenant makes it absolute.
        </AgentBubble>
      </div>
    </main>
  );
}
