import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "photo is gated; signed URLs require mutual interest and an authenticated session",
    },
    { status: 403 },
  );
}
