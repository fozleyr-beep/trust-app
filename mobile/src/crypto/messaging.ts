import * as Crypto from "expo-crypto";
import nacl from "tweetnacl";
import {
  base64ToBytes,
  bytesToBase64,
  bytesToUtf8,
  utf8ToBytes,
} from "./base64";

export async function encryptMobileMessage({
  plaintext,
  recipientPublicKey,
  senderSecretKey,
}: {
  plaintext: string;
  recipientPublicKey: string;
  senderSecretKey: Uint8Array;
}): Promise<{ ciphertext: string; nonce: string }> {
  const nonce = await Crypto.getRandomBytesAsync(nacl.box.nonceLength);
  const ciphertext = nacl.box(
    utf8ToBytes(plaintext),
    nonce,
    base64ToBytes(recipientPublicKey),
    senderSecretKey,
  );
  return {
    ciphertext: bytesToBase64(ciphertext),
    nonce: bytesToBase64(nonce),
  };
}

export function decryptMobileMessage({
  ciphertext,
  nonce,
  senderPublicKey,
  recipientSecretKey,
}: {
  ciphertext: string;
  nonce: string;
  senderPublicKey: string;
  recipientSecretKey: Uint8Array;
}): string | null {
  const opened = nacl.box.open(
    base64ToBytes(ciphertext),
    base64ToBytes(nonce),
    base64ToBytes(senderPublicKey),
    recipientSecretKey,
  );
  return opened ? bytesToUtf8(opened) : null;
}
