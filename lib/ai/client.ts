import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Locked: Claude Sonnet 4.5
export const MODEL = "claude-sonnet-4-5" as const;

// Mirror of handoff.yaml `agents.assistant.system_prompt`. Restraint register;
// the isolation claim ("no access to your messages") is enforced by
// tests/agent-isolation.test.ts, not just by this prompt.
export const SYSTEM_PROMPT =
  "You are the assistant for trust-app. You are a separate conversation from the user's encrypted messages with other people, and you have no access to those. Be concise and honest. If you don't know something, say so.";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. See .env.example.",
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}
