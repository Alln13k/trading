"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  createTextWatermark,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle, Timeframe } from "@/lib/types";
import type { IndicatorConfig, Drawing, DrawingKind } from "@/lib/stores/chart-store";
import { marketData } from "@/lib/data/provider";
import { TIMEFRAME_SECONDS } from "@/lib/data/candleEngine";
import {
  sma,
  ema,
  rsi,
  macd,
  bollinger,
  vwap,
  stochastic,
  atr,
  type SeriesPoint,
} from "@/lib/indicators";
import { cn, uid } from "@/lib/utils";
import { useMarketVersion } from "@/lib/hooks";
import { useUiStore } from "@/lib/stores/ui-store";
import {
  MousePointer2,
  Minus,
  MoveVertical,
  TrendingUp,
  Square,
  GitCompareArrows,
  Layers,
  Trash2,
} from "lucide-react";

export interface ToolConfig {
  tool: "pointer" | DrawingKind;
  color: string;
}

const DRAW_COLORS = ["#22d3ee", "#a78bfa", "#fbbf24", "#34d399", "#fb7185"];

const TOOL_ICONS: Record<string, { icon: typeof Minus; label: string }> = {
  pointer: { icon: MousePointer2, label: "Select" },
  horizontal: { icon: Minus, label: "Horizontal line" },
  vertical: { icon: MoveVertical, label: "Vertical line" },
  trendline: { icon: TrendingUp, label: "Trend line" },
  rectangle: { icon: Square, label: "Rectangle" },
  fibonacci: { icon: GitCompareArrows, label: "Fibonacci" },
  zone: { icon: Layers, label: "Zone" },
};

interface ChartProps {
  symbol: string;
  timeframe: Timeframe;
  chartType: "candles" | "line" | "area";
  indicators: IndicatorConfig[];
  drawings: Drawing[];
  showVolume: boolean;
  tool: ToolConfig;
  onToolChange: (t: ToolConfig) => void;
  onCommitDrawing: (d: Drawing) => void;
  onDeleteDrawing: (id: string) => void;
  onClearDrawings: () => void;
  onCrosshair: (bar: { open: number; high: number; low: number; close: number; time: number; volume: number } | null) => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  demoWatermark?: boolean;
}

interface PaneRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function TradingChart({
  symbol,
  timeframe,
  chartType,
  indicators,
  drawings,
  showVolume,
  tool,
  onToolChange,
  onCommitDrawing,
  onDeleteDrawing,
  onClearDrawings,
  onCrosshair,
  fullscreen,
  onToggleFullscreen,
  demoWatermark = true,
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorSeriesRef = useRef<
    Array<{ id: string; series: ISeriesApi<"Line" | "Histogram"> }>
  >([]);
  const crosshairBarRef = useRef<{ open: number; high: number; low: number; close: number; time: number; volume: number } | null>(null);
  const [paneRect, setPaneRect] = useState<PaneRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Drawing | null>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    startTime: number;
    startPrice: number;
    baseTime: number;
    basePrice: number;
  } | null>(null);
  const paneRectRef = useRef(paneRect);
  const demoMode = useUiStore((s) => s.demoMode);
  const showWatermark = demoWatermark && demoMode;
  const watermarkText = demoMode ? "DEMO DATA" : "LIVE DATA";

  const marketVersion = useMarketVersion();

  const candles = useMemo(
    () => marketData.getCandles(symbol, timeframe, 420),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [symbol, timeframe, marketVersion]
  );

  useEffect(() => {
    void marketData.getCandlesAsync?.(symbol, timeframe, 420);
  }, [symbol, timeframe]);

  useEffect(() => {
    paneRectRef.current = paneRect;
  }, [paneRect]);

  const updatePaneRect = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ts = chart.timeScale();
    const w = ts.width();
    const h = chart.panes()[0]?.getHeight() ?? 0;
    setPaneRect((prev) =>
      prev.x === 0 && prev.y === 0 && prev.w === w && prev.h === h
        ? prev
        : { x: 0, y: 0, w, h }
    );
  }, []);

  // ---- chart lifecycle ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#0b0d15" },
        textColor: "#5e6882",
        fontSize: 11,
        fontFamily: "Geist, ui-sans-serif, system-ui",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.05)" },
        horzLines: { color: "rgba(148,163,184,0.05)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(148,163,184,0.35)",
          labelBackgroundColor: "#6366f1",
          style: 2,
        },
        horzLine: {
          color: "rgba(148,163,184,0.35)",
          labelBackgroundColor: "#6366f1",
          style: 2,
        },
      },
      rightPriceScale: { borderColor: "rgba(148,163,184,0.15)" },
      timeScale: {
        borderColor: "rgba(148,163,184,0.15)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 8,
      },
    });
    chartRef.current = chart;

    if (showWatermark) {
      try {
        const pane = chart.panes()[0];
        createTextWatermark(pane, {
          horzAlign: "center",
          vertAlign: "center",
          lines: [
            {
              text: watermarkText,
              color: "rgba(148,163,184,0.07)",
              fontSize: 42,
              fontStyle: "bold",
            },
          ],
        });
      } catch {
        // ignore
      }
    }

    chart.subscribeCrosshairMove((param) => {
      const data = param.seriesData.get(mainSeriesRef.current as ISeriesApi<"Candlestick">) as
        | { open: number; high: number; low: number; close: number }
        | undefined;
      const volData = param.seriesData.get(volumeSeriesRef.current as ISeriesApi<"Histogram">) as
        | { value: number }
        | undefined;
      if (data && param.time !== undefined) {
        const bar = {
          ...data,
          time: param.time as number,
          volume: volData?.value ?? 0,
        };
        crosshairBarRef.current = bar;
        onCrosshair(bar);
      } else {
        crosshairBarRef.current = null;
        onCrosshair(null);
      }
    });

    const ro = new ResizeObserver(() => updatePaneRect());
    ro.observe(container);
    updatePaneRect();

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe, chartType]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const onRange = () => {
      setPaneRect((prev) => {
        const ts = chart.timeScale();
        const w = ts.width();
        const h = chart.panes()[0]?.getHeight() ?? 0;
        return prev.w === w && prev.h === h ? prev : { ...prev, w, h };
      });
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRange);
    const onCrosshair = () => {
      // no-op: keep subscription alive for redraw triggers
    };
    chart.subscribeCrosshairMove(onCrosshair);
    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRange);
      chart.unsubscribeCrosshairMove(onCrosshair);
    };
  }, []);

  const addIndicator = useCallback((chart: IChartApi, ind: IndicatorConfig, candlesData: Candle[]) => {
    function px(p: SeriesPoint) {
      return { time: p.time as UTCTimestamp, value: p.value };
    }
    const base = {
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    };
    if (ind.pane === "secondary") {
      let panes = chart.panes();
      if (panes.length < 2) {
        chart.addPane(true);
        panes = chart.panes();
      }
      const secPane = panes[1];
      secPane.setHeight(110);
      if (ind.kind === "rsi") {
        const s = chart.addSeries(LineSeries, { ...base, color: ind.color, lineWidth: 2 });
        s.setData(rsi(candlesData, ind.period || 14).map(px));
        s.createPriceLine({ price: 70, color: "rgba(251,113,133,0.45)", lineWidth: 1, lineStyle: 2, axisLabelVisible: false });
        s.createPriceLine({ price: 30, color: "rgba(52,211,153,0.45)", lineWidth: 1, lineStyle: 2, axisLabelVisible: false });
        s.createPriceLine({ price: 50, color: "rgba(148,163,184,0.25)", lineWidth: 1, lineStyle: 3, axisLabelVisible: false });
        s.moveToPane(1);
        indicatorSeriesRef.current.push({ id: ind.id, series: s });
        return;
      }
      if (ind.kind === "stochastic") {
        const st = stochastic(candlesData, ind.period || 14);
        const k = chart.addSeries(LineSeries, { ...base, color: ind.color, lineWidth: 1 });
        k.setData(st.k.map(px));
        const d = chart.addSeries(LineSeries, { ...base, color: "#22d3ee", lineWidth: 1 });
        d.setData(st.d.map(px));
        k.moveToPane(1);
        d.moveToPane(1);
        indicatorSeriesRef.current.push({ id: ind.id, series: k }, { id: `${ind.id}-d`, series: d });
        return;
      }
      if (ind.kind === "macd") {
        const m = macd(candlesData);
        const line = chart.addSeries(LineSeries, { ...base, color: "#818cf8", lineWidth: 2 });
        line.setData(m.macd.map(px));
        const signal = chart.addSeries(LineSeries, { ...base, color: "#fbbf24", lineWidth: 1 });
        signal.setData(m.signal.map(px));
        const hist = chart.addSeries(HistogramSeries, {
          ...base,
          priceScaleId: "right",
          priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
        });
        hist.setData(
          m.histogram.map((p) => ({
            time: p.time as UTCTimestamp,
            value: p.value,
            color: p.value >= 0 ? "rgba(129,140,248,0.55)" : "rgba(251,191,36,0.55)",
          }))
        );
        line.moveToPane(1);
        signal.moveToPane(1);
        hist.moveToPane(1);
        indicatorSeriesRef.current.push(
          { id: ind.id, series: line },
          { id: `${ind.id}-sig`, series: signal },
          { id: `${ind.id}-hist`, series: hist }
        );
        return;
      }
      if (ind.kind === "atr") {
        const s = chart.addSeries(LineSeries, { ...base, color: ind.color, lineWidth: 1 });
        s.setData(atr(candlesData, ind.period || 14).map(px));
        s.moveToPane(1);
        indicatorSeriesRef.current.push({ id: ind.id, series: s });
        return;
      }
    } else {
      if (ind.kind === "sma") {
        const s = chart.addSeries(LineSeries, { ...base, color: ind.color, lineWidth: 1 });
        s.setData(sma(candlesData, ind.period || 20).map(px));
        indicatorSeriesRef.current.push({ id: ind.id, series: s });
      } else if (ind.kind === "ema") {
        const s = chart.addSeries(LineSeries, { ...base, color: ind.color, lineWidth: 1 });
        s.setData(ema(candlesData, ind.period || 20).map(px));
        indicatorSeriesRef.current.push({ id: ind.id, series: s });
      } else if (ind.kind === "vwap") {
        const s = chart.addSeries(LineSeries, { ...base, color: ind.color, lineWidth: 1, lineStyle: 4 });
        s.setData(vwap(candlesData).map(px));
        indicatorSeriesRef.current.push({ id: ind.id, series: s });
      } else if (ind.kind === "bollinger") {
        const b = bollinger(candlesData, ind.period || 20);
        const mid = chart.addSeries(LineSeries, { ...base, color: ind.color, lineWidth: 1 });
        mid.setData(b.middle.map(px));
        const up = chart.addSeries(LineSeries, { ...base, color: ind.color + "88", lineWidth: 1, lineStyle: 2 });
        up.setData(b.upper.map(px));
        const low = chart.addSeries(LineSeries, { ...base, color: ind.color + "88", lineWidth: 1, lineStyle: 2 });
        low.setData(b.lower.map(px));
        indicatorSeriesRef.current.push(
          { id: ind.id, series: mid },
          { id: `${ind.id}-up`, series: up },
          { id: `${ind.id}-low`, series: low }
        );
      }
    }
  }, []);
  // ---- main series ----
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (mainSeriesRef.current) chart.removeSeries(mainSeriesRef.current);
    indicatorSeriesRef.current.forEach((s) => chart.removeSeries(s.series));
    indicatorSeriesRef.current = [];
    if (volumeSeriesRef.current) chart.removeSeries(volumeSeriesRef.current);
    volumeSeriesRef.current = null;
    const panes = chart.panes();
    for (let i = panes.length - 1; i > 0; i--) chart.removePane(i);

    const meta = marketData.getSymbol(symbol);
    const decimals = Math.min(meta?.decimals ?? 2, 5);

    let main: ISeriesApi<"Candlestick" | "Line" | "Area">;
    if (chartType === "candles") {
      main = chart.addSeries(CandlestickSeries, {
        upColor: "#34d399",
        downColor: "#fb7185",
        borderVisible: false,
        wickUpColor: "#34d399",
        wickDownColor: "#fb7185",
        priceFormat: { type: "price", precision: decimals, minMove: 1 / Math.pow(10, decimals) },
      });
      const data = candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      main.setData(data);
    } else if (chartType === "line") {
      main = chart.addSeries(LineSeries, {
        color: "#818cf8",
        lineWidth: 2,
        priceFormat: { type: "price", precision: decimals, minMove: 1 / Math.pow(10, decimals) },
      });
      main.setData(
        candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.close }))
      );
    } else {
      main = chart.addSeries(AreaSeries, {
        lineColor: "#818cf8",
        topColor: "rgba(99,102,241,0.32)",
        bottomColor: "rgba(99,102,241,0.02)",
        lineWidth: 2,
        priceFormat: { type: "price", precision: decimals, minMove: 1 / Math.pow(10, decimals) },
      });
      main.setData(
        candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.close }))
      );
    }
    mainSeriesRef.current = main;

    if (showVolume) {
      const vol = chart.addSeries(HistogramSeries, {
        priceScaleId: "",
        priceFormat: { type: "volume" },
        lastValueVisible: false,
        priceLineVisible: false,
      });
      vol.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? "rgba(52,211,153,0.28)" : "rgba(251,113,133,0.28)",
        }))
      );
      chart.priceScale("").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volumeSeriesRef.current = vol;
    }

    // rebuild indicators
    for (const ind of indicators) {
      addIndicator(chart, ind, candles);
    }

    chart.timeScale().fitContent();
    const interval = TIMEFRAME_SECONDS[timeframe];
    if (interval <= 3600) {
      chart.timeScale().setVisibleLogicalRange({ from: candles.length - 130, to: candles.length + 4 });
    }
    updatePaneRect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, chartType, showVolume]);

  // ---- indicators only change ----
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    for (const s of indicatorSeriesRef.current) chart.removeSeries(s.series);
    indicatorSeriesRef.current = [];
    for (const ind of indicators) addIndicator(chart, ind, candles);
    updatePaneRect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicators]);


  // ---- coordinate helpers ----
  const toXY = useCallback((time: number, price: number) => {
    const chart = chartRef.current;
    const main = mainSeriesRef.current;
    if (!chart || !main) return null;
    const x = chart.timeScale().timeToCoordinate(time as UTCTimestamp);
    const y = main.priceToCoordinate(price);
    if (x === null || y === null) return null;
    return { x, y };
  }, []);

  const toTP = useCallback((x: number, y: number) => {
    const chart = chartRef.current;
    const main = mainSeriesRef.current;
    if (!chart || !main) return null;
    const t = chart.timeScale().coordinateToTime(x);
    const p = main.coordinateToPrice(y);
    if (t === null || p === null) return null;
    return { time: t as number, price: p };
  }, []);

  // ---- drawing interactions ----
  const onOverlayPointerDown = (e: React.PointerEvent) => {
    if (tool.tool !== "pointer") {
      const tp = toTP(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      if (!tp) return;
      const d: Drawing = {
        id: uid("dr"),
        kind: tool.tool,
        startTime: tp.time,
        endTime: tp.time,
        startPrice: tp.price,
        endPrice: tp.price,
        color: tool.color,
      };
      setDraft(d);
      return;
    }
    // pointer: select drawing under cursor
    const hit = hitTest(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    if (hit) {
      setSelectedDrawing(hit.id);
      const tp = toTP(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      if (tp) {
        setDragState({ id: hit.id, startTime: tp.time, startPrice: tp.price, baseTime: hit.startTime, basePrice: hit.startPrice });
      }
    } else {
      setSelectedDrawing(null);
    }
  };

  const onOverlayPointerMove = (e: React.PointerEvent) => {
    if (draft) {
      const tp = toTP(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      if (!tp) return;
      setDraft({ ...draft, endTime: tp.time, endPrice: tp.price });
    }
    if (dragState) {
      const tp = toTP(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      if (!tp) return;
      const dt = tp.time - dragState.startTime;
      const dp = tp.price - dragState.startPrice;
      onMoveDrawing(dragState.id, dragState.baseTime + dt, dragState.basePrice + dp);
    }
  };

  const onOverlayPointerUp = () => {
    if (draft) {
      const dist = Math.abs(draft.endTime - draft.startTime) + Math.abs(draft.endPrice - draft.startPrice);
      if (dist > 1e-9) {
        onCommitDrawing(draft);
      }
      setDraft(null);
    }
    setDragState(null);
  };

  const onMoveDrawing = (id: string, startTime: number, startPrice: number) => {
    const d = drawings.find((x) => x.id === id);
    if (!d) return;
    const dt = startTime - d.startTime;
    const dp = startPrice - d.startPrice;
    onCommitDrawing({ ...d, startTime, endTime: d.endTime + dt, startPrice, endPrice: d.endPrice + dp });
  };

  const hitTest = (x: number, y: number): Drawing | null => {
    let best: Drawing | null = null;
    let bestDist = 12;
    for (const d of drawings) {
      if (d.kind === "horizontal" || d.kind === "vertical" || d.kind === "trendline" || d.kind === "fibonacci") {
        const a = toXY(d.startTime, d.startPrice);
        const b = toXY(d.endTime, d.endPrice);
        if (a && b) {
          const d1 = pointSegDist(x, y, a.x, a.y, b.x, b.y);
          if (d1 < bestDist) {
            bestDist = d1;
            best = d;
          }
        }
      } else {
        const a = toXY(d.startTime, Math.max(d.startPrice, d.endPrice));
        const b = toXY(d.endTime, Math.min(d.startPrice, d.endPrice));
        if (a && b && x >= Math.min(a.x, b.x) - 6 && x <= Math.max(a.x, b.x) + 6 && y >= Math.min(a.y, b.y) - 6 && y <= Math.max(a.y, b.y) + 6) {
          best = d;
          break;
        }
      }
    }
    return best;
  };

  const handleKey = (e: KeyboardEvent) => {
    if ((e.key === "Delete" || e.key === "Backspace") && selectedDrawing) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      onDeleteDrawing(selectedDrawing);
      setSelectedDrawing(null);
    }
    if (e.key === "f" || e.key === "F") {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      onToggleFullscreen();
    }
    if (e.key === "Escape") {
      setSelectedDrawing(null);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDrawing, drawings, onDeleteDrawing, onToggleFullscreen]);

  const overlayVisible = paneRect.w > 0 && paneRect.h > 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-line bg-surface",
        fullscreen && "fixed inset-0 z-[85] rounded-none border-0"
      )}
    >
      <div ref={containerRef} className="h-[62vh] min-h-[380px] w-full md:h-[68vh]" />
      {overlayVisible && (
        <svg
          className="absolute cursor-crosshair select-none"
          style={{ left: paneRect.x, top: paneRect.y, width: paneRect.w, height: paneRect.h }}
          onPointerDown={onOverlayPointerDown}
          onPointerMove={onOverlayPointerMove}
          onPointerUp={onOverlayPointerUp}
        >
          {drawings.map((d) => (
            <DrawingShape
              key={d.id}
              drawing={d}
              toXY={toXY}
              selected={selectedDrawing === d.id}
              onSelect={() => setSelectedDrawing(d.id)}
            />
          ))}
          {draft && <DraftShape drawing={draft} toXY={toXY} />}
        </svg>
      )}
      {tool.tool !== "pointer" && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg border border-line bg-overlay/95 px-3 py-1.5 text-[11px] text-secondary backdrop-blur">
          Drawing: {TOOL_ICONS[tool.tool].label} â€” click & drag on the chart
        </div>
      )}
      {/* Toolbar */}
      <div className="absolute right-2 top-2 flex flex-col gap-1 rounded-xl border border-line bg-overlay/90 p-1 backdrop-blur">
        {(Object.keys(TOOL_ICONS) as Array<"pointer" | DrawingKind>).map((t) => {
          const Icon = TOOL_ICONS[t].icon;
          return (
            <button
              key={t}
              title={TOOL_ICONS[t].label}
              onClick={() => onToolChange({ tool: t, color: tool.color })}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors [&>svg]:size-3.5",
                tool.tool === t
                  ? "bg-accent-soft text-accent-bright"
                  : "text-muted hover:bg-raised hover:text-primary"
              )}
            >
              <Icon />
            </button>
          );
        })}
        <div className="my-0.5 h-px bg-line" />
        {DRAW_COLORS.map((c) => (
          <button
            key={c}
            title="Drawing color"
            onClick={() => onToolChange({ tool: tool.tool, color: c })}
            className={cn(
              "mx-auto size-3.5 rounded-full transition-transform",
              tool.color === c && "scale-125 ring-2 ring-white/40"
            )}
            style={{ background: c }}
          />
        ))}
        <div className="my-0.5 h-px bg-line" />
        <button
          title="Delete selected drawing"
          disabled={!selectedDrawing}
          onClick={() => {
            if (selectedDrawing) onDeleteDrawing(selectedDrawing);
            setSelectedDrawing(null);
          }}
          className="flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-down/15 hover:text-down disabled:opacity-30 [&>svg]:size-3.5"
        >
          <Trash2 />
        </button>
        <button
          title="Clear all drawings"
          onClick={onClearDrawings}
          className="flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-primary [&>svg]:size-3.5"
        >
          <Trash2 />
        </button>
      </div>
    </div>
  );
}

function pointSegDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function DrawingShape({
  drawing: d,
  toXY,
  selected,
  onSelect,
}: {
  drawing: Drawing;
  toXY: (t: number, p: number) => { x: number; y: number } | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const color = d.color;
  const stroke = selected ? "#ffffff" : color;
  const sw = selected ? 1.8 : 1.2;

  if (d.kind === "horizontal") {
    const a = toXY(d.startTime, d.startPrice);
    const b = toXY(d.endTime, d.endPrice);
    if (!a || !b) return null;
    return (
      <g onPointerDown={(e) => { e.stopPropagation(); onSelect(); }}>
        <line x1={0} y1={a.y} x2={10000} y2={a.y} stroke={stroke} strokeWidth={sw} strokeDasharray={d.kind === "horizontal" ? "6 4" : undefined} />
        <text x={8} y={a.y - 5} fill={color} fontSize={10} fontWeight={600}>
          {d.startPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </text>
      </g>
    );
  }
  if (d.kind === "vertical") {
    const a = toXY(d.startTime, d.startPrice);
    if (!a) return null;
    return (
      <g onPointerDown={(e) => { e.stopPropagation(); onSelect(); }}>
        <line x1={a.x} y1={0} x2={a.x} y2={10000} stroke={stroke} strokeWidth={sw} strokeDasharray="6 4" />
      </g>
    );
  }
  if (d.kind === "trendline") {
    const a = toXY(d.startTime, d.startPrice);
    const b = toXY(d.endTime, d.endPrice);
    if (!a || !b) return null;
    return (
      <g onPointerDown={(e) => { e.stopPropagation(); onSelect(); }}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={sw} />
        <circle cx={a.x} cy={a.y} r={3} fill={color} />
        <circle cx={b.x} cy={b.y} r={3} fill={color} />
      </g>
    );
  }
  if (d.kind === "rectangle" || d.kind === "zone") {
    const a = toXY(d.startTime, Math.max(d.startPrice, d.endPrice));
    const b = toXY(d.endTime, Math.min(d.startPrice, d.endPrice));
    if (!a || !b) return null;
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);
    return (
      <g onPointerDown={(e) => { e.stopPropagation(); onSelect(); }}>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill={d.kind === "zone" ? `${color}18` : `${color}10`}
          stroke={stroke}
          strokeWidth={sw}
          strokeDasharray={d.kind === "zone" ? "5 3" : undefined}
        />
        {d.label && (
          <text x={x + 4} y={y - 5} fill={color} fontSize={10} fontWeight={600}>
            {d.label}
          </text>
        )}
      </g>
    );
  }
  if (d.kind === "fibonacci") {
    const a = toXY(d.startTime, d.startPrice);
    const b = toXY(d.endTime, d.endPrice);
    if (!a || !b) return null;
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const p0 = d.startPrice;
    const p1 = d.endPrice;
    return (
      <g onPointerDown={(e) => { e.stopPropagation(); onSelect(); }}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={0.8} strokeDasharray="4 3" />
        {levels.map((lv) => {
          const price = p0 + (p1 - p0) * lv;
          const pt = toXY(d.endTime, price);
          if (!pt) return null;
          return (
            <g key={lv}>
              <line x1={0} y1={pt.y} x2={10000} y2={pt.y} stroke={color} strokeWidth={0.6} strokeDasharray="3 4" opacity={0.8} />
              <text x={8} y={pt.y - 3} fill={color} fontSize={9} fontWeight={600}>
                {`${(lv * 100).toFixed(lv === 0.236 || lv === 0.786 ? 1 : 0)}%`}
              </text>
            </g>
          );
        })}
      </g>
    );
  }
  return null;
}

function DraftShape({ drawing: d, toXY }: { drawing: Drawing; toXY: (t: number, p: number) => { x: number; y: number } | null }) {
  return (
    <g opacity={0.75} pointerEvents="none">
      <DrawingShape drawing={d} toXY={toXY} selected={false} onSelect={() => {}} />
    </g>
  );
}
