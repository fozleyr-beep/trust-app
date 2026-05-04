import { anthropic, MODEL, SYSTEM_PROMPT } from "@/lib/ai/client";
import { requireDbUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AgentMessage = { role: "user" | "assistant"; content: string };
type Body = { messages: AgentMessage[] };

// POST /api/agent — streams Anthropic SSE-style as plain text deltas.
// Wire format: each line is a UTF-8 chunk of assistant text, no framing.
// Caller appends the chunks as they arrive.

export async function POST(req: Request) {
  await requireDbUser();
  const body = (await req.json()) as Body;
  const messages = (body?.messages ?? []).filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.length > 0,
  );
  if (messages.length === 0) {
    return new Response("messages required", { status: 400 });
  }

  const stream = await anthropic().messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

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
          }
        }
        controller.close();
      } catch (err) {
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
