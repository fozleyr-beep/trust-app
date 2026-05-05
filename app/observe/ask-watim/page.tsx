import type { Metadata } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AgentBubble, Eyebrow, TrustChip } from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ask Watim — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function AskWatimPage() {
  await requireDbUser();
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Private wali channel</Eyebrow>
      <h1 className="font-serif text-[3rem] font-normal leading-tight">
        Ask Watim
        <br />
        <span className="italic text-[var(--color-ink-muted)]">
          without steering the room.
        </span>
      </h1>
      <div className="mt-8">
        <AgentBubble agent="Watim">
          I can explain process state, family boundaries, and next consent
          steps. I cannot reveal private seeker content or optimize for sender
          conversion.
        </AgentBubble>
      </div>
      <section className="mt-5 rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
        <TrustChip agent="Watim" action="private observer channel" timestamp="now" />
        <textarea
          className="mt-5 w-full rounded border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3 text-sm"
          placeholder="Ask about process, not private message content."
          rows={5}
        />
        <button className="mt-4 min-h-11 rounded bg-[var(--color-ink)] px-5 text-sm text-[var(--color-paper)]">
          Ask
        </button>
      </section>
    </main>
  );
}
