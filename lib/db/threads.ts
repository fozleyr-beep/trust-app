import "server-only";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";

// Returns each thread the user is a member of, with the other members'
// emails attached. Single-thread getter `threadWithPeers` is the same shape
// for one id.

export type ThreadWithPeers = {
  id: string;
  createdAt: Date;
  peerEmails: string[];
};

export async function listThreadsWithPeers(
  userId: string,
): Promise<ThreadWithPeers[]> {
  const conn = db();

  const memberships = await conn
    .select({ threadId: schema.threadMembers.threadId })
    .from(schema.threadMembers)
    .where(eq(schema.threadMembers.userId, userId));
  const threadIds = memberships.map((m) => m.threadId);
  if (threadIds.length === 0) return [];

  const threads = await conn
    .select()
    .from(schema.threads)
    .where(inArray(schema.threads.id, threadIds))
    .orderBy(desc(schema.threads.createdAt));

  const peerRows = await conn
    .select({
      threadId: schema.threadMembers.threadId,
      email: schema.users.email,
    })
    .from(schema.threadMembers)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.threadMembers.userId),
    )
    .where(
      and(
        inArray(schema.threadMembers.threadId, threadIds),
        ne(schema.threadMembers.userId, userId),
      ),
    );

  const peersByThread = new Map<string, string[]>();
  for (const r of peerRows) {
    const list = peersByThread.get(r.threadId) ?? [];
    list.push(r.email);
    peersByThread.set(r.threadId, list);
  }

  return threads.map((t) => ({
    id: t.id,
    createdAt: t.createdAt,
    peerEmails: peersByThread.get(t.id) ?? [],
  }));
}

export async function threadWithPeers(
  userId: string,
  threadId: string,
): Promise<ThreadWithPeers | null> {
  const conn = db();
  const membership = await conn
    .select()
    .from(schema.threadMembers)
    .where(
      and(
        eq(schema.threadMembers.threadId, threadId),
        eq(schema.threadMembers.userId, userId),
      ),
    )
    .limit(1);
  if (membership.length === 0) return null;

  const [thread] = await conn
    .select()
    .from(schema.threads)
    .where(eq(schema.threads.id, threadId))
    .limit(1);
  if (!thread) return null;

  const peers = await conn
    .select({ email: schema.users.email })
    .from(schema.threadMembers)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.threadMembers.userId),
    )
    .where(
      and(
        eq(schema.threadMembers.threadId, threadId),
        ne(schema.threadMembers.userId, userId),
      ),
    );

  return {
    id: thread.id,
    createdAt: thread.createdAt,
    peerEmails: peers.map((p) => p.email),
  };
}
