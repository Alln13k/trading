/** Keys the desktop SQLite file is allowed to hold. The assistant key is never one of them. */
export const SQLITE_KEYS = [
  "trading-paper-v1",
  "trading-journal-v2",
  "trading-academy-v1",
  "trading-duo-v1",
  "trading-quote-cache-v1",
] as const;

export type SqliteKey = (typeof SQLITE_KEYS)[number];

const ALLOWED = new Set<string>(SQLITE_KEYS);

export function assertSqliteKey(name: string): asserts name is SqliteKey {
  if (name === "trading-ai-v1" || name.toLowerCase().includes("apikey") || name.toLowerCase().includes("api_key")) {
    throw new Error("Assistant credentials are not stored in SQLite.");
  }
  if (!ALLOWED.has(name)) {
    throw new Error(`SQLite adapter refused key ${name}.`);
  }
}
