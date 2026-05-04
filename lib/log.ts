// JSON logger. Vercel, Cloud Run, and most log aggregators parse JSON
// stdout natively, so structured fields are queryable without a parser.
// Keep this module dependency-free so it works in edge runtimes too.

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): number {
  const env = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (env && env in LEVEL_RANK) return LEVEL_RANK[env];
  return process.env.NODE_ENV === "production"
    ? LEVEL_RANK.info
    : LEVEL_RANK.debug;
}

function emit(level: LogLevel, event: string, fields?: LogFields): void {
  if (LEVEL_RANK[level] < minLevel()) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  // stderr for warn+error so log aggregators can split by stream if they want.
  if (level === "warn" || level === "error") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

export const log = {
  debug: (event: string, fields?: LogFields) => emit("debug", event, fields),
  info: (event: string, fields?: LogFields) => emit("info", event, fields),
  warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
  error: (event: string, fields?: LogFields) => emit("error", event, fields),
};
