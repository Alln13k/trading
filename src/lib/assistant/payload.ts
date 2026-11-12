import { LESSONS } from "@/lib/content/lessons";
import { PATTERNS } from "@/lib/content/patterns";
import type { StoredAnalyzerRead } from "@/lib/stores/analyzer-read-store";

/** Fields a prompt may contain. Anything else is out of scope. */
export interface AssistantPayload {
  encyclopedia: Array<{ name: string; description: string; invalidation: string }>;
  lessons: Array<{ level: string; module: string; title: string; body: string }>;
  analyzer: StoredAnalyzerRead | null;
  quote: { symbol: string; quality: string; source: string } | null;
  closedTrades: Array<{
    symbol: string;
    side: string;
    qty: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    rMultiple: number | null;
  }>;
}

const STOP = new Set([
  "what", "is", "are", "was", "a", "an", "the", "of", "does", "do", "how", "to", "and", "or",
  "in", "on", "for", "me", "my", "i", "it", "this", "that", "with", "from", "about", "please",
]);

export function questionTokens(question: string): string[] {
  return question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

export function buildPayload(
  question: string,
  input: {
    analyzer: StoredAnalyzerRead | null;
    quote: { symbol: string; quality: string; source: string } | null;
    closedTrades: AssistantPayload["closedTrades"];
  }
): AssistantPayload {
  const tokens = questionTokens(question);
  const encyclopedia =
    tokens.length === 0
      ? []
      : PATTERNS.filter((pattern) => {
          const hay = `${pattern.name} ${pattern.description} ${pattern.invalidation}`.toLowerCase();
          return tokens.some((token) => hay.includes(token));
        }).map((pattern) => ({
          name: pattern.name,
          description: pattern.description,
          invalidation: pattern.invalidation,
        }));
  const lessons =
    tokens.length === 0
      ? []
      : LESSONS.filter((lesson) => {
          const hay = `${lesson.title} ${lesson.module} ${lesson.level} ${lesson.body}`.toLowerCase();
          return tokens.some((token) => hay.includes(token));
        }).map((lesson) => ({
          level: lesson.level,
          module: lesson.module,
          title: lesson.title,
          body: lesson.body,
        }));
  return {
    encyclopedia,
    lessons,
    analyzer: input.analyzer,
    quote: input.quote,
    closedTrades: input.closedTrades,
  };
}

export function figuresEmpty(payload: AssistantPayload): boolean {
  return payload.analyzer === null && payload.quote === null && payload.closedTrades.length === 0;
}

export function isMarketOpinion(question: string): boolean {
  return /\b(buy|sell|long|short|forecast|outlook|signal|profit)\b|\bshould i\b|\bgoing up\b|\bgoing down\b|\bprice target\b|\bwill (price|btc|eth|it)\b/i.test(
    question
  );
}
