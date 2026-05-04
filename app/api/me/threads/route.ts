import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireDbUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireDbUser();
  const conn = db();
  const memberships = await conn
    .select({ threadId: schema.threadMembers.threadId })
    .from(schema.threadMembers)
    .where(eq(schema.threadMembers.userId, me.id));
  const ids = memberships.map((m) => m.threadId);
  if (ids.length === 0) return NextResponse.json({ threads: [] });
  const rows = await conn
    .select({
      id: schema.threads.id,
      createdAt: schema.threads.createdAt,
    })
    .from(schema.threads)
    .where(inArray(schema.threads.id, ids))
    .orderBy(desc(schema.threads.createdAt));
  return NextResponse.json({
    threads: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
