import { getOrCreateMobileDeviceKey } from "../crypto/deviceKeys";
import { encryptMobileMessage } from "../crypto/messaging";

export type MobileThread = {
  createdAt: string;
  id: string;
};

export type RecipientKey = {
  deviceId: string;
  id: string;
  publicKey: string;
  userId: string;
};

export type MobileMessageEnvelope = {
  ciphertext: string;
  id: string;
  nonce: string;
  senderId: string;
  sentAt: string;
};

type GetToken = () => Promise<string | null>;

export async function listMobileThreads({
  apiBaseUrl,
  getToken,
}: {
  apiBaseUrl: string;
  getToken: GetToken;
}): Promise<MobileThread[]> {
  const body = await authedJson<{ threads: MobileThread[] }>({
    apiBaseUrl,
    getToken,
    path: "/api/me/threads",
  });
  return body.threads;
}

export async function listMobileMessages({
  apiBaseUrl,
  getToken,
  threadId,
}: {
  apiBaseUrl: string;
  getToken: GetToken;
  threadId: string;
}): Promise<MobileMessageEnvelope[]> {
  const body = await authedJson<{ messages: MobileMessageEnvelope[] }>({
    apiBaseUrl,
    getToken,
    path: `/api/threads/${threadId}/messages`,
  });
  return body.messages;
}

export async function sendEncryptedMobileMessage({
  apiBaseUrl,
  getToken,
  plaintext,
  threadId,
}: {
  apiBaseUrl: string;
  getToken: GetToken;
  plaintext: string;
  threadId: string;
}): Promise<{ written: number }> {
  const keys = await authedJson<{ keys: RecipientKey[] }>({
    apiBaseUrl,
    getToken,
    path: `/api/threads/${threadId}/recipient-keys`,
  });
  const deviceKey = await getOrCreateMobileDeviceKey();
  const fanout = await Promise.all(
    keys.keys.map(async (key) => {
      const encrypted = await encryptMobileMessage({
        plaintext,
        recipientPublicKey: key.publicKey,
        senderSecretKey: deviceKey.secretKey,
      });
      return {
        recipientDeviceKeyId: key.id,
        ciphertext: encrypted.ciphertext,
        nonce: encrypted.nonce,
      };
    }),
  );
  return authedJson<{ written: number }>({
    apiBaseUrl,
    body: { fanout },
    getToken,
    method: "POST",
    path: `/api/threads/${threadId}/messages`,
  });
}

async function authedJson<T>({
  apiBaseUrl,
  body,
  getToken,
  method = "GET",
  path,
}: {
  apiBaseUrl: string;
  body?: unknown;
  getToken: GetToken;
  method?: "GET" | "POST";
  path: string;
}): Promise<T> {
  const token = await getToken();
  if (!token) throw new Error("Missing Clerk token");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return (await response.json()) as T;
}
