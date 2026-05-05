import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import nacl from "tweetnacl";
import { base64ToBytes, bytesToBase64 } from "./base64";

const DEVICE_KEY_STORAGE_KEY = "sakinah.device-key.v1";

export type MobileDeviceKey = {
  deviceId: string;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

type StoredDeviceKey = {
  deviceId: string;
  publicKey: string;
  secretKey: string;
};

export async function getOrCreateMobileDeviceKey(): Promise<MobileDeviceKey> {
  const stored = await SecureStore.getItemAsync(DEVICE_KEY_STORAGE_KEY);
  if (stored) return fromStored(JSON.parse(stored) as StoredDeviceKey);
  return rotateMobileDeviceKey();
}

export async function rotateMobileDeviceKey(): Promise<MobileDeviceKey> {
  const seed = await Crypto.getRandomBytesAsync(32);
  const keyPair = nacl.box.keyPair.fromSecretKey(seed);
  const deviceKey: MobileDeviceKey = {
    deviceId: await newDeviceId(),
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
  };
  await SecureStore.setItemAsync(
    DEVICE_KEY_STORAGE_KEY,
    JSON.stringify(toStored(deviceKey)),
  );
  return deviceKey;
}

export async function clearMobileDeviceKey(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_KEY_STORAGE_KEY);
}

export function fingerprint(publicKey: Uint8Array): string {
  return Array.from(publicKey.slice(0, 8))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(":");
}

export async function registerMobileDeviceKey({
  apiBaseUrl,
  getToken,
}: {
  apiBaseUrl: string;
  getToken: () => Promise<string | null>;
}): Promise<{ deviceId: string; fingerprint: string; serverKeyId: string }> {
  const token = await getToken();
  if (!token) throw new Error("Missing Clerk token");
  const deviceKey = await getOrCreateMobileDeviceKey();
  const response = await fetch(`${apiBaseUrl}/api/device-keys`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      deviceId: deviceKey.deviceId,
      publicKey: bytesToBase64(deviceKey.publicKey),
    }),
  });
  if (!response.ok) throw new Error(`device register ${response.status}`);
  const body = (await response.json()) as { id: string };
  return {
    deviceId: deviceKey.deviceId,
    fingerprint: fingerprint(deviceKey.publicKey),
    serverKeyId: body.id,
  };
}

function fromStored(stored: StoredDeviceKey): MobileDeviceKey {
  return {
    deviceId: stored.deviceId,
    publicKey: base64ToBytes(stored.publicKey),
    secretKey: base64ToBytes(stored.secretKey),
  };
}

function toStored(deviceKey: MobileDeviceKey): StoredDeviceKey {
  return {
    deviceId: deviceKey.deviceId,
    publicKey: bytesToBase64(deviceKey.publicKey),
    secretKey: bytesToBase64(deviceKey.secretKey),
  };
}

async function newDeviceId(): Promise<string> {
  const random = await Crypto.getRandomBytesAsync(16);
  return Array.from(random)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
