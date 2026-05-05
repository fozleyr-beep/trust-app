import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Locked: Claude Sonnet 4.5
const DIRECT_MODEL = "claude-sonnet-4-5" as const;
const GATEWAY_MODEL = "anthropic/claude-sonnet-4.5" as const;
const GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh";

// Mirror of handoff.yaml `agents.assistant.system_prompt`. Restraint register;
// the isolation claim ("no access to your messages") is enforced by
// tests/agent-isolation.test.ts, not just by this prompt.
export const SYSTEM_PROMPT =
  "You are the assistant for trust-app. You are a separate conversation from the user's encrypted messages with other people, and you have no access to those. Be concise and honest. If you don't know something, say so.";

let _client: Anthropic | null = null;

export function anthropicModel(): string {
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    return process.env.AI_GATEWAY_MODEL ?? GATEWAY_MODEL;
  }
  return process.env.ANTHROPIC_MODEL ?? DIRECT_MODEL;
}

export function anthropic(): Anthropic {
  if (_client) return _client;

  const gatewayKey =
    process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN;
  if (gatewayKey) {
    _client = new Anthropic({
      apiKey: gatewayKey,
      baseURL: process.env.AI_GATEWAY_BASE_URL ?? GATEWAY_BASE_URL,
    });
    return _client;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "No assistant provider configured. Set AI_GATEWAY_API_KEY, rely on Vercel OIDC in production, or set ANTHROPIC_API_KEY.",
    );
  }
  _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}
