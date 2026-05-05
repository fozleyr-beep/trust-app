import Link from "next/link";
import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { listThreadsWithPeers } from "@/lib/db/threads";

export const dynamic = "force-dynamic";

function formatPeers(peers: string[]): string {
  if (peers.length === 0) return "(no other members)";
  if (peers.length === 1) return peers[0];
  if (peers.length === 2) return `${peers[0]} and ${peers[1]}`;
  return `${peers[0]} and ${peers.length - 1} others`;
}

export default async function ThreadsPage() {
  const me = await requireDbUser();
  const threads = await listThreadsWithPeers(me.id);

  return (
    <main className="mx-auto max-w-[68ch] px-6 py-20">
      <div className="mb-10 flex items-baseline justify-between">
        <h1 className="font-serif text-[2rem] leading-[1.1]">Threads</h1>
        <Link
          className="text-sm underline decoration-from-font underline-offset-4 hover:text-[var(--color-ink)]"
          href={"/app/threads/new" as Route}
        >
          + New thread
        </Link>
      </div>

      {threads.length === 0 ? (
        <div className="rounded border border-[var(--color-rule)] px-6 py-10 text-center">
          <p className="text-[var(--color-ink-soft)]">
            No threads yet.
          </p>
          <p className="mt-4">
            <Link
              className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-paper)] bg-[var(--color-ink)] px-5 py-3 hover:bg-[var(--color-ink-soft)]"
              href={"/app/threads/new" as Route}
            >
              Start the first one
            </Link>
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-rule)]">
          {threads.map((t) => (
            <li key={t.id} className="py-5">
              <Link
                className="block hover:text-[var(--color-ink)]"
                href={`/app/threads/${t.id}` as Route}
              >
                <p className="font-serif text-[1.1rem]">
                  {formatPeers(t.peerEmails)}
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  Started {new Date(t.createdAt).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
