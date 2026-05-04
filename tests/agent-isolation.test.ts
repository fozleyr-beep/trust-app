import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// /trust says: the assistant cannot read messages exchanged between people.
// This test makes that a *enforced* property of the codebase: every file
// under app/api/agent/ is forbidden from importing the messaging schema or
// referencing the messages table by any name. If anyone ever wires those in,
// CI fails before the change can ship.

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      out.push(...walkFiles(p));
    } else if (p.endsWith(".ts") || p.endsWith(".tsx")) {
      out.push(p);
    }
  }
  return out;
}

const AGENT_DIR = join(process.cwd(), "app", "api", "agent");

const FORBIDDEN_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\bschema\.messages\b/,
    reason:
      "agent route references schema.messages — would let the assistant read encrypted messages between people",
  },
  {
    pattern: /\bschema\.threadMembers\b/,
    reason:
      "agent route references schema.threadMembers — broadens the agent's data scope past what /trust promises",
  },
  {
    pattern: /\bschema\.threads\b/,
    reason:
      "agent route references schema.threads — broadens the agent's data scope past what /trust promises",
  },
  {
    pattern: /\bschema\.deviceKeys\b/,
    reason:
      "agent route references schema.deviceKeys — agent has no business with crypto material",
  },
  {
    pattern: /from ["']@\/lib\/db\/threads["']/,
    reason:
      "agent route imports from lib/db/threads — that helper exists for the messaging surface, not the agent",
  },
];

describe("agent isolation (trust contract)", () => {
  test("the agent route is present", () => {
    const files = walkFiles(AGENT_DIR);
    expect(files.length).toBeGreaterThan(0);
  });

  test.each(FORBIDDEN_PATTERNS)(
    "no agent file matches forbidden pattern: $reason",
    ({ pattern, reason }) => {
      const files = walkFiles(AGENT_DIR);
      const matches: string[] = [];
      for (const f of files) {
        const src = readFileSync(f, "utf8");
        if (pattern.test(src)) matches.push(f);
      }
      expect(matches, reason).toEqual([]);
    },
  );
});
