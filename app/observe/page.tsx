import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireDbUser } from "@/lib/auth/current-user";
import { db, schema } from "@/lib/db";
import { listThreadsWithPeers } from "@/lib/db/threads";
import {
  Eyebrow,
  TrustChip,
  WaliDigestCard,
} from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Observe — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function ObservePage() {
  const me = await requireDbUser();
  const [threads, digests] = await Promise.all([
    listThreadsWithPeers(me.id),
    db()
      .select()
      .from(schema.waliDigests)
      .where(eq(schema.waliDigests.observerId, me.id))
      .orderBy(desc(schema.waliDigests.writtenAt))
      .limit(6),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Observe</Eyebrow>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-serif text-[3rem] font-normal leading-tight">
            Digest first,
            <br />
            <span className="italic text-[var(--color-ink-muted)]">
              no input box.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">
            Observer surfaces are for witnessing and side-channel reflection,
            not posting into seeker conversations.
          </p>
        </div>
        <TrustChip agent="Adil" action="observer read-only" timestamp="now" />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {threads.length === 0 ? (
          <div className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)]">
            No observed rooms yet.
          </div>
        ) : (
          threads.map((thread) => (
            <Link
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
              href={`/observe/${thread.id}` as Route}
              key={thread.id}
            >
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                observed room
              </p>
              <h2 className="mt-3 font-serif text-[1.5rem]">
                {thread.peerEmails.join(", ") || "private room"}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                Started {thread.createdAt.toLocaleDateString()}
              </p>
            </Link>
          ))
        )}
      </section>

      <section className="mt-8 grid gap-4">
        {digests.length === 0 ? (
          <WaliDigestCard
            body="No wali digest has been written yet. Adil writes non-verbatim summaries only after there is consent-state movement to report."
            writtenAt="empty"
          />
        ) : (
          digests.map((digest) => (
            <WaliDigestCard
              body={digest.body}
              key={digest.id}
              writtenAt={digest.writtenAt.toISOString()}
            />
          ))
        )}
      </section>
    </main>
  );
}
