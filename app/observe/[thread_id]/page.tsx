import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDbUser } from "@/lib/auth/current-user";
import { threadWithPeers } from "@/lib/db/threads";
import { MessageStream } from "@/app/components/MessageStream";
import {
  AgentBubble,
  SabrIntervention,
  TrustChip,
  WaliDigestCard,
} from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Observer room — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function ObserveThreadPage({
  params,
}: {
  params: Promise<{ thread_id: string }>;
}) {
  const { thread_id: threadId } = await params;
  const me = await requireDbUser();
  const thread = await threadWithPeers(me.id, threadId);
  if (!thread) notFound();

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            Observer room
          </p>
          <h1 className="font-serif text-[2.8rem] font-normal leading-tight">
            {thread.peerEmails.join(", ") || "private room"}
          </h1>
        </div>
        <TrustChip agent="Adil" action="no composer rendered" timestamp="now" />
      </div>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
          <AgentBubble agent="Adil">
            This is a read-only view. There is no input box here, and the
            message API rejects observer posting at write time.
          </AgentBubble>
          <MessageStream threadId={thread.id} myUserId={me.id} />
        </div>
        <aside className="grid content-start gap-4">
          <WaliDigestCard
            body="The thread is active. Consent prompts and observer boundaries are visible. This digest intentionally contains no verbatim message text."
            writtenAt="today"
          />
          <SabrIntervention state="watching" />
          <Link
            className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-4 text-sm"
            href={"/observe/ask-watim" as Route}
          >
            Ask Watim privately
          </Link>
          <Link
            className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-4 text-sm"
            href={"/observe/notes" as Route}
          >
            Send a thought to Yusuf
          </Link>
        </aside>
      </section>
    </main>
  );
}
