import nacl from "tweetnacl";

// crypto_box primitive (X25519 + XSalsa20-Poly1305) via tweetnacl.
// Originally pinned to libsodium per the locked stack; switched to
// tweetnacl in PR-04 because libsodium-wrappers ships a broken ESM bundle.
// Same primitive, same wire format. ASSUMPTION: this swap is acceptable. If
// DECISIONS.md insists on libsodium specifically (audit lineage, FIPS, etc.)
// reconcile by switching to libsodium.js (the JS-only fork) which does not
// have the bundler issue.

export type Keypair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export function generateKeypair(): Keypair {
  const kp = nacl.box.keyPair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}
