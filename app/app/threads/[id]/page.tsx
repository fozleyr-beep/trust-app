import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { requireDbUser } from "@/lib/auth/current-user";
import { threadWithPeers } from "@/lib/db/threads";
import { DeviceBootstrap } from "@/app/components/DeviceBootstrap";
import { Composer } from "@/app/components/Composer";
import { MessageStream } from "@/app/components/MessageStream";
import { PeerFingerprints } from "@/app/components/PeerFingerprints";

export const dynamic = "force-dynamic";

function formatPeers(peers: string[]): string {
  if (peers.length === 0) return "(no other members)";
  if (peers.length === 1) return peers[0];
  if (peers.length === 2) return `${peers[0]} and ${peers[1]}`;
  return `${peers[0]} and ${peers.length - 1} others`;
}

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
    <main className="mx-auto max-w-[68ch] px-6 py-20">
      <DeviceBootstrap />
      <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        Thread with
      </p>
      <h1 className="font-serif text-[1.6rem] leading-[1.15]">
        {formatPeers(thread.peerEmails)}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
        Started {new Date(thread.createdAt).toLocaleString()}
      </p>

      <div className="mt-6">
        <PeerFingerprints threadId={thread.id} myUserId={me.id} />
      </div>

      <MessageStream threadId={thread.id} myUserId={me.id} />
      <Composer threadId={thread.id} />

      <p className="mt-12 text-sm">
        <Link
          className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-ink)]"
          href={"/app/threads" as Route}
        >
          ← Back to threads
        </Link>
      </p>
    </main>
  );
}
