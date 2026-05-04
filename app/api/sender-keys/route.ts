import { NextResponse } from "next/server";
import { and, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";
import { parseBody } from "@/lib/api/parse";
import { SenderKeysRequest } from "@/lib/api/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns active device public keys for a list of senders, so the recipient
// can verify+decrypt incoming messages with crypto_box_open. Caller must be
// signed in; pubkeys are public-by-design, so no per-user gating beyond auth.

export async function POST(req: Request) {
  await requireDbUser();
  const parsed = await parseBody(req, SenderKeysRequest);
  if (parsed.error) return parsed.error;
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
        inArray(schema.deviceKeys.userId, parsed.data.userIds),
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
