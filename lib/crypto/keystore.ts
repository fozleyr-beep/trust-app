"use client";

import nacl from "tweetnacl";

// Browser-only IndexedDB-backed device keypair persistence.
//
// Threat model claim:
//   the secret key never leaves this browser. We do not back it up to the
//   server. If the user clears storage, that device's identity is gone —
//   they will need to re-register a device. Past messages encrypted *to* the
//   lost device become unrecoverable. This is an explicit tradeoff and is
//   stated on /trust.
//
// ASSUMPTION: IndexedDB storage is acceptable. If DECISIONS.md commits to
// hardware-backed keys (WebAuthn/Passkeys for crypto operations) or to a
// passphrase-wrapped backup model, replace this module.

const DB_NAME = "trust-app";
const STORE = "device";
const KEY = "primary";

type DeviceRecord = {
  deviceId: string;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  createdAt: number;
};

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

function getRaw(): Promise<DeviceRecord | undefined> {
  return tx("readonly", (store) =>
    new Promise<DeviceRecord | undefined>((resolve, reject) => {
      const r = store.get(KEY);
      r.onsuccess = () => resolve(r.result as DeviceRecord | undefined);
      r.onerror = () => reject(r.error);
    }),
  );
}

function putRaw(rec: DeviceRecord): Promise<void> {
  return tx("readwrite", (store) =>
    new Promise<void>((resolve, reject) => {
      const r = store.put(rec, KEY);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    }),
  );
}

function newDeviceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export type LocalDevice = {
  deviceId: string;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export async function getOrCreateDevice(): Promise<LocalDevice> {
  const existing = await getRaw();
  if (existing) return existing;
  const kp = nacl.box.keyPair();
  const rec: DeviceRecord = {
    deviceId: newDeviceId(),
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    createdAt: Date.now(),
  };
  await putRaw(rec);
  return rec;
}

export function fingerprint(publicKey: Uint8Array): string {
  const hex = Array.from(publicKey.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.match(/.{4}/g)!.join(" ");
}
