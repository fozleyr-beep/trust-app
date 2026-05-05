import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDbUser } from "@/lib/auth/current-user";
import { threadWithPeers } from "@/lib/db/threads";
import { DeviceBootstrap } from "@/app/components/DeviceBootstrap";
import { MessageStream } from "@/app/components/MessageStream";
import { Composer } from "@/app/components/Composer";
import {
  AgentBubble,
  HandoffCeremony,
  SabrIntervention,
  TrustChip,
} from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thread — Sakinah.family",
  robots: { index: false, follow: false },
};

const openers = [
  "What did your family hope this process would protect?",
  "What does a peaceful home look like in ordinary weeks?",
  "Which values should be explicit before feelings grow?",
] as const;

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireDbUser();
  const thread = await threadWithPeers(me.id, id);
  if (!thread) notFound();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <DeviceBootstrap />
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="mb-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            Adil-mediated encrypted thread
          </p>
          <h1 className="font-serif text-[2.6rem] font-normal leading-tight">
            {formatPeers(thread.peerEmails)}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            Server stores ciphertext only. Adil interventions are service
            metadata, not decrypted message reads.
          </p>
        </div>
        <TrustChip agent="Adil" action="room opened by consent" timestamp="now" />
      </div>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div>
          <AgentBubble agent="Adil">
            I suggest beginning with one of these three openers:
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {openers.map((opener) => (
                <li key={opener}>{opener}</li>
              ))}
            </ul>
          </AgentBubble>
          <div className="mt-5 rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4">
            <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              Consent prompt
            </p>
            <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
              Aisha&apos;s family asked: does he pray? May I share your salaah
              summary?
            </p>
            <div className="mt-4 flex gap-3">
              <button className="rounded border border-[var(--color-ink)] px-4 py-2 text-sm">
                Accept
              </button>
              <button className="rounded border border-[var(--color-rule)] px-4 py-2 text-sm">
                Decline
              </button>
            </div>
          </div>
          <MessageStream threadId={thread.id} myUserId={me.id} />
          <Composer threadId={thread.id} />
        </div>
        <aside className="grid content-start gap-4">
          <SabrIntervention state="watching" />
          <HandoffCeremony />
        </aside>
      </section>

      <p className="mt-10 text-sm">
        <Link
          className="underline decoration-from-font underline-offset-4"
          href={"/app/threads" as Route}
        >
          Back to rooms
        </Link>
      </p>
    </main>
  );
}

function formatPeers(peers: string[]): string {
  if (peers.length === 0) return "private room";
  if (peers.length === 1) return peers[0];
  return `${peers[0]} and ${peers.length - 1} other(s)`;
}
