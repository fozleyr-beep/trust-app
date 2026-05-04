# Security policy

If you've found a security issue in `trust-app`, thank you for taking the
time to look. The promises this app makes on `/trust` are only as good as
the code behind them — your report is how we keep them honest.

## Reporting

Email **fozleyr@gmail.com**.

Please include:

- A short description of the issue
- Steps to reproduce, or a proof-of-concept
- Your assessment of impact (what an attacker could see or change)
- Whether this affects the live deployment, the codebase, or both

We aim to acknowledge within **72 hours** and to land a fix or a written
mitigation plan within **14 days** for issues that affect users.

## Scope

In scope:

- Anything that could let the server (or anyone with database access) read
  message bodies between people
- Anything that could let the assistant surface (`/api/agent`,
  `/app/agent`) reach data outside its declared scope (encrypted messages,
  device keys, thread membership, sender keys)
- Authentication and session handling (Clerk integration, webhook
  handler, our `requireDbUser` helper)
- The crypto code in `lib/crypto/` — implementation, not the underlying
  `tweetnacl` primitive
- API authorization gaps (especially the membership check in
  `/api/threads/[id]/messages`)
- Content Security Policy bypasses
- Anything that breaks the export, rotation, or self-delete flows in a
  way that loses user data or extends server-held state

Out of scope:

- Vulnerabilities in `tweetnacl`, `next`, `clerk`, `drizzle`, or other
  third-party dependencies — please report those upstream. We will track
  upstream advisories and pin / upgrade.
- Issues that require physical access to a signed-in device.
- Brute-force attacks on user passwords (Clerk handles the password layer).
- Rate-limit weaknesses on `/api/agent` that don't escalate beyond
  consuming the affected user's own quota.
- Self-XSS that requires the user to paste attacker-supplied script into a
  console.

## Safe-harbor

We will not pursue legal action against good-faith research that:

- Stays within the scope above
- Avoids accessing data that doesn't belong to you (use a test account; if
  you accidentally see another user's data, stop, document, and tell us)
- Avoids degrading service for other users (no DoS, no aggressive
  scanning of production)
- Gives us a reasonable window (see Reporting timelines above) before
  public disclosure

If you're unsure whether something falls inside this policy, write to
fozleyr@gmail.com first and ask.

## Hall of fame

We will list reporters who agree to be named here, in order of report
date, after a fix has shipped.

*(empty — be the first.)*
