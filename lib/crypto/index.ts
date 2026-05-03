import sodium from "libsodium-wrappers";

let _ready: Promise<void> | null = null;

export function sodiumReady(): Promise<void> {
  if (!_ready) _ready = sodium.ready;
  return _ready;
}

export async function getSodium(): Promise<typeof sodium> {
  await sodiumReady();
  return sodium;
}

// PR-01 stub. Real key generation, envelope wrapping, X25519 handshake,
// and message-body sealing land in the messaging PR per handoff.yaml.
export async function generateUserKeypair(): Promise<{
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}> {
  const s = await getSodium();
  const kp = s.crypto_box_keypair();
  return { publicKey: kp.publicKey, secretKey: kp.privateKey };
}
