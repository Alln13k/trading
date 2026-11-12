import type { PatternDiagramId } from "@/lib/content/patterns";

interface Diagram {
  label: string;
  stroke: string;
  path: string;
  guides: Array<{ d: string; label: string }>;
}

const DIAGRAMS: Record<PatternDiagramId, Diagram> = {
  hs: {
    label: "Schematic head and shoulders: three peaks, middle highest, dashed neckline",
    stroke: "var(--down)",
    path: "M16 96 L58 58 L92 78 L140 28 L188 80 L228 62 L268 108",
    guides: [{ d: "M92 78 L228 96", label: "Neckline" }],
  },
  ihs: {
    label: "Schematic inverse head and shoulders: three troughs, middle lowest, dashed neckline",
    stroke: "var(--up)",
    path: "M16 40 L58 78 L92 56 L140 108 L188 54 L228 74 L268 28",
    guides: [{ d: "M92 56 L228 40", label: "Neckline" }],
  },
  "double-top": {
    label: "Schematic double top: two similar peaks and one trough",
    stroke: "var(--down)",
    path: "M16 108 L78 36 L140 86 L202 38 L268 112",
    guides: [{ d: "M78 36 L202 38", label: "Highs" }],
  },
  "double-bottom": {
    label: "Schematic double bottom: two similar troughs and one peak",
    stroke: "var(--up)",
    path: "M16 28 L78 100 L140 50 L202 98 L268 24",
    guides: [{ d: "M78 100 L202 98", label: "Lows" }],
  },
  "triple-top": {
    label: "Schematic triple top: three similar peaks",
    stroke: "var(--down)",
    path: "M12 108 L48 40 L84 78 L124 36 L164 80 L204 42 L268 108",
    guides: [{ d: "M48 40 L204 42", label: "Highs" }],
  },
  "triple-bottom": {
    label: "Schematic triple bottom: three similar troughs",
    stroke: "var(--up)",
    path: "M12 28 L48 96 L84 58 L124 100 L164 56 L204 94 L268 28",
    guides: [{ d: "M48 96 L204 94", label: "Lows" }],
  },
  ascending: {
    label: "Schematic ascending triangle: flat highs and rising lows",
    stroke: "var(--up)",
    path: "M20 112 L70 40 L112 86 L162 40 L196 68 L250 40",
    guides: [
      { d: "M70 40 L250 40", label: "Highs" },
      { d: "M20 112 L196 68", label: "Lows" },
    ],
  },
  descending: {
    label: "Schematic descending triangle: falling highs and flat lows",
    stroke: "var(--down)",
    path: "M20 28 L70 100 L112 52 L162 100 L196 70 L250 100",
    guides: [
      { d: "M20 28 L196 70", label: "Highs" },
      { d: "M70 100 L250 100", label: "Lows" },
    ],
  },
  symmetrical: {
    label: "Schematic symmetrical triangle: falling highs and rising lows",
    stroke: "var(--accent)",
    path: "M16 108 L64 32 L108 86 L156 48 L196 74 L248 58",
    guides: [
      { d: "M64 32 L248 58", label: "Highs" },
      { d: "M16 108 L196 74", label: "Lows" },
    ],
  },
  "rising-wedge": {
    label: "Schematic rising wedge: both boundaries rise and converge",
    stroke: "var(--down)",
    path: "M16 116 L64 72 L104 96 L152 52 L192 70 L248 36",
    guides: [
      { d: "M64 72 L248 36", label: "Highs" },
      { d: "M16 116 L192 70", label: "Lows" },
    ],
  },
  "falling-wedge": {
    label: "Schematic falling wedge: both boundaries fall and converge",
    stroke: "var(--up)",
    path: "M16 24 L64 68 L104 44 L152 88 L192 70 L248 104",
    guides: [
      { d: "M16 24 L192 70", label: "Highs" },
      { d: "M64 68 L248 104", label: "Lows" },
    ],
  },
  "bull-flag": {
    label: "Schematic bull flag: a rising pole and a short downward cluster",
    stroke: "var(--up)",
    path: "M20 112 L78 36 L112 52 L146 46 L180 60 L214 50 L248 64",
    guides: [
      { d: "M78 36 L214 50", label: "Upper" },
      { d: "M112 52 L248 64", label: "Lower" },
    ],
  },
  "bear-flag": {
    label: "Schematic bear flag: a falling pole and a short upward cluster",
    stroke: "var(--down)",
    path: "M20 24 L78 100 L112 84 L146 90 L180 76 L214 86 L248 72",
    guides: [
      { d: "M112 84 L248 72", label: "Upper" },
      { d: "M78 100 L214 86", label: "Lower" },
    ],
  },
  pennant: {
    label: "Schematic pennant: an impulse then a small converging cluster",
    stroke: "var(--accent)",
    path: "M16 112 L86 36 L118 58 L156 46 L190 54 L230 48",
    guides: [
      { d: "M86 36 L230 48", label: "Upper" },
      { d: "M118 58 L190 54", label: "Lower" },
    ],
  },
};

export function PatternDiagram({ id }: { id: PatternDiagramId }) {
  const diagram = DIAGRAMS[id];
  return (
    <svg viewBox="0 0 280 140" role="img" aria-label={diagram.label} className="h-36 w-full rounded-lg border border-line bg-raised">
      <title>{diagram.label}</title>
      <text x="12" y="16" fill="var(--secondary)" fontSize="10">
        Schematic shape, not a price chart
      </text>
      {diagram.guides.map((guide) => (
        <path key={guide.label} d={guide.d} fill="none" stroke="var(--secondary)" strokeWidth="1" strokeDasharray="4 3" />
      ))}
      <path d={diagram.path} fill="none" stroke={diagram.stroke} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
