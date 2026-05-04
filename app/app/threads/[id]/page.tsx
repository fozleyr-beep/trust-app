import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

// PR-03 scope: just confirm the thread exists and the viewer is a member.
// Real decrypted message stream lands in PR-04.

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

  if (membership.length === 0) {
    // Either not a member or the thread doesn't exist. Either way, 404 is
    // the safer disclosure; do not leak existence.
    notFound();
  }

  const [thread] = await conn
    .select()
    .from(schema.threads)
    .where(eq(schema.threads.id, id))
    .limit(1);

  return (
    <main className="mx-auto max-w-[68ch] px-6 py-20">
      <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        Thread {thread.id.slice(0, 8)}
      </p>
      <h1 className="font-serif text-[1.8rem] leading-[1.15]">
        Started {new Date(thread.createdAt).toLocaleString()}
      </h1>

      <p className="mt-10 text-[var(--color-ink-soft)]">
        The composer and decrypted stream land in PR-04. Until then, this
        thread exists server-side as metadata only.
      </p>

      <p className="mt-10 text-sm">
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
