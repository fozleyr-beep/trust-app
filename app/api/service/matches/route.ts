import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth/current-user";
import { listMatchSuggestions } from "@/lib/service/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireDbUser();
  return NextResponse.json({ matches: await listMatchSuggestions(me.id) });
}
