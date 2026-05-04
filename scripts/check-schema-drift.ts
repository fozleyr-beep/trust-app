// CI guard: run `drizzle-kit generate` against the current schema and
// fail if it would produce a new migration file. Catches the footgun
// where someone edits lib/db/schema.ts and forgets to commit the matching
// migration.
//
// Run: npm run db:check

import { execSync } from "node:child_process";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const DRIZZLE_DIR = join(process.cwd(), "drizzle");

function listSqlFiles(): Set<string> {
  if (!existsSync(DRIZZLE_DIR)) return new Set();
  return new Set(
    readdirSync(DRIZZLE_DIR).filter((f) => f.endsWith(".sql")),
  );
}

const before = listSqlFiles();

try {
  execSync("npx drizzle-kit generate --name __drift_check__", {
    stdio: "pipe",
  });
} catch (err) {
  console.error("drizzle-kit generate failed:");
  if (err instanceof Error) console.error(err.message);
  process.exit(2);
}

const after = listSqlFiles();
const newFiles = [...after].filter((f) => !before.has(f));

// Always clean up files we created so we never leave drift artifacts behind.
for (const f of newFiles) {
  unlinkSync(join(DRIZZLE_DIR, f));
}

// drizzle-kit also rewrites drizzle/meta/_journal.json + the latest
// snapshot when it runs. Roll those back too so a passing run leaves the
// working tree clean.
try {
  execSync("git checkout -- drizzle/meta", { stdio: "pipe" });
} catch {
  // No git, or no changes — fine.
}

if (newFiles.length === 0) {
  console.log("schema in sync with migrations ✓");
  process.exit(0);
}

console.error("schema drift detected.");
console.error("");
console.error(
  "  Editing lib/db/schema.ts requires committing the matching migration.",
);
console.error("  Run:");
console.error("");
console.error("    npm run db:generate");
console.error("");
console.error(
  "  Review the new file in drizzle/, then commit it alongside your schema change.",
);
process.exit(1);
