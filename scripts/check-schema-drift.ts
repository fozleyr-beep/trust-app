// CI guard: run `drizzle-kit generate` against the current schema and
// fail if it would produce a new migration file. Catches the footgun
// where someone edits lib/db/schema.ts and forgets to commit the matching
// migration.
//
// Run: npm run db:check

import { execSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const DRIZZLE_DIR = join(process.cwd(), "drizzle");

function listSqlFiles(): Set<string> {
  if (!existsSync(DRIZZLE_DIR)) return new Set();
  return new Set(
    readdirSync(DRIZZLE_DIR).filter((f) => f.endsWith(".sql")),
  );
}

function snapshotMeta(): Map<string, string> {
  const metaDir = join(DRIZZLE_DIR, "meta");
  const files = new Map<string, string>();
  if (!existsSync(metaDir)) return files;
  for (const file of readdirSync(metaDir)) {
    const full = join(metaDir, file);
    files.set(file, readFileSync(full, "utf8"));
  }
  return files;
}

function restoreMeta(snapshot: Map<string, string>): void {
  const metaDir = join(DRIZZLE_DIR, "meta");
  if (!existsSync(metaDir)) return;
  for (const file of readdirSync(metaDir)) {
    if (!snapshot.has(file)) unlinkSync(join(metaDir, file));
  }
  for (const [file, contents] of snapshot) {
    writeFileSync(join(metaDir, file), contents);
  }
}

const before = listSqlFiles();
const beforeMeta = snapshotMeta();

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

// drizzle-kit also rewrites drizzle/meta. Restore the exact pre-check state
// instead of `git checkout` so legitimate uncommitted migrations survive.
restoreMeta(beforeMeta);

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
