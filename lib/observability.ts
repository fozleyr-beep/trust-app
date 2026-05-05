import "server-only";
import { isPrivacyEventAllowed } from "@/lib/observability-policy";

type PrivacyEvent = {
  event: string;
  properties?: Record<string, string | number | boolean>;
};

export async function recordPrivacyEvent(input: PrivacyEvent): Promise<void> {
  const key = process.env.POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";
  if (!key) return;
  if (!isPrivacyEventAllowed(input.event)) return;

  await fetch(`${host}/capture/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      event: input.event,
      distinct_id: "anonymous-platform-event",
      properties: {
        ...input.properties,
        $process_person_profile: false,
      },
    }),
  }).catch(() => undefined);
}

export async function captureServerError(error: unknown): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  await fetch(dsn, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      platform: "javascript",
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => undefined);
}
