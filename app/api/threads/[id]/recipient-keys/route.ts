import { NextResponse } from "next/server";
import { and, eq, isNull, ne, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lists active device keys for every OTHER member of the thread, plus the
// caller's own active keys (so the sender encrypts to their own other devices
// too — multi-device sync without server-side plaintext).

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: threadId } = await ctx.params;
  const me = await requireDbUser();
  const conn = db();

  const membership = await conn
    .select()
    .from(schema.threadMembers)
    .where(
      and(
        eq(schema.threadMembers.threadId, threadId),
        eq(schema.threadMembers.userId, me.id),
      ),
    )
    .limit(1);
  if (membership.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const memberRows = await conn
    .select({ userId: schema.threadMembers.userId })
    .from(schema.threadMembers)
    .where(eq(schema.threadMembers.threadId, threadId));
  const memberIds = memberRows.map((m) => m.userId);

  if (memberIds.length === 0) {
    return NextResponse.json({ keys: [] });
  }

  const keys = await conn
    .select({
      id: schema.deviceKeys.id,
      userId: schema.deviceKeys.userId,
      deviceId: schema.deviceKeys.deviceId,
      publicKey: schema.deviceKeys.publicKey,
    })
    .from(schema.deviceKeys)
    .where(
      and(
        inArray(schema.deviceKeys.userId, memberIds),
        isNull(schema.deviceKeys.revokedAt),
        ne(schema.deviceKeys.userId, "00000000-0000-0000-0000-000000000000"),
      ),
    );

  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k.id,
      userId: k.userId,
      deviceId: k.deviceId,
      publicKey: Buffer.from(k.publicKey).toString("base64"),
    })),
  });
}
