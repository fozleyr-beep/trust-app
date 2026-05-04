import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { rateLimit } from "./rate-limit";

// The rate limiter is the only thing keeping a logged-in user from running
// up an Anthropic bill or opening 50 SSE streams. These tests pin the
// token-bucket behaviour against future refactors.

describe("rateLimit (token bucket)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("first call is allowed", () => {
    const r = rateLimit("k:fresh-1", { capacity: 3, refillPerSecond: 1 });
    expect(r.ok).toBe(true);
    expect(r.retryAfterMs).toBe(0);
  });

  test("consumes capacity and then denies", () => {
    const opts = { capacity: 3, refillPerSecond: 1 };
    expect(rateLimit("k:burn-1", opts).ok).toBe(true);
    expect(rateLimit("k:burn-1", opts).ok).toBe(true);
    expect(rateLimit("k:burn-1", opts).ok).toBe(true);
    const denied = rateLimit("k:burn-1", opts);
    expect(denied.ok).toBe(false);
    expect(denied.retryAfterMs).toBeGreaterThan(0);
  });

  test("refills over time", () => {
    const opts = { capacity: 2, refillPerSecond: 1 };
    expect(rateLimit("k:refill-1", opts).ok).toBe(true);
    expect(rateLimit("k:refill-1", opts).ok).toBe(true);
    expect(rateLimit("k:refill-1", opts).ok).toBe(false);

    // 1 second of wall-time refills 1 token at refillPerSecond=1
    vi.advanceTimersByTime(1100);
    expect(rateLimit("k:refill-1", opts).ok).toBe(true);
    // immediately again should fail — only one token refilled
    expect(rateLimit("k:refill-1", opts).ok).toBe(false);
  });

  test("retryAfterMs is positive when denied and roughly correct", () => {
    const opts = { capacity: 1, refillPerSecond: 1 };
    expect(rateLimit("k:retry-1", opts).ok).toBe(true);
    const denied = rateLimit("k:retry-1", opts);
    expect(denied.ok).toBe(false);
    // We just consumed the bucket, so we need 1 token / 1tps = ~1000ms
    expect(denied.retryAfterMs).toBeGreaterThanOrEqual(900);
    expect(denied.retryAfterMs).toBeLessThanOrEqual(1100);
  });

  test("different keys have independent buckets", () => {
    const opts = { capacity: 1, refillPerSecond: 0.1 };
    expect(rateLimit("k:iso-a", opts).ok).toBe(true);
    expect(rateLimit("k:iso-a", opts).ok).toBe(false); // a is exhausted
    expect(rateLimit("k:iso-b", opts).ok).toBe(true); // b unaffected
    expect(rateLimit("k:iso-c", opts).ok).toBe(true);
  });

  test("does not refill above capacity", () => {
    const opts = { capacity: 2, refillPerSecond: 1 };
    expect(rateLimit("k:cap-1", opts).ok).toBe(true);
    // Wait 60s — would be 60 tokens uncapped
    vi.advanceTimersByTime(60_000);
    // Drain the bucket; should be exactly 2 tokens (1 left after the
    // first allow + 2 max - already consumed = 2 more allowed; total 3
    // since opening).
    expect(rateLimit("k:cap-1", opts).ok).toBe(true); // 2nd
    expect(rateLimit("k:cap-1", opts).ok).toBe(true); // 3rd (refill after first)
    expect(rateLimit("k:cap-1", opts).ok).toBe(false); // exhausted
  });
});
