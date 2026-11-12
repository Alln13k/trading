import type {
  IChartApi,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import type { Drawing } from "@/lib/stores/chart-store";

const FIB = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

interface Point {
  x: number;
  y: number;
}

interface Painted {
  id: string;
  kind: Drawing["kind"];
  color: string;
  selected: boolean;
  a: Point;
  b: Point;
  fib?: Array<{ y: number; label: string }>;
}

class Renderer implements IPrimitivePaneRenderer {
  constructor(private items: Painted[]) {}

  draw(target: Parameters<IPrimitivePaneRenderer["draw"]>[0]) {
    target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio: hr, verticalPixelRatio: vr }) => {
      for (const item of this.items) {
        const x1 = item.a.x * hr;
        const y1 = item.a.y * vr;
        const x2 = item.b.x * hr;
        const y2 = item.b.y * vr;
        ctx.save();
        ctx.strokeStyle = item.selected ? "#F1F4F8" : item.color;
        ctx.lineWidth = (item.selected ? 2 : 1.25) * hr;
        ctx.fillStyle = item.color;
        if (item.kind === "trendline") {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          for (const [x, y] of [
            [x1, y1],
            [x2, y2],
          ] as const) {
            ctx.beginPath();
            ctx.arc(x, y, 3 * hr, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (item.kind === "rectangle") {
          const x = Math.min(x1, x2);
          const y = Math.min(y1, y2);
          const w = Math.abs(x2 - x1);
          const h = Math.abs(y2 - y1);
          ctx.globalAlpha = 0.12;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = 1;
          ctx.strokeRect(x, y, w, h);
        } else if (item.kind === "fibonacci" && item.fib) {
          ctx.setLineDash([4 * hr, 3 * hr]);
          const left = Math.min(x1, x2);
          const right = Math.max(x1, x2);
          ctx.font = `${11 * vr}px sans-serif`;
          ctx.fillStyle = item.color;
          for (const level of item.fib) {
            const y = level.y * vr;
            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
            ctx.stroke();
            ctx.fillText(level.label, left + 4 * hr, y - 3 * vr);
          }
        }
        ctx.restore();
      }
    });
  }
}

class PaneView implements IPrimitivePaneView {
  items: Painted[] = [];
  private rendererObj: Renderer = new Renderer([]);

  constructor(private host: ChartDrawingsPrimitive) {}

  update() {
    const chart = this.host.chart;
    const series = this.host.series;
    if (!chart || !series) {
      this.items = [];
      this.rendererObj = new Renderer([]);
      return;
    }
    const items: Painted[] = [];
    for (const d of this.host.drawings) {
      if (d.kind !== "trendline" && d.kind !== "rectangle" && d.kind !== "fibonacci") continue;
      const x1 = this.xOf(chart, d.startLogical, d.startTime);
      const x2 = this.xOf(chart, d.endLogical, d.endTime);
      const y1 = series.priceToCoordinate(d.startPrice);
      const y2 = series.priceToCoordinate(d.endPrice);
      if (x1 === null || x2 === null || y1 === null || y2 === null) continue;
      const painted: Painted = {
        id: d.id,
        kind: d.kind,
        color: d.color,
        selected: d.id === this.host.selectedId,
        a: { x: x1, y: y1 },
        b: { x: x2, y: y2 },
      };
      if (d.kind === "fibonacci") {
        const levels: Array<{ y: number; label: string }> = [];
        for (const lv of FIB) {
          const price = d.startPrice + (d.endPrice - d.startPrice) * lv;
          const y = series.priceToCoordinate(price);
          if (y === null) continue;
          levels.push({
            y,
            label: `${(lv * 100).toFixed(lv === 0.236 || lv === 0.786 ? 1 : 0)}%`,
          });
        }
        painted.fib = levels;
      }
      items.push(painted);
    }
    this.items = items;
    this.rendererObj = new Renderer(items);
  }

  renderer(): IPrimitivePaneRenderer | null {
    return this.rendererObj;
  }

  private xOf(chart: IChartApi, logical: number | undefined, time: number): number | null {
    if (logical !== undefined && Number.isFinite(logical)) {
      const x = chart.timeScale().logicalToCoordinate(logical as never);
      if (x !== null) return x;
    }
    return chart.timeScale().timeToCoordinate(time as UTCTimestamp);
  }
}

/**
 * Series primitive for trend line, rectangle, and Fibonacci.
 * Coordinates are recomputed by the chart on zoom and scroll.
 */
export class ChartDrawingsPrimitive implements ISeriesPrimitive<Time> {
  drawings: Drawing[] = [];
  selectedId: string | null = null;
  chart: IChartApi | null = null;
  series: ISeriesApi<"Candlestick" | "Line" | "Area"> | null = null;
  private requestUpdate: (() => void) | null = null;
  private view = new PaneView(this);
  private views: readonly IPrimitivePaneView[] = [this.view];

  attached(param: SeriesAttachedParameter<Time>): void {
    this.chart = param.chart as IChartApi;
    this.series = param.series as ISeriesApi<"Candlestick" | "Line" | "Area">;
    this.requestUpdate = param.requestUpdate;
  }

  detached(): void {
    this.chart = null;
    this.series = null;
    this.requestUpdate = null;
  }

  updateAllViews(): void {
    this.view.update();
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this.views;
  }

  setDrawings(drawings: Drawing[], selectedId: string | null) {
    this.drawings = drawings;
    this.selectedId = selectedId;
    this.requestUpdate?.();
  }

  hit(x: number, y: number): string | null {
    this.view.update();
    let best: string | null = null;
    let bestDist = 10;
    for (const painted of this.view.items) {
      if (painted.kind === "rectangle") {
        const left = Math.min(painted.a.x, painted.b.x);
        const right = Math.max(painted.a.x, painted.b.x);
        const top = Math.min(painted.a.y, painted.b.y);
        const bottom = Math.max(painted.a.y, painted.b.y);
        if (x >= left && x <= right && y >= top && y <= bottom) best = painted.id;
        continue;
      }
      const dist = pointSegDist(x, y, painted.a.x, painted.a.y, painted.b.x, painted.b.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = painted.id;
      }
    }
    return best;
  }
}

function pointSegDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
