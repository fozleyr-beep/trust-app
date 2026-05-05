import { NextResponse } from "next/server";
import {
  ensureAgentActionBaselines,
  listAgentActionsForUser,
} from "@/lib/agents/actions";
import { sakinahAgents } from "@/lib/agents/registry";
import { requireDbUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireDbUser();
  await ensureAgentActionBaselines(me.id);
  const actions = await listAgentActionsForUser(me.id);
  return NextResponse.json({
    agents: sakinahAgents,
    actions,
  });
}
