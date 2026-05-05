import { describe, expect, it } from "vitest";
import {
  createPhotoAccessToken,
  createR2SignedGetUrl,
  photoObjectKey,
  privateMediaConfigured,
  verifyPhotoAccessToken,
} from "@/lib/media/photo-access";

describe("photo access tokens", () => {
  const payload = {
    photoId: "photo_123",
    ownerUserId: "owner",
    viewerUserId: "viewer",
    expiresAt: 2_000,
  };

  it("round-trips only for the expected viewer and photo", () => {
    const token = createPhotoAccessToken(payload, "secret");
    expect(
      verifyPhotoAccessToken({
        expectedPhotoId: "photo_123",
        expectedViewerUserId: "viewer",
        now: 1_000,
        secret: "secret",
        token,
      }),
    ).toEqual(payload);
    expect(
      verifyPhotoAccessToken({
        expectedPhotoId: "other",
        expectedViewerUserId: "viewer",
        now: 1_000,
        secret: "secret",
        token,
      }),
    ).toBeNull();
    expect(
      verifyPhotoAccessToken({
        expectedPhotoId: "photo_123",
        expectedViewerUserId: "other",
        now: 1_000,
        secret: "secret",
        token,
      }),
    ).toBeNull();
  });

  it("rejects expired or tampered tokens", () => {
    const token = createPhotoAccessToken(payload, "secret");
    expect(
      verifyPhotoAccessToken({
        expectedPhotoId: "photo_123",
        expectedViewerUserId: "viewer",
        now: 3_000,
        secret: "secret",
        token,
      }),
    ).toBeNull();
    expect(
      verifyPhotoAccessToken({
        expectedPhotoId: "photo_123",
        expectedViewerUserId: "viewer",
        now: 1_000,
        secret: "wrong",
        token,
      }),
    ).toBeNull();
  });
});

describe("R2 photo signing", () => {
  const env = {
    R2_ACCOUNT_ID: "account",
    R2_ACCESS_KEY_ID: "access",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET: "sakinah-photos",
  };

  it("creates a bounded S3-compatible signed URL", () => {
    expect(privateMediaConfigured(env)).toBe(true);
    expect(photoObjectKey("abc")).toBe("photos/abc");
    const url = createR2SignedGetUrl({
      env,
      key: photoObjectKey("abc"),
      now: new Date("2026-05-05T00:00:00.000Z"),
    });
    expect(url).toContain("https://account.r2.cloudflarestorage.com");
    expect(url).toContain("/sakinah-photos/photos/abc?");
    expect(url).toContain("X-Amz-Expires=60");
    expect(url).toContain("X-Amz-Signature=");
  });
});
