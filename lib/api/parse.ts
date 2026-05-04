import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

// Standard envelope for "parse this body or return a 400". Returns a tuple
// so callers can early-return on the error response without exceptions.
export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: "invalid JSON body" },
        { status: 400 },
      ),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: "validation failed",
          issues: (result.error as ZodError).issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      ),
    };
  }
  return { data: result.data, error: null };
}
