import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth/current-user";
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
    salaams: snapshot.salaams,
    threads: snapshot.threads.map((thread) => ({
      id: thread.id,
      createdAt: thread.createdAt.toISOString(),
      peerEmails: thread.peerEmails,
    })),
  });
}
