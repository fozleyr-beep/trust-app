import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";
import { DeviceBootstrap } from "@/app/components/DeviceBootstrap";
import { Composer } from "@/app/components/Composer";
import { MessageStream } from "@/app/components/MessageStream";
import { PeerFingerprints } from "@/app/components/PeerFingerprints";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireDbUser();
  const conn = db();

  const membership = await conn
    .select()
    .from(schema.threadMembers)
    .where(
      and(
        eq(schema.threadMembers.threadId, id),
        eq(schema.threadMembers.userId, me.id),
      ),
    )
    .limit(1);

  if (membership.length === 0) notFound();

  const [thread] = await conn
    .select()
    .from(schema.threads)
    .where(eq(schema.threads.id, id))
    .limit(1);

  return (
    <main className="mx-auto max-w-[68ch] px-6 py-20">
      <DeviceBootstrap />
      <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        Thread {thread.id.slice(0, 8)}
      </p>
      <h1 className="font-serif text-[1.6rem] leading-[1.15] text-[var(--color-ink-soft)]">
        Started {new Date(thread.createdAt).toLocaleString()}
      </h1>

      <div className="mt-6">
        <PeerFingerprints threadId={thread.id} myUserId={me.id} />
      </div>

      <MessageStream threadId={thread.id} myUserId={me.id} />
      <Composer threadId={thread.id} />

      <p className="mt-12 text-sm">
        <Link
          className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-accent)]"
          href={"/app/threads" as Route}
        >
          ← Back to threads
        </Link>
      </p>
    </main>
  );
}
