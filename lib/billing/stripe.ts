import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const INACTIVE_STATUSES = new Set(["canceled", "incomplete_expired", "unpaid"]);

type StripeObject = Record<string, unknown> & {
  id?: string;
  customer?: string;
  subscription?: string;
  status?: string;
  payment_status?: string;
  current_period_end?: number;
  metadata?: Record<string, string>;
};

export type StripeEvent = {
  id: string;
  type: string;
  data?: { object?: StripeObject };
};

export function verifyStripeSignatureHeader({
  payload,
  header,
  secret,
  now = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
}: {
  payload: string;
  header: string | null;
  secret: string;
  now?: number;
  toleranceSeconds?: number;
}): boolean {
  if (!header) return false;
  const parts = new Map(
    header.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key, rest.join("=")];
    }),
  );
  const timestamp = Number(parts.get("t"));
  const signature = parts.get("v1");
  if (!Number.isFinite(timestamp) || !signature) return false;
  if (Math.abs(now - timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseStripeEvent(payload: string): StripeEvent {
  const event = JSON.parse(payload) as Partial<StripeEvent>;
  if (!event.id || !event.type) {
    throw new Error("Stripe event missing id or type");
  }
  return event as StripeEvent;
}

export async function processStripeEvent(event: StripeEvent, payload: string) {
  const conn = db();
  const existing = await conn
    .select({ id: schema.billingEvents.id })
    .from(schema.billingEvents)
    .where(
      and(
        eq(schema.billingEvents.provider, "stripe"),
        eq(schema.billingEvents.eventId, event.id),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { outcome: "duplicate" as const };
  }

  const outcome = await applyStripeEvent(conn, event);
  const recorded = await conn
    .insert(schema.billingEvents)
    .values({
      provider: "stripe",
      eventId: event.id,
      type: event.type,
      payload,
    })
    .onConflictDoNothing({
      target: [
        schema.billingEvents.provider,
        schema.billingEvents.eventId,
      ],
    })
    .returning({ id: schema.billingEvents.id });

  if (recorded.length === 0) {
    return { outcome: "duplicate" as const };
  }

  return { outcome };
}

async function applyStripeEvent(conn: ReturnType<typeof db>, event: StripeEvent) {
  const object = event.data?.object;
  if (!object) return "recorded" as const;

  if (event.type === "checkout.session.completed") {
    const userId = object.metadata?.user_id;
    if (!userId) return "recorded" as const;
    await upsertEntitlementForUser({
      conn,
      userId,
      status: object.payment_status === "paid" ? "active" : "pending",
      customerId: stringValue(object.customer),
      subscriptionId: stringValue(object.subscription),
      currentPeriodEnd: unixToDate(object.current_period_end),
    });
    return "entitlement_updated" as const;
  }

  if (event.type.startsWith("customer.subscription.")) {
    const status = entitlementStatus(stringValue(object.status));
    const customerId = stringValue(object.customer);
    const subscriptionId = stringValue(object.id);
    const userId = object.metadata?.user_id;
    const currentPeriodEnd = unixToDate(object.current_period_end);

    if (!customerId || !subscriptionId) {
      return "recorded" as const;
    }

    if (userId) {
      await upsertEntitlementForUser({
        conn,
        userId,
        status,
        customerId,
        subscriptionId,
        currentPeriodEnd,
      });
      return "entitlement_updated" as const;
    }

    const updated = await conn
      .update(schema.serviceEntitlements)
      .set({
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        currentPeriodEnd,
        updatedAt: sql`now()`,
      })
      .where(
        or(
          eq(schema.serviceEntitlements.stripeSubscriptionId, subscriptionId),
          and(
            eq(schema.serviceEntitlements.stripeCustomerId, customerId),
            eq(schema.serviceEntitlements.source, "stripe"),
          ),
        ),
      )
      .returning({ id: schema.serviceEntitlements.id });
    return updated.length > 0 ? "entitlement_updated" : "recorded";
  }

  return "recorded" as const;
}

export async function getServiceEntitlement(userId: string) {
  const rows = await db()
    .select()
    .from(schema.serviceEntitlements)
    .where(eq(schema.serviceEntitlements.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

async function upsertEntitlementForUser({
  conn,
  userId,
  status,
  customerId,
  subscriptionId,
  currentPeriodEnd,
}: {
  conn: ReturnType<typeof db>;
  userId: string;
  status: string;
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: Date;
}) {
  await conn
    .insert(schema.serviceEntitlements)
    .values({
      userId,
      status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodEnd,
    })
    .onConflictDoUpdate({
      target: schema.serviceEntitlements.userId,
      set: {
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        currentPeriodEnd,
        updatedAt: sql`now()`,
      },
    });
}

function entitlementStatus(status?: string) {
  if (!status) return "pending";
  if (ACTIVE_STATUSES.has(status)) return "active";
  if (INACTIVE_STATUSES.has(status)) return "inactive";
  return status;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function unixToDate(value: unknown): Date | undefined {
  return typeof value === "number" ? new Date(value * 1000) : undefined;
}
