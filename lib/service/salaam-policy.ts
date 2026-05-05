const SALAAM_REQUEST_TTL_DAYS = 7;

export function weekStartIso(now = new Date()): string {
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + mondayOffset);
  return date.toISOString().slice(0, 10);
}

export function nextWeekStartIso(now = new Date()): string {
  const start = new Date(`${weekStartIso(now)}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() + 7);
  return start.toISOString().slice(0, 10);
}

export function salaamExpiresAt(
  updatedAt: Date,
  status: string,
): string | null {
  if (status !== "requested") return null;
  const expires = new Date(updatedAt);
  expires.setUTCDate(expires.getUTCDate() + SALAAM_REQUEST_TTL_DAYS);
  return expires.toISOString();
}

export function isSalaamExpired(
  updatedAt: Date,
  status: string,
  now = new Date(),
): boolean {
  const expiresAt = salaamExpiresAt(updatedAt, status);
  return expiresAt ? new Date(expiresAt).getTime() <= now.getTime() : false;
}
