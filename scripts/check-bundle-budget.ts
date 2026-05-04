// CI guard: parse the production build's per-route "First Load JS" sizes
// and fail if any route grows past its budget. Catches "someone added a
// heavy dep" before it ships.
//
// Reads the routes table that `next build` writes to stdout, e.g.
//
//   ┌ ○ /                                      136 B         102 kB
//   ├ ƒ /api/health                            148 B         102 kB
//   ├ ƒ /app/settings                        3.74 kB         160 kB
//   └ ○ /trust                                 153 B         102 kB
//
// Budgets are tuned to ~+20% above the current high-water mark. Bump them
// deliberately when the cause is justified; never silently.
//
// Run: npm run check:bundle

import { execSync } from "node:child_process";

const ROUTE_BUDGET_KB = 200; // First Load JS per route
const SHARED_BUDGET_KB = 130; // shared chunks total

type Row = { route: string; firstLoadKb: number };

function parseSize(token: string): number | null {
  // tokens are "131 B", "1.34 kB", "54.2 kB", "102 kB"
  const m = token.match(/^([\d.]+)\s*(B|kB)$/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (m[2] === "B") return v / 1024;
  return v;
}

function parseBuildOutput(out: string): {
  rows: Row[];
  sharedKb: number | null;
} {
  const lines = out.split("\n");
  const rows: Row[] = [];
  let sharedKb: number | null = null;

  // Each route line ends with "<size> <unit> <size> kB". The First Load JS
  // is the last "<size> kB" on the line. Tree drawing chars at the start
  // are noisy but the route name is a contiguous slug starting with "/".
  const routeLineRe =
    /^[\s│├└┌─┬]*[ƒλ○●Σ]\s+(\S+)\s+.*?([\d.]+\s*(?:kB|B))\s*$/;

  for (const raw of lines) {
    const m = raw.match(routeLineRe);
    if (m) {
      const route = m[1];
      const kb = parseSize(m[2].replace(/\s+/g, " ").trim());
      if (kb !== null) rows.push({ route, firstLoadKb: kb });
      continue;
    }
    const sm = raw.match(/First Load JS shared by all\s+([\d.]+\s*kB)/);
    if (sm) {
      const kb = parseSize(sm[1].replace(/\s+/g, " ").trim());
      if (kb !== null) sharedKb = kb;
    }
  }

  return { rows, sharedKb };
}

function main() {
  console.log("running next build (this may take a moment)…\n");
  let out: string;
  try {
    out = execSync("npx next build", { encoding: "utf8" }).toString();
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer };
    const stdout = e.stdout?.toString() ?? "";
    const stderr = e.stderr?.toString() ?? "";
    process.stderr.write(stdout);
    process.stderr.write(stderr);
    console.error("\nbuild failed; cannot evaluate bundle budget");
    process.exit(2);
  }

  process.stdout.write(out);

  const { rows, sharedKb } = parseBuildOutput(out);
  if (rows.length === 0) {
    console.error(
      "\ncould not parse any route lines from build output. " +
        "If Next.js's output format changed, update scripts/check-bundle-budget.ts.",
    );
    process.exit(2);
  }

  console.log("\nbundle-budget report");
  console.log("");
  let failed = 0;
  for (const r of rows) {
    const ok = r.firstLoadKb <= ROUTE_BUDGET_KB;
    const marker = ok ? "  ok " : " over";
    console.log(
      `  ${marker}  ${r.route.padEnd(40)} ${r.firstLoadKb.toFixed(1)} kB / ${ROUTE_BUDGET_KB} kB`,
    );
    if (!ok) failed++;
  }
  if (sharedKb !== null) {
    const ok = sharedKb <= SHARED_BUDGET_KB;
    const marker = ok ? "  ok " : " over";
    console.log(
      `  ${marker}  ${"<shared>".padEnd(40)} ${sharedKb.toFixed(1)} kB / ${SHARED_BUDGET_KB} kB`,
    );
    if (!ok) failed++;
  }

  console.log("");
  if (failed > 0) {
    console.error(
      `${failed} route(s) over budget. Either trim the offenders or bump the ` +
        `budget in scripts/check-bundle-budget.ts (deliberately).`,
    );
    process.exit(1);
  }
  console.log("all routes within budget ✓");
}

main();
