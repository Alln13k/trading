export type AcademyLevel = "beginner" | "intermediate" | "advanced";

export interface Lesson {
  id: string;
  module: string;
  title: string;
  body: string;
  level: AcademyLevel;
}

export const LESSONS: Lesson[] = [
  {
    id: "risk-1",
    level: "beginner",
    module: "Risk",
    title: "Risk a fraction, not a feeling",
    body: "Paper trading still needs a rule: choose a percent of equity you can lose on one idea (often 0.25–1%). Size from stop distance, not from conviction. This product never places real orders.",
  },
  {
    id: "data-1",
    level: "beginner",
    module: "Data",
    title: "Delayed is not live",
    body: "Yahoo unofficial quotes are typically delayed, especially for FX, indices, and futures. Crypto last prints can look fresh and still be unofficial. The terminal labels quality so you never treat a sample or a cache as a live tape.",
  },
  {
    id: "journal-1",
    level: "intermediate",
    module: "Process",
    title: "Journal the decision, not the P&L first",
    body: "Write the setup, invalidation, and emotion before you know the outcome. Performance stats later are only as honest as those notes.",
  },
  {
    id: "scenario-1",
    level: "advanced",
    module: "Analysis",
    title: "Scenarios are not forecasts",
    body: "Analyzer and scanner language is if/then. No module here guarantees a move. If a tool cannot compute from real bars, it must say unavailable — it must not invent a pattern.",
  },
];
