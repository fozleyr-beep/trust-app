# Sakinah API Contracts

Last updated: 2026-05-05

## Public routes

- `GET /api/health` returns `{ ok: true, ts }`.
- `GET /privacy` shows privacy policy.
- `GET /account/delete` shows account deletion instructions.
- `GET /trust` shows the public trust contract.

## Authenticated service routes

- `GET/POST /api/service/profile`
  - Reads or saves consented service profile state.
  - Stores profile facts, not identity evidence.

- `POST /api/service/agents/run`
  - Body: optional `{ agentId: "hafiz" | "watim" | "adil" | "sabr" }`.
  - Writes service-state ledger rows and bounded match/safety state.

- `GET /api/service/matches`
  - Returns suggested or salaam-requested match cards for the current user.

- `POST /api/service/matches/:id/respond`
  - Body: `{ response: "request_salaam" | "dismiss" }`.
  - Creates a salaam request only when the suggestion has a real candidate.

- `GET/POST /api/service/salaam`
  - Lists consent requests or creates service-level consent state.

- `POST /api/service/salaam/:id`
  - Body: `{ response: "accept" | "decline" }`.
  - Opens a room only when both requester and recipient accepted.

- `GET /api/service/audit`
  - Exports profile, agent ledger, matches, salaam requests, and room metadata.
  - Does not export decrypted room plaintext.

- `GET /api/platform/readiness`
  - Returns provider launch-gate state for the signed-in operator.
  - Emits provider names and required env keys only, never secret values.

## Messaging routes

- `POST /api/device-keys` registers a public device key.
- `GET /api/sender-keys` returns sender public-key metadata for decrypting local ciphertext.
- `GET /api/me/threads` lists room metadata.
- `GET /api/threads/:id/stream` streams encrypted message metadata.
- `POST /api/threads/:id/messages` fans out ciphertext and blocks observer posting.
- `GET /api/threads/:id/recipient-keys` returns recipient public keys for fanout.

## Billing routes

- `POST /api/billing/checkout` opens Stripe Checkout when configured; otherwise returns a launch-gate response.
- `POST /api/billing/webhook` verifies Stripe signature and updates entitlements.

## Agent isolation contract

The assistant route remains separate from service agents and user-room messaging. Tests fail if `/api/agent` imports messaging tables, thread membership helpers, device keys, or message schema.
