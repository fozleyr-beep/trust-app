// Parser for Next.js's `next build` stdout, used by the bundle-budget
// guard to extract per-route First Load JS sizes. Lives in scripts/lib so
// scripts/check-bundle-budget.ts and the unit tests both consume it
// without circular concerns.

export type Row = { route: string; firstLoadKb: number };

export type ParseResult = {
  rows: Row[];
  sharedKb: number | null;
};

export function parseSize(token: string): number | null {
  // Tokens: "131 B", "1.34 kB", "54.2 kB", "102 kB"
  const m = token.match(/^([\d.]+)\s*(B|kB)$/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (m[2] === "B") return v / 1024;
  return v;
}

export function parseBuildOutput(out: string): ParseResult {
  const lines = out.split("\n");
  const rows: Row[] = [];
  let sharedKb: number | null = null;

  // Each route line ends with "<size> <unit> <size> kB". The First Load JS
  // is the last "<size> kB" on the line. Tree-drawing chars at the start
  // are noisy but the route slug is contiguous starting with "/".
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
