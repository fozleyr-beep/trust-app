export const ALLOWED_PRIVACY_EVENTS = [
  "agent.run",
  "audit.export",
  "billing.checkout.opened",
  "profile.saved",
  "readiness.viewed",
  "salaam.responded",
] as const;

export function isPrivacyEventAllowed(event: string) {
  if (event.startsWith("observer.")) return false;
  if (event.startsWith("room.")) return false;
  if (event.includes("message") || event.includes("plaintext")) return false;
  return (ALLOWED_PRIVACY_EVENTS as readonly string[]).includes(event);
}
