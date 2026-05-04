"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";

// 1:1 threads are not deduped server-side: a user may have multiple threads with
// the same peer. v1 leaves dedup as a UI/UX layer concern.

export async function createThread(formData: FormData): Promise<void> {
  const recipientEmail = String(formData.get("recipientEmail") ?? "")
    .trim()
    .toLowerCase();

  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("recipientEmail is required");
  }

  const me = await requireDbUser();
  const conn = db();

  const recipients = await conn
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.email, recipientEmail),
        ne(schema.users.id, me.id),
      ),
    )
    .limit(1);

  if (recipients.length === 0) {
    throw new Error(
      `No user with email ${recipientEmail}. They must sign up first.`,
    );
  }
  const recipient = recipients[0];

  const [thread] = await conn
    .insert(schema.threads)
    .values({ createdBy: me.id })
    .returning({ id: schema.threads.id });

  await conn.insert(schema.threadMembers).values([
    { threadId: thread.id, userId: me.id },
    { threadId: thread.id, userId: recipient.id },
  ]);

  revalidatePath("/app/threads");
  redirect(`/app/threads/${thread.id}` as Route);
}
