import { requireDbUser } from "@/lib/auth/current-user";
import { getProviderReadiness } from "@/lib/platform/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireDbUser();
  return Response.json(getProviderReadiness());
}
