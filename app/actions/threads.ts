"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { and, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";
import { log } from "@/lib/log";
import { parseRecipientEmails } from "@/lib/messaging/recipients";

// Threads can be 1:1 or group. Recipients are not deduped against existing
// threads — v1 leaves "is there already a thread with these people?" as a
// UI concern. Cap of MAX_RECIPIENTS keeps the per-send fanout bounded.

const MAX_RECIPIENTS = 9; // up to 10 members total including caller

export async function createThread(formData: FormData): Promise<void> {
  const raw = String(formData.get("recipientEmails") ?? "");
  const parsed = parseRecipientEmails({ raw, maxRecipients: MAX_RECIPIENTS });
  if (!parsed.ok) throw new Error(parsed.error);
  const emails = parsed.emails;

  const me = await requireDbUser();
  const conn = db();

  const recipients = await conn
    .select()
    .from(schema.users)
    .where(
      and(
        inArray(schema.users.email, emails),
        ne(schema.users.id, me.id),
      ),
    );

  // Build a lowercase-email → user lookup; report any addresses that
  // didn't resolve so the user can fix them rather than silently dropping.
  const found = new Set(recipients.map((r) => r.email));
  const missing = emails.filter((e) => !found.has(e));
  if (missing.length > 0) {
    throw new Error(
      `no users with these emails (they must sign up first): ${missing.join(", ")}`,
    );
  }

  const [thread] = await conn
    .insert(schema.threads)
    .values({ createdBy: me.id })
    .returning({ id: schema.threads.id });

  const memberRows = [
    { threadId: thread.id, userId: me.id, role: "participant" },
    ...recipients.map((r) => ({
      threadId: thread.id,
      userId: r.id,
      role: "participant",
    })),
  ];
  await conn.insert(schema.threadMembers).values(memberRows);

  log.info("thread.created", {
    threadId: thread.id,
    creatorId: me.id,
    memberCount: memberRows.length,
  });

  revalidatePath("/app/threads");
  redirect(`/app/threads/${thread.id}` as Route);
}
