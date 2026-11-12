import type { ScanRuleId } from "@/lib/analysis/scan";

export type PatternDiagramId =
  | "hs"
  | "ihs"
  | "double-top"
  | "double-bottom"
  | "triple-top"
  | "triple-bottom"
  | "ascending"
  | "descending"
  | "symmetrical"
  | "rising-wedge"
  | "falling-wedge"
  | "bull-flag"
  | "bear-flag"
  | "pennant";

export interface PatternDetail {
  formation: string;
  confirmation: string;
  entry: string;
  mistake: string;
  reliability: string;
}

export interface PatternDef {
  id: string;
  name: string;
  kind: "reversal" | "continuation" | "candlestick" | "structure";
  bias: "bull" | "bear" | "both";
  description: string;
  invalidation: string;
  scannerRuleId?: ScanRuleId;
  scannerNote?: string;
  diagram?: PatternDiagramId;
  detail?: PatternDetail;
}

const notAGuarantee = "A match on a chart is not a guarantee of the next move.";

export const PATTERNS: PatternDef[] = [
  {
    id: "hs",
    name: "Head and shoulders",
    kind: "reversal",
    bias: "bear",
    description: "Three swing highs, the middle one the highest. The line through the two troughs is the neckline.",
    invalidation: "A close back above the right-shoulder high, or above the head, after the shape has been marked.",
    scannerRuleId: "head-shoulders",
    diagram: "hs",
    detail: {
      formation:
        "The scanner looks for three confirmed pivot highs. The middle high is above both shoulders by an ATR distance that gets looser as sensitivity rises, and the two shoulders sit near each other. The troughs between those highs are the neckline.",
      confirmation:
        "Confirmed only when a later bar closes below the neckline. If that close has not printed, the hit stays on the scanner as unconfirmed.",
      entry:
        "Textbook notes often mention a close through the neckline, sometimes followed by a retest of that line from below. This terminal does not turn the shape into an order.",
      mistake:
        "Calling any three highs a head and shoulders when the shoulders are far apart in price, or treating the shape as finished before a close through the neckline.",
      reliability: `Studies of this shape disagree once costs and the exact rule are included. ${notAGuarantee}`,
    },
  },
  {
    id: "ihs",
    name: "Inverse head and shoulders",
    kind: "reversal",
    bias: "bull",
    description: "Three swing lows, the middle one the lowest. The line through the two peaks is the neckline.",
    invalidation: "A close back below the right-shoulder low, or below the head.",
    scannerRuleId: "inverse-head-shoulders",
    diagram: "ihs",
    detail: {
      formation:
        "Three confirmed pivot lows. The middle low is under both shoulders by a sensitivity-scaled ATR distance, and the shoulders are within an ATR band of each other. Peaks between the lows form the neckline.",
      confirmation: "Confirmed only when a later bar closes above that neckline. Until then the hit stays listed and unconfirmed.",
      entry:
        "The usual observation is a close above the neckline. Some traders wait to see whether price comes back to the line and holds. No order is created here.",
      mistake: "Ignoring a neckline that slopes the wrong way, or treating the middle low alone as the whole pattern.",
      reliability: `The bullish label is the textbook reading of the shape, not a measured success rate. ${notAGuarantee}`,
    },
  },
  {
    id: "dt",
    name: "Double top",
    kind: "reversal",
    bias: "bear",
    description: "Two pivot highs near the same price, with a trough between them.",
    invalidation: "A close above the higher of the two peaks.",
    scannerRuleId: "double-top",
    diagram: "double-top",
    detail: {
      formation:
        "Two confirmed pivot highs within a sensitivity-scaled ATR band. The lowest point between them has to be far enough below the peaks, also in ATR, or the pair is just noise.",
      confirmation: "Confirmed only on a later close below that trough. Without that close the hit remains unconfirmed and visible.",
      entry:
        "The level people watch is the trough, not the second peak by itself. A close under the trough is the textbook trigger. This page does not size a trade.",
      mistake: "Treating two highs as a double top when the second is clearly higher or lower than the band allows, or when the pullback between them is only a few ticks.",
      reliability: `Equal highs fail often when the broader swing is still rising. ${notAGuarantee}`,
    },
  },
  {
    id: "db",
    name: "Double bottom",
    kind: "reversal",
    bias: "bull",
    description: "Two pivot lows near the same price, with a peak between them.",
    invalidation: "A close below the lower of the two troughs.",
    scannerRuleId: "double-bottom",
    diagram: "double-bottom",
    detail: {
      formation:
        "Two confirmed pivot lows inside the ATR band for the current sensitivity, with a rally between them that clears the depth test.",
      confirmation: "Confirmed only on a later close above the intervening peak. Otherwise it stays unconfirmed.",
      entry:
        "The peak between the lows is the level in the textbook, not an instruction to buy the second low. The scanner only reports the geometry.",
      mistake: "Buying the second low before any close through the middle peak, or pairing lows that are months apart and not one structure.",
      reliability: `A second test of a low is common in down swings and does not have to reverse. ${notAGuarantee}`,
    },
  },
  {
    id: "tt",
    name: "Triple top",
    kind: "reversal",
    bias: "bear",
    description: "Three pivot highs inside one price band, with a trough after each of the first two.",
    invalidation: "A close above the highest of the three peaks.",
    scannerRuleId: "triple-top",
    diagram: "triple-top",
    detail: {
      formation:
        "Three confirmed pivot highs whose prices all sit inside one sensitivity band. Each gap between highs contains a trough deep enough in ATR terms.",
      confirmation: "Confirmed only on a later close below the lower of those troughs. Until that print the row stays unconfirmed.",
      entry:
        "The lower trough is the level the rule uses. Touching a high for the third time is not the confirmation.",
      mistake: "Counting a double top plus a much higher or lower third swing as a triple, or dropping the hit just because it is still unconfirmed.",
      reliability: `Three touches of a ceiling are still just three bars. ${notAGuarantee}`,
    },
  },
  {
    id: "tb",
    name: "Triple bottom",
    kind: "reversal",
    bias: "bull",
    description: "Three pivot lows inside one price band, with a peak after each of the first two.",
    invalidation: "A close below the lowest of the three troughs.",
    scannerRuleId: "triple-bottom",
    diagram: "triple-bottom",
    detail: {
      formation:
        "Three confirmed pivot lows inside the ATR band, separated by peaks that clear the depth test.",
      confirmation: "Confirmed only on a later close above the higher of those peaks. Unconfirmed hits stay in the list.",
      entry: "The higher middle peak is the level the rule waits on. The third low itself is not a confirmation.",
      mistake: "Forcing a triple bottom out of a descending triangle, where the lows are not actually level.",
      reliability: `Repeated lows can just as easily be a pause in a decline. ${notAGuarantee}`,
    },
  },
  {
    id: "asc",
    name: "Ascending triangle",
    kind: "continuation",
    bias: "bull",
    description: "Highs stay in a flat band while later lows are higher, and the gap between them narrows.",
    invalidation: "A close below the most recent rising low before a close through the highs.",
    scannerRuleId: "ascending-triangle",
    diagram: "ascending",
    detail: {
      formation:
        "At least two confirmed pivot highs inside a flat ATR band, and rising pivot lows. The distance from high to low at the end is narrower than at the start.",
      confirmation: "Confirmed only on a later close above the flat highs. If price is still inside the lines, the hit is unconfirmed and still shown.",
      entry:
        "The textbook watch is a close above the flat highs. A push into the highs that does not close beyond them is not the confirmation this rule uses.",
      mistake: "Labeling a rising channel as an ascending triangle when the highs are rising too, or assuming the break has to be upward.",
      reliability: `Flat highs break both ways in real series. The bullish label is the convention, not a promise. ${notAGuarantee}`,
    },
  },
  {
    id: "desc",
    name: "Descending triangle",
    kind: "continuation",
    bias: "bear",
    description: "Lows stay in a flat band while later highs are lower, and the gap narrows.",
    invalidation: "A close above the most recent falling high before a close through the lows.",
    scannerRuleId: "descending-triangle",
    diagram: "descending",
    detail: {
      formation:
        "Pivot lows inside a flat ATR band and falling pivot highs, with a narrower gap at the end than at the start.",
      confirmation: "Confirmed only on a later close below the flat lows. Inside the lines, the hit stays unconfirmed.",
      entry: "The level in the rule is the flat lows. The bearish label does not by itself justify a position.",
      mistake: "Calling every pullback to a horizontal low a descending triangle when the highs are not actually stepping down.",
      reliability: `The bearish label is traditional. Series break the other way often enough that the shape cannot be a promise. ${notAGuarantee}`,
    },
  },
  {
    id: "sym",
    name: "Symmetrical triangle",
    kind: "continuation",
    bias: "both",
    description: "Highs step down and lows step up, so the two boundaries converge.",
    invalidation: "There is no preferred side. A close back inside after a break is the usual failure, and the scanner does not guess the direction in advance.",
    scannerRuleId: "symmetrical-triangle",
    diagram: "symmetrical",
    detail: {
      formation:
        "Later pivot highs are lower than earlier ones, later pivot lows are higher, and the gap narrows. Direction is not assigned.",
      confirmation:
        "Confirmed when a later close is above the last pivot high or below the last pivot low. The hit names which side printed. Until either close, it stays unconfirmed.",
      entry:
        "There is no default side. The only observation the rule records is a close outside the last swings. It is not an entry signal.",
      mistake: "Drawing the triangle and then deciding the breakout direction before a close actually leaves the range.",
      reliability: `Converging swings are a description of past bars. ${notAGuarantee}`,
    },
  },
  {
    id: "rising-wedge",
    name: "Rising wedge",
    kind: "reversal",
    bias: "bear",
    description: "Both highs and lows rise, and the gap between those lines narrows.",
    invalidation: "A close above the last rising high before a close under the last rising low.",
    scannerRuleId: "rising-wedge",
    diagram: "rising-wedge",
    detail: {
      formation:
        "Confirmed pivot highs and pivot lows are both higher at the end of the window than at the start, by more than the flat band, and the vertical gap shrinks.",
      confirmation: "Confirmed only on a later close below the last pivot low. Until then the hit is unconfirmed and remains visible.",
      entry:
        "The textbook bearish reading waits for a close under the rising lows. Rising prices inside the wedge are not that close.",
      mistake: "Confusing a rising wedge with an ascending triangle. In the wedge, the highs rise too. In the triangle, the highs are flat.",
      reliability: `A narrowing rise can keep rising. The bearish label is a convention. ${notAGuarantee}`,
    },
  },
  {
    id: "falling-wedge",
    name: "Falling wedge",
    kind: "reversal",
    bias: "bull",
    description: "Both highs and lows fall, and the gap between those lines narrows.",
    invalidation: "A close below the last falling low before a close above the last falling high.",
    scannerRuleId: "falling-wedge",
    diagram: "falling-wedge",
    detail: {
      formation:
        "Pivot highs and pivot lows are both lower across the window, beyond the flat band, and the range between them contracts.",
      confirmation: "Confirmed only on a later close above the last pivot high. An unfinished wedge stays listed as unconfirmed.",
      entry: "The level in the rule is the last falling high. The bullish label is not an instruction to buy the lows.",
      mistake: "Calling a descending triangle a falling wedge. A wedge's lows keep falling. A descending triangle's lows are flat.",
      reliability: `Falling, narrowing swings do not have to reverse. ${notAGuarantee}`,
    },
  },
  {
    id: "bull-flag",
    name: "Bull flag",
    kind: "continuation",
    bias: "bull",
    description: "A short upward impulse, then a tighter cluster of bars that drifts down.",
    invalidation: "A close below the flag low before a close above the flag high.",
    scannerRuleId: "bull-flag",
    diagram: "bull-flag",
    detail: {
      formation:
        "About six bars where the close rises by a sensitivity-scaled multiple of ATR, without a deep dip against that run. The next bars stay in a range smaller than the impulse and drift down.",
      confirmation: "Confirmed only on a later close above the high of that cluster. If price is still inside it, the hit stays unconfirmed.",
      entry:
        "The textbook continuation is a close above the flag, not the pole by itself. The scanner does not calculate a target or send an order.",
      mistake: "Labeling any pause after a green day as a flag when the pause is as large as the impulse, or when price never actually dipped.",
      reliability: `Flags are a description of a pause after a run. ${notAGuarantee}`,
    },
  },
  {
    id: "bear-flag",
    name: "Bear flag",
    kind: "continuation",
    bias: "bear",
    description: "A short downward impulse, then a tighter cluster of bars that drifts up.",
    invalidation: "A close above the flag high before a close below the flag low.",
    scannerRuleId: "bear-flag",
    diagram: "bear-flag",
    detail: {
      formation:
        "About six bars where the close falls by a sensitivity-scaled ATR multiple, then a tighter cluster that drifts up and does not erase the drop.",
      confirmation: "Confirmed only on a later close below the low of that cluster. Unconfirmed hits stay on the list.",
      entry: "The level the rule uses is the flag low. The bearish label is the textbook continuation, not a forecast.",
      mistake: "Treating a bounce that retraces most of the drop as a bear flag. The cluster has to stay smaller than the impulse.",
      reliability: `A bounce after a drop is ordinary and often continues upward. ${notAGuarantee}`,
    },
  },
  {
    id: "pennant",
    name: "Pennant",
    kind: "continuation",
    bias: "both",
    description: "A short impulse, then a small cluster whose later bars cover less range than its earlier bars.",
    invalidation: "A close out of the cluster against the impulse direction before a close in the impulse direction.",
    scannerRuleId: "pennant",
    diagram: "pennant",
    detail: {
      formation:
        "The same impulse test as a flag, followed by a cluster whose second half has a smaller high-low range than its first half. The direction of the label follows the impulse, up or down.",
      confirmation:
        "Confirmed on a later close beyond the cluster in the impulse direction. Until that close the hit is unconfirmed and still shown.",
      entry:
        "The observation is the close leaving the small range, in the direction the impulse already traveled. It is not a measured-move target.",
      mistake: "Drawing a pennant on a cluster that is not tighter in its second half, or ignoring which way the impulse went.",
      reliability: `A contracting pause can break either way. ${notAGuarantee}`,
    },
  },
  {
    id: "engulf",
    name: "Engulfing candle",
    kind: "candlestick",
    bias: "both",
    description: "Body fully covers the prior body. Context (location in a swing) matters more than the candle alone.",
    invalidation: "Immediate close back through the engulfing midpoint.",
    scannerRuleId: "engulfing",
  },
  {
    id: "doji",
    name: "Doji",
    kind: "candlestick",
    bias: "both",
    description: "Open and close nearly equal. A pause in the range, not a direction by itself.",
    invalidation: "A close that never leaves the doji range does not confirm a break.",
    scannerRuleId: "doji",
  },
  {
    id: "hammer",
    name: "Hammer",
    kind: "candlestick",
    bias: "bull",
    description: "Small body near the high and a long lower wick. The scanner only flags this wick shape.",
    invalidation: "A close back through the hammer low.",
    scannerRuleId: "hammer",
  },
  {
    id: "pin",
    name: "Pin bar / rejection wick",
    kind: "candlestick",
    bias: "both",
    description: "Long wick, small body. Shows rejection of a price area on that timeframe only.",
    invalidation: "A close beyond the wick extreme.",
    scannerRuleId: "hammer",
    scannerNote: "The scanner flags hammers (long lower wick). Other pin shapes are not scanned.",
  },
  {
    id: "swings",
    name: "Swing sequence HH / HL / LH / LL",
    kind: "structure",
    bias: "both",
    description: "Successive pivot highs and lows. HH+HL is an up sequence. LH+LL is a down sequence. Mixed is mixed.",
    invalidation: "A new pivot that breaks the sequence.",
    scannerRuleId: "swing",
  },
];
