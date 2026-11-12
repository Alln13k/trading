export interface Lesson {
  id: string;
  module: string;
  title: string;
  body: string;
}

export const LESSONS: Lesson[] = [
  {
    id: "risk-1",
    module: "Risk",
    title: "Risk a fraction, not a feeling",
    body: "Paper trading still needs a rule: choose a percent of equity you can lose on one idea (often 0.25–1%). Size from stop distance, not from conviction. This product never places real orders.",
  },
  {
    id: "data-1",
    module: "Data",
    title: "Delayed is not live",
    body: "Yahoo unofficial quotes are typically delayed, especially for FX, indices, and futures. Crypto last prints can look fresh and still be unofficial. The terminal labels quality so you never treat a sample or a cache as a live tape.",
  },
  {
    id: "journal-1",
    module: "Process",
    title: "Journal the decision, not the P&amp;L first",
    body: "Write the setup, invalidation, and emotion before you know the outcome. Performance stats later are only as honest as those notes.",
  },
  {
    id: "scenario-1",
    module: "Analysis",
    title: "Scenarios are not forecasts",
    body: "Analyzer and scanner language is if/then. No module here guarantees a move. If a tool cannot compute from real bars, it must say unavailable — it must not invent a pattern.",
  },
];
