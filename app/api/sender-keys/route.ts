import { NextResponse } from "next/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns active device public keys for a list of senders, so the recipient
// can verify+decrypt incoming messages with crypto_box_open_easy. Caller
// must already be in a thread with each sender (we do not check here — the
// data is public-by-design, anyone can fetch a peer's published pubkey).
//
// Body: { userIds: string[] }
type Body = { userIds: string[] };

export async function POST(req: Request) {
  await requireDbUser(); // signed-in only, no other gate
  const body = (await req.json()) as Body;
  if (!Array.isArray(body?.userIds) || body.userIds.length === 0) {
    return NextResponse.json({ keys: [] });
  }
  const conn = db();
  const rows = await conn
    .select({
      id: schema.deviceKeys.id,
      userId: schema.deviceKeys.userId,
      publicKey: schema.deviceKeys.publicKey,
    })
    .from(schema.deviceKeys)
    .where(
      and(
        inArray(schema.deviceKeys.userId, body.userIds),
        isNull(schema.deviceKeys.revokedAt),
      ),
    );
  return NextResponse.json({
    keys: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      publicKey: Buffer.from(r.publicKey).toString("base64"),
    })),
  });
}
