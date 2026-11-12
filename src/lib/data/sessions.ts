export type SessionId = "sydney" | "tokyo" | "london" | "newyork" | "crypto";

export interface SessionDef {
  id: SessionId;
  name: string;
  /** Inclusive start hour UTC, exclusive end (wraps midnight). */
  openUtc: number;
  closeUtc: number;
  wraps: boolean;
}

export const SESSIONS: SessionDef[] = [
  { id: "sydney", name: "Sydney", openUtc: 21, closeUtc: 6, wraps: true },
  { id: "tokyo", name: "Tokyo", openUtc: 0, closeUtc: 9, wraps: false },
  { id: "london", name: "London", openUtc: 7, closeUtc: 16, wraps: false },
  { id: "newyork", name: "New York", openUtc: 13, closeUtc: 22, wraps: false },
  { id: "crypto", name: "Crypto", openUtc: 0, closeUtc: 24, wraps: false },
];

export function isSessionOpen(session: SessionDef, date = new Date()): boolean {
  if (session.id === "crypto") return true;
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  if (session.wraps) return hour >= session.openUtc || hour < session.closeUtc;
  return hour >= session.openUtc && hour < session.closeUtc;
}

export function sessionStatus(date = new Date()) {
  const states = SESSIONS.map((s) => ({ ...s, open: isSessionOpen(s, date) }));
  const openFx = states.filter((s) => s.open && s.id !== "crypto").map((s) => s.name);
  const overlap = openFx.length >= 2;
  return { states, overlap, openFx };
}
