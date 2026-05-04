// Pure parser for the new-thread form's "recipientEmails" textarea input.
// Extracted from app/actions/threads.ts so the normalization rules
// (separators, casing, dedup, cap) have unit tests — see
// lib/messaging/recipients.test.ts.

export type ParseRecipientsResult =
  | { ok: true; emails: string[] }
  | { ok: false; status: 400; error: string };

export function parseRecipientEmails(args: {
  raw: string;
  maxRecipients: number;
}): ParseRecipientsResult {
  const emails = Array.from(
    new Set(
      args.raw
        .split(/[,\s\n]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0 && s.includes("@")),
    ),
  );

  if (emails.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "at least one valid recipient email is required",
    };
  }
  if (emails.length > args.maxRecipients) {
    return {
      ok: false,
      status: 400,
      error: `at most ${args.maxRecipients} recipients per thread; got ${emails.length}`,
    };
  }

  return { ok: true, emails };
}
