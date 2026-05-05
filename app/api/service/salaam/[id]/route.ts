import { NextResponse } from "next/server";
import { parseBody } from "@/lib/api/parse";
import { SalaamResponseInput } from "@/lib/api/schemas";
import { requireDbUser } from "@/lib/auth/current-user";
import { respondToSalaamRequest } from "@/lib/service/operations";
import { serviceErrorResponse } from "@/lib/service/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const me = await requireDbUser();
  const { id } = await ctx.params;
  const parsed = await parseBody(req, SalaamResponseInput);
  if (parsed.error) return parsed.error;
  try {
    return NextResponse.json({
      salaam: await respondToSalaamRequest(me.id, id, parsed.data),
    });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
