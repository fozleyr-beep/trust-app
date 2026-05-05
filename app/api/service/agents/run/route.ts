import { NextResponse } from "next/server";
import { parseBody } from "@/lib/api/parse";
import { RunServiceAgentsInput } from "@/lib/api/schemas";
import { requireDbUser } from "@/lib/auth/current-user";
import { runServiceAgents } from "@/lib/service/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await requireDbUser();
  const parsed = await parseBody(req, RunServiceAgentsInput);
  if (parsed.error) return parsed.error;
  const result = await runServiceAgents(me.id, parsed.data);
  return NextResponse.json(result);
}
