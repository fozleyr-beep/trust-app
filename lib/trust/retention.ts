export const providerProcessing = [
  ["Clerk", "Email, auth session, account deletion", "live", "Until account deletion or provider policy requires shorter."],
  ["Neon", "Service state, ciphertext metadata, audit rows", "live", "Deleted or tombstoned by account deletion workflow."],
  ["Vercel", "Hosting, functions, deployment logs", "live", "Operational logs only; no room plaintext."],
  ["Anthropic or AI Gateway", "Separate assistant prompts only", "live", "Never receives encrypted room plaintext from Sakinah."],
  ["Stripe", "Checkout, subscription, webhook entitlement", "launch gate", "Billing records follow Stripe retention and tax rules."],
  ["Twilio Verify", "Phone challenge status", "launch gate", "Provider verification logs; no profile matching content."],
  ["Cloudflare R2", "Gated photos and voice drafts", "launch gate", "Photos gate until mutual interest; voice drafts purge after 24h."],
] as const;

export const retentionLedger = [
  ["Encrypted room content", "Ciphertext only", "Cannot be plaintext-deleted by the server because it never has keys."],
  ["Device keys", "Public keys", "Revoked on rotation or account deletion."],
  ["Profile layers", "Public, gated, family JSON", "Deleted or tombstoned with the account."],
  ["Voice intake", "Temporary media", "Launch contract: purge within 24h after Watim draft."],
  ["Photos", "Private media object", "Only signed after mutual interest and access token verification."],
  ["Agent actions", "Product-state ledger", "Exportable; stores hashes, not room plaintext."],
  ["Billing", "Provider event IDs and entitlement", "Kept only as needed for self-serve access and compliance."],
] as const;

export const accountDeletionReceipt = [
  "Clerk account deletion requested.",
  "Device keys revoked so new encrypted fanout stops.",
  "User row marked deleted for product access.",
  "Service profile, matches, salaams, and audit export become unavailable to that account.",
  "Existing ciphertext may remain for other room members because Sakinah cannot decrypt it.",
] as const;

export const observerBoundaries = [
  "Observers are visible to room participants.",
  "Observers cannot post messages into encrypted rooms.",
  "Observers cannot accept, decline, or override a seeker.",
  "Observer notes stay outside the couple room.",
  "Watim can explain process state, not private message content.",
] as const;

export const sabrSafetySignals = [
  "Repeated pending salaam requests",
  "Expired waiting windows",
  "Observer role changes",
  "Pause or step-back actions",
  "Report metadata and consent handoff state",
] as const;
