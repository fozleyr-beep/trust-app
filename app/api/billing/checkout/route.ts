import { requireDbUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_CHECKOUT_URL = "https://api.stripe.com/v1/checkout/sessions";

function originFromRequest(req: Request) {
  const url = new URL(req.url);
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return url.origin;
}

export async function POST(req: Request) {
  const me = await requireDbUser();
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;

  if (!secret || !price) {
    return Response.json(
      {
        error:
          "Stripe checkout is launch-gated. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID to enable self-serve payment.",
      },
      { status: 501 },
    );
  }

  const origin = originFromRequest(req);
  const body = new URLSearchParams({
    mode: "subscription",
    success_url: `${origin}/app/billing?checkout=success`,
    cancel_url: `${origin}/app/billing?checkout=cancelled`,
    customer_email: me.email,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    client_reference_id: me.id,
    "metadata[user_id]": me.id,
    "subscription_data[metadata][user_id]": me.id,
  });

  const res = await fetch(STRIPE_CHECKOUT_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !data.url) {
    return Response.json(
      { error: data.error?.message ?? `Stripe HTTP ${res.status}` },
      { status: 502 },
    );
  }

  return Response.json({ url: data.url });
}
