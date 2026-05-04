import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { log } from "@/lib/log";

// Resolves Clerk userId → mirrored Drizzle user row. If the row is missing
// (webhook hasn't fired yet, or failed) we backfill from Clerk's currentUser()
// here. This makes the first-auth experience resilient: every protected page
// can rely on the row being present after this returns.

export async function requireDbUser(): Promise<schema.User> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("requireDbUser: no Clerk session");
  }
  const conn = db();

  const existing = await conn
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkId, userId))
    .limit(1);
  if (existing.length > 0) return existing[0];

  // Webhook hasn't mirrored this user yet (or never will, e.g. local dev
  // without ngrok). Backfill from Clerk now.
  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error(
      `requireDbUser: Clerk user ${userId} has no email address`,
    );
  }

  const [row] = await conn
    .insert(schema.users)
    .values({ clerkId: userId, email })
    .onConflictDoUpdate({
      target: schema.users.clerkId,
      set: { email, updatedAt: sql`now()`, deletedAt: null },
    })
    .returning();
  log.info("auth.backfilled", { clerkId: userId, userId: row.id });
  return row;
}
