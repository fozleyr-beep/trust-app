import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST: register or refresh this device's pubkey for the signed-in user.
// Body: { deviceId: string, publicKey: base64 }
//
// ASSUMPTION: re-registering the same deviceId rotates the public key and
// revokes the prior row. If DECISIONS.md says rotation must be a separate
// endpoint with explicit user confirmation, split this.

type RegisterBody = { deviceId: string; publicKey: string };

function fromBase64(s: string): Buffer {
  return Buffer.from(s, "base64");
}

export async function POST(req: Request) {
  const me = await requireDbUser();
  const body = (await req.json()) as RegisterBody;
  if (!body?.deviceId || !body?.publicKey) {
    return NextResponse.json(
      { error: "deviceId and publicKey are required" },
      { status: 400 },
    );
  }
  const conn = db();
  const pub = fromBase64(body.publicKey);

  // Revoke any prior unrevoked row for this user+device
  await conn
    .update(schema.deviceKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.deviceKeys.userId, me.id),
        eq(schema.deviceKeys.deviceId, body.deviceId),
        isNull(schema.deviceKeys.revokedAt),
      ),
    );

  const [row] = await conn
    .insert(schema.deviceKeys)
    .values({
      userId: me.id,
      deviceId: body.deviceId,
      publicKey: pub,
    })
    .returning({ id: schema.deviceKeys.id });

  return NextResponse.json({ id: row.id });
}
