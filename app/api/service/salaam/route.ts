import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/auth/current-user";
import {
  getSalaamQuotaStatus,
  listSalaamRequests,
} from "@/lib/service/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireDbUser();
  return NextResponse.json({
    quota: await getSalaamQuotaStatus(me.id),
    salaams: await listSalaamRequests(me.id),
  });
}
