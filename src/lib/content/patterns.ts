export interface PatternDef {
  id: string;
  name: string;
  kind: "reversal" | "continuation" | "candlestick";
  bias: "bull" | "bear" | "both";
  description: string;
  invalidation: string;
}

export const PATTERNS: PatternDef[] = [
  {
    id: "hs",
    name: "Head and shoulders",
    kind: "reversal",
    bias: "bear",
    description:
      "Three swings with a higher middle peak. A close through the neckline is the textbook trigger. This is a historical structure, not a forecast.",
    invalidation: "A close back above the right-shoulder high after a neckline break.",
  },
  {
    id: "ihs",
    name: "Inverse head and shoulders",
    kind: "reversal",
    bias: "bull",
    description:
      "Three troughs with a lower middle low. Neckline break to the upside is the classic observation. Scenarios, not predictions.",
    invalidation: "A close back below the right-shoulder low.",
  },
  {
    id: "dt",
    name: "Double top",
    kind: "reversal",
    bias: "bear",
    description: "Two similar highs with a trough between. Break of the trough is the usual observation.",
    invalidation: "A close above the second peak.",
  },
  {
    id: "db",
    name: "Double bottom",
    kind: "reversal",
    bias: "bull",
    description: "Two similar lows. Break of the intervening high is the usual observation.",
    invalidation: "A close below the second trough.",
  },
  {
    id: "flag",
    name: "Bull / bear flag",
    kind: "continuation",
    bias: "both",
    description:
      "A sharp impulse (pole) followed by a tight channel against the impulse. Break in the impulse direction is the scenario traders watch.",
    invalidation: "A close through the opposite side of the flag.",
  },
  {
    id: "engulf",
    name: "Engulfing candle",
    kind: "candlestick",
    bias: "both",
    description:
      "Body fully covers the prior body. Context (location in a swing) matters more than the candle alone.",
    invalidation: "Immediate close back through the engulfing midpoint.",
  },
  {
    id: "pin",
    name: "Pin bar / rejection wick",
    kind: "candlestick",
    bias: "both",
    description: "Long wick, small body. Shows rejection of a price area on that timeframe only.",
    invalidation: "A close beyond the wick extreme.",
  },
  {
    id: "triangle",
    name: "Symmetrical triangle",
    kind: "continuation",
    bias: "both",
    description: "Contracting highs and lows. Direction is unknown until a close outside the range. Not a prediction.",
    invalidation: "Failed break that closes back inside and through the opposite bound.",
  },
];
