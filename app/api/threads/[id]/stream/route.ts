import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";
import { rateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SSE stream of new messages addressed to the caller's device(s).
//
// Wire format (https://html.spec.whatwg.org/multipage/server-sent-events.html):
//   event: message
//   id: <sentAt iso>
//   data: {"id":"...","senderId":"...","ciphertext":b64,"nonce":b64,"sentAt":iso}
//
// Reconnection is handled by EventSource automatically: it sends the
// last-seen `id:` back as `Last-Event-ID` header, and we resume from that
// timestamp. Heartbeats keep proxies / load balancers from idling out.
//
// This replaces the 4-second client-side polling on /app/threads/[id].
// The legacy GET /api/threads/[id]/messages?since= endpoint is retained
// for the export flow which fetches everything once and decrypts in bulk.

const POLL_INTERVAL_MS = 1500;
const HEARTBEAT_INTERVAL_MS = 20_000;
const PAGE_LIMIT = 50;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: threadId } = await ctx.params;
  const me = await requireDbUser();

  // Rate-limit connection opens per user. Each open holds a long-lived
  // server-side poll loop hitting the DB every 1.5s; 50 tabs = 33 DB polls
  // per second. 10 opens / minute is plenty for any real workflow and a
  // hard cap on accidental fan-out.
  const gate = rateLimit(`stream-open:${me.id}`, {
    capacity: 10,
    refillPerSecond: 0.166,
  });
  if (!gate.ok) {
    return new Response("rate limit", {
      status: 429,
      headers: {
        "retry-after": String(Math.ceil(gate.retryAfterMs / 1000)),
      },
    });
  }

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
    return new Response("not found", { status: 404 });
  }

  // Resume cursor: prefer Last-Event-ID (set by EventSource on reconnect),
  // fall back to ?since=, fall back to a 60-second look-back so the user
  // sees the immediate context without dumping the whole thread.
  const url = new URL(req.url);
  const lastEventId = req.headers.get("last-event-id");
  const sinceParam = url.searchParams.get("since");
  let since: Date;
  if (lastEventId) {
    since = new Date(lastEventId);
  } else if (sinceParam) {
    since = new Date(sinceParam);
  } else {
    since = new Date(Date.now() - 60_000);
  }
  if (Number.isNaN(since.getTime())) since = new Date(Date.now() - 60_000);

  const myDevices = await conn
    .select({ id: schema.deviceKeys.id })
    .from(schema.deviceKeys)
    .where(eq(schema.deviceKeys.userId, me.id));
  const myDeviceIds = myDevices.map((d) => d.id);

  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let stopped = false;

      const safeEnqueue = (s: string) => {
        if (stopped) return;
        try {
          controller.enqueue(enc.encode(s));
        } catch {
          stopped = true;
        }
      };

      const send = (event: string, data: unknown, id?: string) => {
        let out = "";
        if (id) out += `id: ${id}\n`;
        out += `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        safeEnqueue(out);
      };

      send("hello", { since: since.toISOString() });

      const heartbeat = setInterval(() => {
        // SSE comment line — ignored by clients, keeps the connection warm.
        safeEnqueue(`: hb ${Date.now()}\n\n`);
      }, HEARTBEAT_INTERVAL_MS);

      let polling = false;
      const poll = async () => {
        if (stopped || polling) return;
        if (myDeviceIds.length === 0) return;
        polling = true;
        try {
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
                inArray(
                  schema.messages.recipientDeviceKeyId,
                  myDeviceIds,
                ),
                gt(schema.messages.sentAt, since),
              ),
            )
            .orderBy(asc(schema.messages.sentAt))
            .limit(PAGE_LIMIT);

          for (const r of rows) {
            const sentAtIso = r.sentAt.toISOString();
            send(
              "message",
              {
                id: r.id,
                senderId: r.senderId,
                ciphertext: Buffer.from(r.ciphertext).toString("base64"),
                nonce: Buffer.from(r.nonce).toString("base64"),
                sentAt: sentAtIso,
              },
              sentAtIso,
            );
            since = r.sentAt;
          }
        } catch (err) {
          send("error", {
            message: err instanceof Error ? err.message : "poll failed",
          });
        } finally {
          polling = false;
        }
      };

      const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
      void poll(); // first tick immediate so users see context fast

      const cleanup = () => {
        if (stopped) return;
        stopped = true;
        clearInterval(heartbeat);
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "connection": "keep-alive",
      // Disable nginx-style proxy buffering so events arrive in real time.
      "x-accel-buffering": "no",
    },
  });
}
