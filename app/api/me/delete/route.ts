import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/me/delete — self-serve account delete.
//
// 1. Soft-deletes the Drizzle users row (deletedAt, updatedAt).
// 2. Revokes every device key the user has registered (so no one can
//    encrypt to them anymore).
// 3. Hard-deletes the user from Clerk via the admin API. This invalidates
//    all sessions and prevents future sign-ins for this account.
//
// We retain (a) thread membership rows and (b) past message ciphertext
// rows, because other thread members still need them to read their own
// history. The user's email becomes the only identifier we still hold;
// /trust says that, and PR-11 can add a "scrub email" path if DECISIONS.md
// requires fully erasing PII.

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "no session" }, { status: 401 });
  }

  const me = await requireDbUser();
  const conn = db();

  await conn
    .update(schema.deviceKeys)
    .set({ revokedAt: sql`now()` })
    .where(eq(schema.deviceKeys.userId, me.id));

  await conn
    .update(schema.users)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(schema.users.id, me.id));

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (err) {
    log.error("account.delete.clerk_failed", {
      userId: me.id,
      clerkId: userId,
      error: err instanceof Error ? err.message : String(err),
    });
    // The Drizzle side is already irreversibly soft-deleted. Surface a 502
    // so the client knows manual cleanup may be needed; do not re-enable
    // the user.
    return NextResponse.json(
      { error: "account marked deleted; Clerk removal failed" },
      { status: 502 },
    );
  }

  log.info("account.deleted", { userId: me.id, clerkId: userId });
  return NextResponse.json({ ok: true });
}
