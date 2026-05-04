"use client";

import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

// crypto_box (X25519 + XSalsa20-Poly1305) via tweetnacl.
// Each outgoing message is encrypted ONCE PER recipient-device. Server
// stores N rows per send.

export function encryptForDevice(args: {
  plaintext: string;
  recipientPublicKey: Uint8Array;
  senderSecretKey: Uint8Array;
}): { ciphertext: Uint8Array; nonce: Uint8Array } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const msg = naclUtil.decodeUTF8(args.plaintext);
  const ciphertext = nacl.box(
    msg,
    nonce,
    args.recipientPublicKey,
    args.senderSecretKey,
  );
  return { ciphertext, nonce };
}

export function decryptFromSender(args: {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  senderPublicKey: Uint8Array;
  recipientSecretKey: Uint8Array;
}): string {
  const opened = nacl.box.open(
    args.ciphertext,
    args.nonce,
    args.senderPublicKey,
    args.recipientSecretKey,
  );
  if (!opened) throw new Error("decrypt failed");
  return naclUtil.encodeUTF8(opened);
}

export function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
