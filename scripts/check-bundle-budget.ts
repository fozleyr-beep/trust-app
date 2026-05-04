// CI guard: parse the production build's per-route "First Load JS" sizes
// and fail if any route grows past its budget. Catches "someone added a
// heavy dep" before it ships.
//
// The parser is in scripts/lib/parse-build-output.ts so it has unit tests
// that lock it against Next.js stdout-format regressions.
//
// Run: npm run check:bundle

import { execSync } from "node:child_process";
import { parseBuildOutput } from "./lib/parse-build-output";

const ROUTE_BUDGET_KB = 200; // First Load JS per route
const SHARED_BUDGET_KB = 130; // shared chunks total

function main() {
  console.log("running next build (this may take a moment)…\n");
  let out: string;
  try {
    out = execSync("npx next build", { encoding: "utf8" }).toString();
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer };
    process.stderr.write(e.stdout?.toString() ?? "");
    process.stderr.write(e.stderr?.toString() ?? "");
    console.error("\nbuild failed; cannot evaluate bundle budget");
    process.exit(2);
  }

  process.stdout.write(out);

  const { rows, sharedKb } = parseBuildOutput(out);
  if (rows.length === 0) {
    console.error(
      "\ncould not parse any route lines from build output. " +
        "Next.js's output format may have changed — update " +
        "scripts/lib/parse-build-output.ts and its tests together.",
    );
    process.exit(2);
  }

  console.log("\nbundle-budget report\n");
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
