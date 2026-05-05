import { requireDbUser } from "@/lib/auth/current-user";
import { getPlatformImprovements } from "@/lib/platform/improvements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireDbUser();
  return Response.json(getPlatformImprovements());
}
