import { auth } from "@clerk/nextjs/server";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import {
  createR2SignedGetUrl,
  photoObjectKey,
  privateMediaConfigured,
  verifyPhotoAccessToken,
} from "@/lib/media/photo-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: photoId } = await ctx.params;
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return gated();

  const { userId: clerkId } = await auth();
  const secret = process.env.PHOTO_ACCESS_TOKEN_SECRET;
  if (!clerkId || !secret) return gated();

  const [viewer] = await db()
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.clerkId, clerkId))
    .limit(1);
  if (!viewer) return gated();

  const payload = verifyPhotoAccessToken({
    expectedPhotoId: photoId,
    expectedViewerUserId: viewer.id,
    secret,
    token,
  });
  if (!payload) return gated();

  const [mutual] = await db()
    .select({ id: schema.interests.id })
    .from(schema.interests)
    .where(
      and(
        isNotNull(schema.interests.acceptedAt),
        or(
          and(
            eq(schema.interests.fromId, viewer.id),
            eq(schema.interests.toId, payload.ownerUserId),
          ),
          and(
            eq(schema.interests.fromId, payload.ownerUserId),
            eq(schema.interests.toId, viewer.id),
          ),
        ),
      ),
    )
    .limit(1);
  if (!mutual) return gated();

  if (!privateMediaConfigured()) {
    return NextResponse.json(
      { error: "private media storage is not configured" },
      { status: 501 },
    );
  }

  return NextResponse.redirect(
    createR2SignedGetUrl({ key: photoObjectKey(photoId) }),
  );
}

function gated() {
  return NextResponse.json(
    {
      error:
        "photo is gated; signed URLs require mutual interest and an authenticated session",
    },
    { status: 403 },
  );
}
