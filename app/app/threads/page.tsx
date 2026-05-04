import Link from "next/link";
import type { Route } from "next";
import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

// Server-rendered. Lists thread metadata only — no message bodies are
// decryptable here, since the server has no decryption keys.

export default async function ThreadsPage() {
  const me = await requireDbUser();
  const conn = db();

  const memberships = await conn
    .select({ threadId: schema.threadMembers.threadId })
    .from(schema.threadMembers)
    .where(eq(schema.threadMembers.userId, me.id));

  const threadIds = memberships.map((m) => m.threadId);

  const threads =
    threadIds.length === 0
      ? []
      : await conn
          .select()
          .from(schema.threads)
          .where(inArray(schema.threads.id, threadIds))
          .orderBy(desc(schema.threads.createdAt));

  return (
    <main className="mx-auto max-w-[68ch] px-6 py-20">
      <div className="mb-10 flex items-baseline justify-between">
        <h1 className="font-serif text-[2rem] leading-[1.1]">Threads</h1>
        <Link
          className="text-sm underline decoration-from-font underline-offset-4 hover:text-[var(--color-accent)]"
          href={"/app/threads/new" as Route}
        >
          + New thread
        </Link>
      </div>

      {threads.length === 0 ? (
        <p className="text-[var(--color-ink-soft)]">
          No threads yet. Start one to see it here.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-rule)]">
          {threads.map((t) => (
            <li key={t.id} className="py-4">
              <Link
                className="block hover:text-[var(--color-accent)]"
                href={`/app/threads/${t.id}` as Route}
              >
                <p className="font-mono text-[0.8rem] text-[var(--color-ink-muted)]">
                  {t.id.slice(0, 8)}
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
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
