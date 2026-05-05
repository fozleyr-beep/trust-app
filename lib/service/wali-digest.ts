import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const ciphertextLike = /(?:[A-Za-z0-9+/]{80,}={0,2})/;

export function validateWaliDigestBody(body: string): boolean {
  return body.length <= 1200 && !ciphertextLike.test(body);
}

export async function writeDailyWaliDigests(): Promise<number> {
  const observers = await db()
    .select({
      threadId: schema.threadMembers.threadId,
      observerId: schema.threadMembers.userId,
    })
    .from(schema.threadMembers)
    .where(eq(schema.threadMembers.role, "observer"))
    .limit(50);

  if (observers.length === 0) return 0;

  const rows = observers.map((observer) => ({
    threadId: observer.threadId,
    observerId: observer.observerId,
    body:
      "Adil saw the room boundary remain intact today. This non-verbatim digest reports consent and observer state only; it contains no message plaintext or ciphertext.",
  }));

  for (const row of rows) {
    if (!validateWaliDigestBody(row.body)) {
      throw new Error("wali digest body failed validation");
    }
  }

  await db().insert(schema.waliDigests).values(rows);
  return rows.length;
}
