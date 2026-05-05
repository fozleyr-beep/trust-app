import { NextResponse } from "next/server";
import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";
import { parseBody } from "@/lib/api/parse";
import { SendMessage } from "@/lib/api/schemas";
import { validateFanout } from "@/lib/messaging/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESSAGES_GET_LIMIT = 200;

function fromB64(s: string): Buffer {
  return Buffer.from(s, "base64");
}

export async function POST(
  req: Request,
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

  const parsed = await parseBody(req, SendMessage);
  if (parsed.error) return parsed.error;

  // Authorization (extracted to lib/messaging/authz.ts so it has unit
  // tests). Without this, a malicious client could write ciphertext rows
  // pointing at arbitrary device keys — pollution at minimum, exfiltration
  // channel at worst.
  const targetKeyIds = parsed.data.fanout.map((f) => f.recipientDeviceKeyId);
  const targetDevices = await conn
    .select({
      id: schema.deviceKeys.id,
      userId: schema.deviceKeys.userId,
    })
    .from(schema.deviceKeys)
    .where(inArray(schema.deviceKeys.id, targetKeyIds));

  const memberRows = await conn
    .select({ userId: schema.threadMembers.userId })
    .from(schema.threadMembers)
    .where(eq(schema.threadMembers.threadId, threadId));

  const authz = validateFanout({
    fanout: parsed.data.fanout,
    senderRole: membership[0]?.role === "observer" ? "observer" : "participant",
    targetDevices,
    threadMemberUserIds: memberRows.map((m) => m.userId),
  });
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const rows = parsed.data.fanout.map((f) => {
    const cipher = fromB64(f.ciphertext);
    return {
      threadId,
      senderId: me.id,
      recipientDeviceKeyId: f.recipientDeviceKeyId,
      ciphertext: cipher,
      nonce: fromB64(f.nonce),
      cipherSize: cipher.byteLength,
    };
  });

  await conn.insert(schema.messages).values(rows);
  return NextResponse.json({ ok: true, written: rows.length });
}

// GET ?since=<iso> returns messages addressed to ANY of the caller's active
// device keys in this thread. Returns ciphertext as base64; caller decrypts
// locally.
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: threadId } = await ctx.params;
  const me = await requireDbUser();
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date(0);

  const conn = db();

  const myDevices = await conn
    .select({ id: schema.deviceKeys.id })
    .from(schema.deviceKeys)
    .where(eq(schema.deviceKeys.userId, me.id));
  const myDeviceIds = myDevices.map((d) => d.id);
  if (myDeviceIds.length === 0) {
    return NextResponse.json({ messages: [] });
  }

  const rows = await conn
    .select({
      id: schema.messages.id,
      senderId: schema.messages.senderId,
      ciphertext: schema.messages.ciphertext,
      nonce: schema.messages.nonce,
      sentAt: schema.messages.sentAt,
    })
    .from(schema.messages)
    .where(
      and(
        eq(schema.messages.threadId, threadId),
        inArray(schema.messages.recipientDeviceKeyId, myDeviceIds),
        gt(schema.messages.sentAt, since),
      ),
    )
    .orderBy(asc(schema.messages.sentAt))
    .limit(MESSAGES_GET_LIMIT);

  return NextResponse.json({
    messages: rows.map((r) => ({
      id: r.id,
      senderId: r.senderId,
      ciphertext: Buffer.from(r.ciphertext).toString("base64"),
      nonce: Buffer.from(r.nonce).toString("base64"),
      sentAt: r.sentAt.toISOString(),
    })),
  });
}
