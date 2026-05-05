const baseUrl = (
  process.argv[2] ??
  process.env.SAKINAH_SMOKE_URL ??
  "https://sakinah.family"
).replace(/\/$/, "");

const checks = [
  { path: "/", status: 200, marker: "Sakinah" },
  { path: "/trust", status: 200, marker: "Sabr safety signals" },
  { path: "/for-families", status: 200, marker: "Observer contract" },
  { path: "/privacy", status: 200, marker: "Provider processing table" },
  { path: "/account/delete", status: 200, marker: "Deletion receipt" },
  { path: "/api/health", status: 200, marker: '"ok":true' },
  { path: "/api/photos/example", status: 403, marker: "photo is gated" },
] as const;

async function main() {
  const results = [];
  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`);
    const text = await response.text();
    const ok = response.status === check.status && text.includes(check.marker);
    results.push({
      path: check.path,
      status: response.status,
      expected: check.status,
      marker: check.marker,
      ok,
    });
  }

  for (const result of results) {
    console.log(
      `${result.ok ? "ok" : "fail"} ${result.path} ${result.status}/${result.expected}`,
    );
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.error(`${failed.length} smoke check(s) failed for ${baseUrl}`);
    process.exit(1);
  }
  console.log(`production smoke passed for ${baseUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
