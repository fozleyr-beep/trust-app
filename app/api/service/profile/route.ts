import { NextResponse } from "next/server";
import { parseBody } from "@/lib/api/parse";
import { ServiceProfileInput } from "@/lib/api/schemas";
import { requireDbUser } from "@/lib/auth/current-user";
import {
  getServiceProfile,
  saveServiceProfile,
} from "@/lib/service/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireDbUser();
  return NextResponse.json({ profile: await getServiceProfile(me.id) });
}

export async function POST(req: Request) {
  const me = await requireDbUser();
  const parsed = await parseBody(req, ServiceProfileInput);
  if (parsed.error) return parsed.error;
  const profile = await saveServiceProfile(me.id, parsed.data);
  return NextResponse.json({ profile });
}
