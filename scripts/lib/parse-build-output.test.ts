import { describe, expect, test } from "vitest";
import { parseBuildOutput, parseSize } from "./parse-build-output";

// Fixture: a real next@15.5 build's tail. If Next.js changes the output
// format we want this test to fail loudly so we update the parser
// deliberately, not silently regress past the bundle gate.
const REAL_BUILD_TAIL = `
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/8) ...
 ✓ Generating static pages (8/8)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                      136 B         102 kB
├ ○ /_not-found                            991 B         103 kB
├ ƒ /api/health                            148 B         102 kB
├ ƒ /app                                 1.67 kB         118 kB
├ ƒ /app/agent                           1.34 kB         107 kB
├ ƒ /app/settings                        3.74 kB         160 kB
├ ƒ /app/threads                           161 B         106 kB
├ ƒ /app/threads/[id]                    3.51 kB         120 kB
├ ○ /app/threads/new                       155 B         102 kB
├ ƒ /sign-in/[[...sign-in]]                395 B         142 kB
├ ƒ /sign-up/[[...sign-up]]                395 B         142 kB
└ ○ /trust                                 153 B         102 kB
+ First Load JS shared by all             102 kB
  ├ chunks/255-4f212684648fcab9.js         46 kB
  ├ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  └ other shared chunks (total)             2 kB


ƒ Middleware                             88.5 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
`;

describe("parseSize", () => {
  test("kB tokens parse to numbers", () => {
    expect(parseSize("102 kB")).toBe(102);
    expect(parseSize("54.2 kB")).toBeCloseTo(54.2);
  });
  test("B tokens convert to kB", () => {
    expect(parseSize("131 B")).toBeCloseTo(131 / 1024);
    expect(parseSize("991 B")).toBeCloseTo(991 / 1024);
  });
  test("returns null on garbage", () => {
    expect(parseSize("nope")).toBeNull();
    expect(parseSize("")).toBeNull();
    expect(parseSize("100 MB")).toBeNull();
  });
});

describe("parseBuildOutput", () => {
  test("extracts every route + First Load JS from a real build tail", () => {
    const r = parseBuildOutput(REAL_BUILD_TAIL);
    const byRoute = Object.fromEntries(
      r.rows.map((row) => [row.route, row.firstLoadKb]),
    );

    expect(byRoute["/"]).toBe(102);
    expect(byRoute["/_not-found"]).toBe(103);
    expect(byRoute["/api/health"]).toBe(102);
    expect(byRoute["/app"]).toBe(118);
    expect(byRoute["/app/agent"]).toBe(107);
    expect(byRoute["/app/settings"]).toBe(160);
    expect(byRoute["/app/threads"]).toBe(106);
    expect(byRoute["/app/threads/[id]"]).toBe(120);
    expect(byRoute["/app/threads/new"]).toBe(102);
    expect(byRoute["/sign-in/[[...sign-in]]"]).toBe(142);
    expect(byRoute["/sign-up/[[...sign-up]]"]).toBe(142);
    expect(byRoute["/trust"]).toBe(102);

    // Middleware row uses Σ-ish marker; the parser picks it up too.
    // We don't assert on it here because Next has shifted that prefix
    // historically; the gate treats it leniently.
  });

  test("captures the shared chunk size", () => {
    const r = parseBuildOutput(REAL_BUILD_TAIL);
    expect(r.sharedKb).toBe(102);
  });

  test("returns empty rows on totally unrelated input", () => {
    const r = parseBuildOutput("just\nsome\nrandom text");
    expect(r.rows).toEqual([]);
    expect(r.sharedKb).toBeNull();
  });

  test("ignores non-route lines mixed in", () => {
    const noisy = `
warning: something happened
   Building...
┌ ○ /trust                                 153 B         102 kB
ERROR: irrelevant
`;
    const r = parseBuildOutput(noisy);
    expect(r.rows).toEqual([{ route: "/trust", firstLoadKb: 102 }]);
  });
});
