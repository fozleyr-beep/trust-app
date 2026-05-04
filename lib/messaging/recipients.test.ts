import { describe, expect, test } from "vitest";
import { parseRecipientEmails } from "./recipients";

describe("parseRecipientEmails", () => {
  const max = 9;
  const ok = (raw: string) =>
    parseRecipientEmails({ raw, maxRecipients: max });

  test("single email, trimmed and lowercased", () => {
    const r = ok("  Alice@Example.com  ");
    expect(r).toEqual({ ok: true, emails: ["alice@example.com"] });
  });

  test("comma-separated", () => {
    const r = ok("alice@x.com, bob@x.com");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.emails).toEqual(["alice@x.com", "bob@x.com"]);
  });

  test("newline- and whitespace-separated, mixed", () => {
    const r = ok("alice@x.com\nbob@x.com   carol@x.com");
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(r.emails).toEqual(["alice@x.com", "bob@x.com", "carol@x.com"]);
  });

  test("dedups case-insensitively", () => {
    const r = ok("alice@x.com, ALICE@x.com, alice@X.COM");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.emails).toEqual(["alice@x.com"]);
  });

  test("drops tokens that don't contain @", () => {
    const r = ok("alice@x.com, junk, bob@x.com");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.emails).toEqual(["alice@x.com", "bob@x.com"]);
  });

  test("400 on empty input", () => {
    const r = ok("   ,,,  \n  ");
    expect(r).toEqual({
      ok: false,
      status: 400,
      error: "at least one valid recipient email is required",
    });
  });

  test("400 when over the recipient cap", () => {
    const many = Array.from({ length: 10 }, (_, i) => `u${i}@x.com`).join(",");
    const r = parseRecipientEmails({ raw: many, maxRecipients: max });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(400);
      expect(r.error).toMatch(/at most 9 recipients/);
    }
  });

  test("at exactly the cap is fine", () => {
    const max9 = Array.from({ length: 9 }, (_, i) => `u${i}@x.com`).join(",");
    const r = parseRecipientEmails({ raw: max9, maxRecipients: max });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.emails).toHaveLength(9);
  });
});
