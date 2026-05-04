import "server-only";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

// Resolves Clerk userId → mirrored Drizzle user row.
// Throws if signed in but the mirror row is missing — that means the webhook
// hasn't fired yet (or failed). PR-04 will add a backfill on first auth'd
// request; for now, surface clearly.

export async function requireDbUser(): Promise<schema.User> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("requireDbUser: no Clerk session");
  }
  const conn = db();
  const rows = await conn
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkId, userId))
    .limit(1);
  if (rows.length === 0) {
    throw new Error(
      `requireDbUser: no users row for clerk_id=${userId}. ` +
        "Webhook may not have fired. Backfill lands in PR-04.",
    );
  }
  return rows[0];
}
