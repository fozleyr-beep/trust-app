import { describe, expect, test } from "vitest";
import nacl from "tweetnacl";
import {
  b64decode,
  b64encode,
  decryptFromSender,
  encryptForDevice,
} from "./messaging";

describe("crypto round-trip", () => {
  test("Alice encrypts a message that only Bob can decrypt", () => {
    const alice = nacl.box.keyPair();
    const bob = nacl.box.keyPair();
    const eve = nacl.box.keyPair();

    const plaintext = "the quick brown fox jumps over the lazy dog 🦊";

    const { ciphertext, nonce } = encryptForDevice({
      plaintext,
      recipientPublicKey: bob.publicKey,
      senderSecretKey: alice.secretKey,
    });

    // Bob decrypts with his secret key + Alice's pub
    const got = decryptFromSender({
      ciphertext,
      nonce,
      senderPublicKey: alice.publicKey,
      recipientSecretKey: bob.secretKey,
    });
    expect(got).toBe(plaintext);

    // Eve cannot, even with Alice's pub
    expect(() =>
      decryptFromSender({
        ciphertext,
        nonce,
        senderPublicKey: alice.publicKey,
        recipientSecretKey: eve.secretKey,
      }),
    ).toThrow();
  });

  test("ciphertext is rejected if sender pub is wrong", () => {
    const alice = nacl.box.keyPair();
    const bob = nacl.box.keyPair();
    const mallory = nacl.box.keyPair();

    const { ciphertext, nonce } = encryptForDevice({
      plaintext: "hi bob",
      recipientPublicKey: bob.publicKey,
      senderSecretKey: alice.secretKey,
    });

    // Bob has the right secret key but is told the wrong sender — Poly1305
    // tag mismatch must throw, not silently return garbage.
    expect(() =>
      decryptFromSender({
        ciphertext,
        nonce,
        senderPublicKey: mallory.publicKey,
        recipientSecretKey: bob.secretKey,
      }),
    ).toThrow();
  });

  test("flipping a single byte of ciphertext is detected", () => {
    const alice = nacl.box.keyPair();
    const bob = nacl.box.keyPair();
    const { ciphertext, nonce } = encryptForDevice({
      plaintext: "do not modify me",
      recipientPublicKey: bob.publicKey,
      senderSecretKey: alice.secretKey,
    });
    const tampered = new Uint8Array(ciphertext);
    tampered[5] ^= 0x01;
    expect(() =>
      decryptFromSender({
        ciphertext: tampered,
        nonce,
        senderPublicKey: alice.publicKey,
        recipientSecretKey: bob.secretKey,
      }),
    ).toThrow();
  });

  test("base64 helpers round-trip arbitrary bytes", () => {
    const original = nacl.randomBytes(64);
    const back = b64decode(b64encode(original));
    expect(back).toEqual(original);
  });

  test("two encryptions of the same plaintext produce different ciphertexts", () => {
    // Random nonces → indistinguishable ciphertexts. Critical: server cannot
    // even tell whether two messages contained the same content.
    const alice = nacl.box.keyPair();
    const bob = nacl.box.keyPair();
    const a = encryptForDevice({
      plaintext: "same",
      recipientPublicKey: bob.publicKey,
      senderSecretKey: alice.secretKey,
    });
    const b = encryptForDevice({
      plaintext: "same",
      recipientPublicKey: bob.publicKey,
      senderSecretKey: alice.secretKey,
    });
    expect(b64encode(a.ciphertext)).not.toBe(b64encode(b.ciphertext));
    expect(b64encode(a.nonce)).not.toBe(b64encode(b.nonce));
  });
});
