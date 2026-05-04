import nacl from "tweetnacl";

// crypto_box primitive (X25519 + XSalsa20-Poly1305) via tweetnacl. Same
// primitive and wire format as libsodium; chosen over libsodium-wrappers
// because the latter ships a broken ESM bundle that Next.js's webpack
// cannot load. If audit lineage on libsodium is ever required, switch to
// libsodium.js (the JS-only fork) — same primitive, no bundler issue.

export type Keypair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export function generateKeypair(): Keypair {
  const kp = nacl.box.keyPair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}
