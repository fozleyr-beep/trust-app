import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  parseStripeEvent,
  verifyStripeSignatureHeader,
} from "@/lib/billing/stripe";

function signature(payload: string, secret: string, timestamp: number) {
  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

describe("Stripe webhook helpers", () => {
  it("accepts a valid Stripe signature", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
    const secret = "whsec_test";
    const now = 1_777_957_800;
    expect(
      verifyStripeSignatureHeader({
        payload,
        header: signature(payload, secret, now),
        secret,
        now,
      }),
    ).toBe(true);
  });

  it("rejects stale or mismatched signatures", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
    const secret = "whsec_test";
    expect(
      verifyStripeSignatureHeader({
        payload,
        header: signature(payload, "wrong", 100),
        secret,
        now: 100,
      }),
    ).toBe(false);
    expect(
      verifyStripeSignatureHeader({
        payload,
        header: signature(payload, secret, 100),
        secret,
        now: 500,
      }),
    ).toBe(false);
  });

  it("requires Stripe event id and type", () => {
    expect(() => parseStripeEvent("{}")).toThrow(/missing id or type/);
    expect(parseStripeEvent('{"id":"evt_1","type":"customer.subscription.updated"}')).toMatchObject({
      id: "evt_1",
      type: "customer.subscription.updated",
    });
  });
});
