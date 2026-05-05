import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireDbUser } from "@/lib/auth/current-user";
import { db, schema } from "@/lib/db";
import { parseBody } from "@/lib/api/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ProfileLayers = z.object({
  layerPublic: z.record(z.string(), z.unknown()).default({}),
  layerGated: z.record(z.string(), z.unknown()).default({}),
  layerFamily: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(req: Request) {
  const me = await requireDbUser();
  const parsed = await parseBody(req, ProfileLayers);
  if (parsed.error) return parsed.error;

  const [user] = await db()
    .update(schema.users)
    .set({
      layerPublic: parsed.data.layerPublic,
      layerGated: parsed.data.layerGated,
      layerFamily: parsed.data.layerFamily,
      updatedAt: sql`now()`,
    })
    .where(eq(schema.users.id, me.id))
    .returning({
      id: schema.users.id,
      layerPublic: schema.users.layerPublic,
      layerGated: schema.users.layerGated,
      layerFamily: schema.users.layerFamily,
    });

  return NextResponse.json({ user });
}
