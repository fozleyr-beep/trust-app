import Anthropic from "@anthropic-ai/sdk";

// Locked: Claude Sonnet 4.5
export const MODEL = "claude-sonnet-4-5" as const;

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
