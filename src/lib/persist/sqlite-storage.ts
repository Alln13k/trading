import { createJSONStorage, type StateStorage } from "zustand/middleware";
import { assertSqliteKey } from "@/lib/persist/sqlite-keys";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let dbPromise: Promise<{
  execute: (query: string, bindValues?: unknown[]) => Promise<unknown>;
  select: <T>(query: string, bindValues?: unknown[]) => Promise<T>;
}> | null = null;

async function database() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { default: Database } = await import("@tauri-apps/plugin-sql");
      const db = await Database.load("sqlite:trading.db");
      await db.execute(
        "CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
      );
      return db;
    })();
  }
  return dbPromise;
}

async function readRaw(name: string): Promise<string | null> {
  assertSqliteKey(name);
  if (typeof window === "undefined") return null;
  if (!isTauri()) return window.localStorage.getItem(name);
  try {
    const db = await database();
    const rows = await db.select<{ value: string }[]>("SELECT value FROM app_state WHERE key = $1", [name]);
    if (rows[0]?.value != null) return rows[0].value;
    const local = window.localStorage.getItem(name);
    if (local != null) {
      await db.execute(
        "INSERT INTO app_state (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [name, local]
      );
    }
    return local;
  } catch {
    console.warn(`SQLite read failed for ${name}`);
    return window.localStorage.getItem(name);
  }
}

async function writeRaw(name: string, value: string): Promise<void> {
  assertSqliteKey(name);
  if (typeof window === "undefined") return;
  if (!isTauri()) {
    window.localStorage.setItem(name, value);
    return;
  }
  const db = await database();
  await db.execute(
    "INSERT INTO app_state (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [name, value]
  );
}

const adaptiveStorage: StateStorage = {
  getItem: (name) => readRaw(name),
  setItem: (name, value) => writeRaw(name, value),
  removeItem: async (name) => {
    assertSqliteKey(name);
    if (typeof window === "undefined") return;
    if (!isTauri()) {
      window.localStorage.removeItem(name);
      return;
    }
    const db = await database();
    await db.execute("DELETE FROM app_state WHERE key = $1", [name]);
  },
};

/** Browser localStorage, or SQLite when the Next UI is inside the Tauri window. */
export function persistStorage() {
  return createJSONStorage(() => {
    if (typeof window === "undefined") {
      throw new Error("persist storage is client-only");
    }
    return adaptiveStorage;
  });
}

export async function readSqliteJson<T>(name: string): Promise<T | null> {
  const raw = await readRaw(name);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeSqliteJson(name: string, value: unknown): Promise<void> {
  await writeRaw(name, JSON.stringify(value));
}
