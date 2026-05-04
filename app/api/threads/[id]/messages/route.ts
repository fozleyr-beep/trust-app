import { NextResponse } from "next/server";
import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SendBody = {
  // One entry per recipient device — composer encrypted once per device.
  fanout: Array<{
    recipientDeviceKeyId: string;
    ciphertext: string; // base64
    nonce: string; // base64
  }>;
};

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

  const body = (await req.json()) as SendBody;
  if (!Array.isArray(body?.fanout) || body.fanout.length === 0) {
    return NextResponse.json(
      { error: "fanout must be a non-empty array" },
      { status: 400 },
    );
  }

  const rows = body.fanout.map((f) => ({
    threadId,
    senderId: me.id,
    recipientDeviceKeyId: f.recipientDeviceKeyId,
    ciphertext: fromB64(f.ciphertext),
    nonce: fromB64(f.nonce),
    cipherSize: fromB64(f.ciphertext).byteLength,
  }));

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
    .orderBy(asc(schema.messages.sentAt));

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
