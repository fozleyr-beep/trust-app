import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth/current-user";
import { listMatchSuggestions } from "@/lib/service/operations";
import { explainMatchSuggestion } from "@/lib/service/match-explainability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireDbUser();
  const matches = await listMatchSuggestions(me.id);
  return NextResponse.json({
    matches: matches.map((match) => ({
      ...match,
      evidence: explainMatchSuggestion(match),
    })),
    policy: { fakeInventory: false, weeklyShownLimit: 3 },
  });
}
