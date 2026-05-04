// In-memory token bucket per (key). Resets when the lambda recycles, which
// is fine as a first-line defense — Vercel's platform-level limits backstop.
// Replace with Upstash/Redis when DECISIONS.md says so.

type Bucket = { tokens: number; lastRefillMs: number };

const BUCKETS = new Map<string, Bucket>();

export function rateLimit(key: string, opts: {
  capacity: number;
  refillPerSecond: number;
}): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const b = BUCKETS.get(key) ?? {
    tokens: opts.capacity,
    lastRefillMs: now,
  };
  const elapsed = (now - b.lastRefillMs) / 1000;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSecond);
  b.lastRefillMs = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    BUCKETS.set(key, b);
    return { ok: true, retryAfterMs: 0 };
  }
  BUCKETS.set(key, b);
  const retryAfterMs = Math.ceil(((1 - b.tokens) / opts.refillPerSecond) * 1000);
  return { ok: false, retryAfterMs };
}
