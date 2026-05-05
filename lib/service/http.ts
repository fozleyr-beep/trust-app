import { NextResponse } from "next/server";
import { ServiceOperationError } from "@/lib/service/operations";

export function serviceErrorResponse(error: unknown): NextResponse {
  if (error instanceof ServiceOperationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
