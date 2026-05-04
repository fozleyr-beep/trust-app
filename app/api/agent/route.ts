import { anthropic, MODEL, SYSTEM_PROMPT } from "@/lib/ai/client";
import { requireDbUser } from "@/lib/auth/current-user";
import { parseBody } from "@/lib/api/parse";
import { AgentRequest } from "@/lib/api/schemas";
import { rateLimit } from "@/lib/api/rate-limit";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/agent — streams Anthropic responses as plain text-delta chunks.
// Caller appends as they arrive. Rate-limited per user (Anthropic costs $).

export async function POST(req: Request) {
  const me = await requireDbUser();

  // 6 requests per minute per user, burst of 6.
  const gate = rateLimit(`agent:${me.id}`, {
    capacity: 6,
    refillPerSecond: 0.1,
  });
  if (!gate.ok) {
    log.warn("agent.rate_limited", {
      userId: me.id,
      retryAfterMs: gate.retryAfterMs,
    });
    return new Response("rate limit", {
      status: 429,
      headers: {
        "retry-after": String(Math.ceil(gate.retryAfterMs / 1000)),
      },
    });
  }

  const parsed = await parseBody(req, AgentRequest);
  if (parsed.error) return parsed.error;

  const startedAt = Date.now();
  const stream = await anthropic().messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: parsed.data.messages,
  });

  // Capture usage off the stream. message_delta events carry the usage as
  // it accrues; the last one before message_stop has the final counts.
  let inputTokens = 0;
  let outputTokens = 0;

  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          } else if (event.type === "message_start") {
            inputTokens = event.message.usage?.input_tokens ?? 0;
          } else if (event.type === "message_delta") {
            outputTokens = event.usage?.output_tokens ?? outputTokens;
          }
        }
        controller.close();
        log.info("agent.completed", {
          userId: me.id,
          model: MODEL,
          turns: parsed.data.messages.length,
          inputTokens,
          outputTokens,
          latencyMs: Date.now() - startedAt,
        });
      } catch (err) {
        log.error("agent.failed", {
          userId: me.id,
          model: MODEL,
          latencyMs: Date.now() - startedAt,
          error: err instanceof Error ? err.message : String(err),
        });
        controller.error(err);
      }
    },
  });

  return new Response(out, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
