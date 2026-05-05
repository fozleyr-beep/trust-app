import { NextResponse } from "next/server";
import { writeDailyWaliDigests } from "@/lib/service/wali-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (secret) {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (token !== secret) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
  }

  const written = await writeDailyWaliDigests();
  return NextResponse.json({ ok: true, written });
}
