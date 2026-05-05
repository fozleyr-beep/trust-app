import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type PhotoAccessPayload = {
  photoId: string;
  ownerUserId: string;
  viewerUserId: string;
  expiresAt: number;
};

type Env = Record<string, string | undefined>;

const TOKEN_VERSION = "v1";

export function privateMediaConfigured(env: Env = process.env) {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET,
  );
}

export function createPhotoAccessToken(
  payload: PhotoAccessPayload,
  secret: string,
) {
  const body = base64Url(JSON.stringify({ ...payload, v: TOKEN_VERSION }));
  const sig = sign(body, secret);
  return `${body}.${sig}`;
}

export function verifyPhotoAccessToken({
  expectedPhotoId,
  expectedViewerUserId,
  secret,
  token,
  now = Date.now(),
}: {
  expectedPhotoId: string;
  expectedViewerUserId: string;
  secret: string;
  token: string;
  now?: number;
}): PhotoAccessPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!constantTimeEqual(sig, sign(body, secret))) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as PhotoAccessPayload & { v?: string };
    if (decoded.v !== TOKEN_VERSION) return null;
    if (decoded.photoId !== expectedPhotoId) return null;
    if (decoded.viewerUserId !== expectedViewerUserId) return null;
    if (!decoded.ownerUserId || decoded.ownerUserId === expectedViewerUserId) {
      return null;
    }
    if (!Number.isFinite(decoded.expiresAt) || decoded.expiresAt <= now) {
      return null;
    }
    return {
      photoId: decoded.photoId,
      ownerUserId: decoded.ownerUserId,
      viewerUserId: decoded.viewerUserId,
      expiresAt: decoded.expiresAt,
    };
  } catch {
    return null;
  }
}

export function createR2SignedGetUrl({
  env = process.env,
  expiresSeconds = 60,
  key,
  now = new Date(),
}: {
  env?: Env;
  expiresSeconds?: number;
  key: string;
  now?: Date;
}) {
  const accountId = required(env.R2_ACCOUNT_ID, "R2_ACCOUNT_ID");
  const accessKeyId = required(env.R2_ACCESS_KEY_ID, "R2_ACCESS_KEY_ID");
  const secretAccessKey = required(
    env.R2_SECRET_ACCESS_KEY,
    "R2_SECRET_ACCESS_KEY",
  );
  const bucket = required(env.R2_BUCKET, "R2_BUCKET");
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const credential = `${accessKeyId}/${scope}`;
  const objectPath = `/${bucket}/${encodeObjectKey(key)}`;
  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = canonicalQueryString(query);
  const canonicalRequest = [
    "GET",
    objectPath,
    canonicalQuery,
    `host:${host}`,
    "",
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = getSignatureKey(secretAccessKey, dateStamp);
  const signature = hmacHex(signingKey, stringToSign);
  return `https://${host}${objectPath}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export function photoObjectKey(photoId: string) {
  return `photos/${photoId}`;
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function encodeObjectKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function canonicalQueryString(query: Record<string, string>) {
  return Object.entries(query)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function getSignatureKey(secret: string, dateStamp: string) {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, "auto");
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}
