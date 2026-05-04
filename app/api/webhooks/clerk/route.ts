import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mirrors Clerk users into Drizzle. Public route (verified by svix signature),
// not protected by Clerk middleware — see middleware.ts isPublic matcher.
//
// We mirror only id + primary email. Anything else (display name, avatar,
// locale) lives in Clerk and is fetched on demand; the privacy stance is
// "the server holds the minimum it needs to route messages."

type ClerkEvent = {
  type:
    | "user.created"
    | "user.updated"
    | "user.deleted"
    | (string & {});
  data: {
    id: string;
    email_addresses?: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id?: string;
    deleted?: boolean;
  };
};

function primaryEmail(data: ClerkEvent["data"]): string | null {
  const list = data.email_addresses ?? [];
  if (list.length === 0) return null;
  const primary = list.find((e) => e.id === data.primary_email_address_id);
  return (primary ?? list[0]).email_address;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SECRET not set" },
      { status: 500 },
    );
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "missing svix headers" },
      { status: 400 },
    );
  }

  const payload = await req.text();

  let evt: ClerkEvent;
  try {
    evt = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    log.warn("webhook.clerk.invalid_signature", { svixId });
    return NextResponse.json(
      { error: "invalid signature" },
      { status: 401 },
    );
  }

  const { type, data } = evt;
  const conn = db();
  log.info("webhook.clerk.received", { svixId, type, clerkId: data?.id });

  switch (type) {
    case "user.created":
    case "user.updated": {
      const email = primaryEmail(data);
      if (!email) {
        return NextResponse.json(
          { error: "user has no email" },
          { status: 400 },
        );
      }
      await conn
        .insert(schema.users)
        .values({
          clerkId: data.id,
          email,
        })
        .onConflictDoUpdate({
          target: schema.users.clerkId,
          set: {
            email,
            updatedAt: sql`now()`,
            deletedAt: null,
          },
        });
      return NextResponse.json({ ok: true });
    }
    case "user.deleted": {
      await conn
        .update(schema.users)
        .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
        .where(eq(schema.users.clerkId, data.id));
      return NextResponse.json({ ok: true });
    }
    default:
      // ignore other event types (session.*, organization.*, etc.)
      return NextResponse.json({ ok: true, ignored: type });
  }
}
