"use client";

import nacl from "tweetnacl";

// Browser-only IndexedDB-backed device keypair persistence.
//
// PR-10 update — multi-generation support:
//   The store now retains every keypair this browser has ever generated for
//   this device, so messages encrypted to old keys can still be decrypted
//   after a rotation. The "primary" deviceId is what new outgoing messages
//   are signed with (and what other devices encrypt to us via the published
//   pubkey). Old generations stay for read-only decrypt.
//
// Threat model claim:
//   Secret keys never leave this browser. We never back them up. If the user
//   clears storage, every generation goes with it; messages encrypted to any
//   of them become unreadable on this device. Stated on /trust.

const DB_NAME = "trust-app";
const STORE = "device";
const STORE_KEY = "primary";

type DeviceRecord = {
  deviceId: string;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  createdAt: number;
};

type StoreV2 = {
  version: 2;
  primaryDeviceId: string;
  devices: DeviceRecord[];
};

function isStoreV2(v: unknown): v is StoreV2 {
  if (typeof v !== "object" || v === null) return false;
  const x = v as { version?: unknown; devices?: unknown };
  return x.version === 2 && Array.isArray(x.devices);
}

function isV1Record(v: unknown): v is DeviceRecord {
  if (typeof v !== "object" || v === null) return false;
  const x = v as { deviceId?: unknown; secretKey?: unknown };
  return typeof x.deviceId === "string" && x.secretKey instanceof Uint8Array;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    fn(store).then(resolve, reject);
    t.onerror = () => reject(t.error);
  });
}

function getRaw(): Promise<unknown> {
  return tx("readonly", (store) =>
    new Promise<unknown>((resolve, reject) => {
      const r = store.get(STORE_KEY);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    }),
  );
}

function putRaw(s: StoreV2): Promise<void> {
  return tx("readwrite", (store) =>
    new Promise<void>((resolve, reject) => {
      const r = store.put(s, STORE_KEY);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    }),
  );
}

async function getStore(): Promise<StoreV2 | undefined> {
  const raw = await getRaw();
  if (raw == null) return undefined;
  if (isStoreV2(raw)) return raw;
  // V1 → V2 migration: lift the single record into the new shape.
  if (isV1Record(raw)) {
    const v2: StoreV2 = {
      version: 2,
      primaryDeviceId: raw.deviceId,
      devices: [raw],
    };
    await putRaw(v2);
    return v2;
  }
  return undefined;
}

function newDeviceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function latestForPrimary(s: StoreV2): DeviceRecord | undefined {
  const matches = s.devices.filter(
    (d) => d.deviceId === s.primaryDeviceId,
  );
  if (matches.length === 0) return undefined;
  return matches.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
}

export type LocalDevice = {
  deviceId: string;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export async function getOrCreateDevice(): Promise<LocalDevice> {
  const s = await getStore();
  if (s) {
    const primary = latestForPrimary(s);
    if (primary) return primary;
  }
  const kp = nacl.box.keyPair();
  const rec: DeviceRecord = {
    deviceId: newDeviceId(),
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    createdAt: Date.now(),
  };
  const next: StoreV2 = {
    version: 2,
    primaryDeviceId: rec.deviceId,
    devices: [rec],
  };
  await putRaw(next);
  return rec;
}

// Generates a fresh keypair under the same deviceId, appends it to the
// store, and marks it as the latest. The caller is responsible for POSTing
// the new pubkey to /api/device-keys (which revokes prior server-side rows
// for the same deviceId). Old keypairs stay in storage for past-message
// decryption.
export async function rotateDevice(): Promise<LocalDevice> {
  const existing = await getStore();
  const baseDeviceId = existing?.primaryDeviceId ?? newDeviceId();
  const kp = nacl.box.keyPair();
  const rec: DeviceRecord = {
    deviceId: baseDeviceId,
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    createdAt: Date.now(),
  };
  const next: StoreV2 = existing
    ? { ...existing, devices: [...existing.devices, rec] }
    : { version: 2, primaryDeviceId: baseDeviceId, devices: [rec] };
  await putRaw(next);
  return rec;
}

export async function getAllSecretKeys(): Promise<Uint8Array[]> {
  const s = await getStore();
  if (!s) return [];
  return s.devices.map((d) => d.secretKey);
}

export async function listGenerations(): Promise<
  Array<{ createdAt: number; isPrimary: boolean; publicKey: Uint8Array }>
> {
  const s = await getStore();
  if (!s) return [];
  const primary = latestForPrimary(s);
  return s.devices
    .map((d) => ({
      createdAt: d.createdAt,
      isPrimary: primary ? d.createdAt === primary.createdAt : false,
      publicKey: d.publicKey,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function clearAllDevices(): Promise<void> {
  await tx("readwrite", (store) =>
    new Promise<void>((resolve, reject) => {
      const r = store.delete(STORE_KEY);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    }),
  );
}

export function fingerprint(publicKey: Uint8Array): string {
  const hex = Array.from(publicKey.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.match(/.{4}/g)!.join(" ");
}
