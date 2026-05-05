import {
  parseStripeEvent,
  processStripeEvent,
  verifyStripeSignatureHeader,
} from "@/lib/billing/stripe";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 501 },
    );
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  const ok = verifyStripeSignatureHeader({
    payload,
    header: signature,
    secret,
  });
  if (!ok) {
    log.warn("billing.stripe.invalid_signature", {
      hasSignature: Boolean(signature),
    });
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    const event = parseStripeEvent(payload);
    const result = await processStripeEvent(event, payload);
    log.info("billing.stripe.received", {
      eventId: event.id,
      type: event.type,
      outcome: result.outcome,
    });
    return Response.json({ ok: true, outcome: result.outcome });
  } catch (err) {
    log.error("billing.stripe.failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "webhook failed" }, { status: 400 });
  }
}
