import { figuresEmpty, isMarketOpinion, type AssistantPayload } from "@/lib/assistant/payload";

export const SYSTEM_RULES = [
  "The figures below are delayed, cached, or computed on this browser. They are not a live tape.",
  "Do not guarantee a signal or a profit.",
  "Do not give a buy or sell instruction.",
  "Cite only figures present in the payload. If a figure is missing, say it was not supplied.",
  "Do not invent prices, patterns, or fills.",
].join(" ");

export interface LocalReply {
  kind: "local" | "refusal";
  text: string;
}

export function localReply(question: string, payload: AssistantPayload): LocalReply {
  const trimmed = question.trim();
  if (!trimmed) {
    return { kind: "refusal", text: "No question was supplied, so no answer was generated." };
  }
  if (isMarketOpinion(trimmed) && figuresEmpty(payload)) {
    return {
      kind: "refusal",
      text: "No market opinion. The analyzer read, last quote, and closed paper trades were not supplied, so there is no figure to cite. No price or pattern was invented. This is not a buy or sell instruction and not a promise of profit.",
    };
  }
  const hasText = payload.encyclopedia.length > 0 || payload.lessons.length > 0;
  if (!hasText && figuresEmpty(payload)) {
    return {
      kind: "refusal",
      text: "Nothing local was supplied for this question. No encyclopedia passage, academy lesson, analyzer read, quote, or closed paper trade matched. No answer was generated.",
    };
  }

  const lines: string[] = [
    "Local notes only. No model was called. Not a buy or sell instruction and not a promise of profit.",
  ];
  for (const entry of payload.encyclopedia) {
    lines.push(`Encyclopedia — ${entry.name}: ${entry.description} Invalidation: ${entry.invalidation}`);
  }
  for (const lesson of payload.lessons) {
    lines.push(`Academy — ${lesson.level} / ${lesson.module} / ${lesson.title}: ${lesson.body}`);
  }
  lines.push(`Figures supplied: ${figureLine(payload)}`);
  return { kind: "local", text: lines.join("\n\n") };
}

export function figureLine(payload: AssistantPayload): string {
  const analyzer = payload.analyzer
    ? payload.analyzer.available
      ? `${payload.analyzer.symbol} ${payload.analyzer.timeframe} ${payload.analyzer.quality}, active read ${payload.analyzer.active}, last close ${payload.analyzer.lastClose}`
      : `${payload.analyzer.symbol} ${payload.analyzer.timeframe} ${payload.analyzer.quality}, unavailable (${payload.analyzer.reason ?? "no reason stored"})`
    : "analyzer not stored";
  const quote = payload.quote
    ? `${payload.quote.symbol} quality ${payload.quote.quality} (${payload.quote.source})`
    : "quote not stored";
  const trades =
    payload.closedTrades.length === 0
      ? "closed paper trades 0"
      : payload.closedTrades
          .map(
            (trade) =>
              `${trade.symbol} ${trade.side} qty ${trade.qty} entry ${trade.entryPrice} exit ${trade.exitPrice} pnl ${trade.pnl} R ${trade.rMultiple === null ? "none" : trade.rMultiple}`
          )
          .join("; ");
  return `${analyzer}; ${quote}; ${trades}.`;
}

export function promptMessages(question: string, payload: AssistantPayload): Array<{ role: "system" | "user"; content: string }> {
  return [
    {
      role: "system",
      content: `${SYSTEM_RULES}\n\nCite which of these supplied figures you used.\n\n${JSON.stringify(payload)}`,
    },
    { role: "user", content: question.trim() },
  ];
}
