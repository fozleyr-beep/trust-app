import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth/current-user";
import { getPlatformImprovements } from "@/lib/platform/improvements";
import { getProviderReadiness } from "@/lib/platform/readiness";
import { getPlatformSnapshot } from "@/lib/service/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireDbUser();
  const snapshot = await getPlatformSnapshot(me.id);
  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: { id: me.id, email: me.email },
    profile: snapshot.profile,
    actions: snapshot.actions,
    matches: snapshot.matches,
    platformImprovements: getPlatformImprovements(),
    providerReadiness: getProviderReadiness(),
    salaams: snapshot.salaams,
    threads: snapshot.threads.map((thread) => ({
      id: thread.id,
      createdAt: thread.createdAt.toISOString(),
      peerEmails: thread.peerEmails,
    })),
  });
}
