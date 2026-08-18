"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Save,
  Trash2,
  FolderOpen,
  Volume2,
  Expand,
  Shrink,
  X,
} from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { TIMEFRAMES } from "@/lib/data/candleEngine";
import type { Timeframe } from "@/lib/types";
import type { Drawing, IndicatorConfig, IndicatorKind } from "@/lib/stores/chart-store";
import { useChartStore } from "@/lib/stores/chart-store";
import { useSettingsStore, useCurrentUser } from "@/lib/stores/settings-store";
import { useUiStore } from "@/lib/stores/ui-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useLiveQuotes } from "@/lib/hooks";
import { cn, formatPrice, formatPercent, formatCompact, uid } from "@/lib/utils";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from "@/components/ui/dropdown";
import { SymbolSearch } from "@/components/market/symbol-search";
import { WatchlistToggle } from "@/components/market/quote-row";
import { TradingChart } from "@/components/charts/trading-chart";

const INDICATOR_OPTIONS: Array<{ kind: IndicatorKind; label: string; defaultPeriod: number; pane: "main" | "secondary" }> = [
  { kind: "sma", label: "SMA — Simple Moving Average", defaultPeriod: 20, pane: "main" },
  { kind: "ema", label: "EMA — Exponential Moving Average", defaultPeriod: 20, pane: "main" },
  { kind: "rsi", label: "RSI — Relative Strength Index", defaultPeriod: 14, pane: "secondary" },
  { kind: "macd", label: "MACD — Moving Average Conv. Div.", defaultPeriod: 12, pane: "secondary" },
  { kind: "bollinger", label: "Bollinger Bands", defaultPeriod: 20, pane: "main" },
  { kind: "vwap", label: "VWAP — Volume Weighted Avg. Price", defaultPeriod: 0, pane: "main" },
  { kind: "stochastic", label: "Stochastic Oscillator", defaultPeriod: 14, pane: "secondary" },
  { kind: "atr", label: "ATR — Average True Range", defaultPeriod: 14, pane: "secondary" },
];

const PALETTE = ["#22d3ee", "#a78bfa", "#fbbf24", "#34d399", "#fb7185", "#818cf8"];

export default function ChartsPage() {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-xl border border-line bg-surface" />}>
      <ChartsInner />
    </Suspense>
  );
}

function ChartsInner() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("symbol");
  const uiSelected = useUiStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useUiStore((s) => s.setSelectedSymbol);

  const symbol = useMemo(() => {
    const candidate = requested && marketData.getSymbol(requested) ? requested : uiSelected;
    return candidate && marketData.getSymbol(candidate) ? candidate : "BTC";
  }, [requested, uiSelected]);

  useEffect(() => {
    setSelectedSymbol(symbol);
  }, [symbol, setSelectedSymbol]);

  const chartsSettings = useSettingsStore((s) => s.settings.charts);
  const [timeframe, setTimeframe] = useState<Timeframe>(chartsSettings.defaultTimeframe);
  const [chartType, setChartType] = useState<"candles" | "line" | "area">(chartsSettings.defaultChartType);
  const [showVolume, setShowVolume] = useState(chartsSettings.showVolume);
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { id: uid("ind"), kind: "ema", period: 20, color: "#22d3ee", pane: "main" },
    { id: uid("ind"), kind: "ema", period: 50, color: "#a78bfa", pane: "main" },
  ]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [tool, setTool] = useState<{ tool: "pointer" | Drawing["kind"]; color: string }>({
    tool: "pointer",
    color: "#22d3ee",
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [crosshair, setCrosshair] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    time: number;
    volume: number;
  } | null>(null);
  const [indicatorModal, setIndicatorModal] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [newIndKind, setNewIndKind] = useState<IndicatorKind>("ema");
  const [newIndPeriod, setNewIndPeriod] = useState(20);
  const [newIndColor, setNewIndColor] = useState("#22d3ee");
  const [layoutName, setLayoutName] = useState("");

  const quotes = useLiveQuotes([symbol]);
  const quote = quotes.get(symbol);
  const meta = marketData.getSymbol(symbol);

  const savedLayouts = useChartStore((s) => s.savedLayouts);
  const saveLayout = useChartStore((s) => s.saveLayout);
  const deleteLayout = useChartStore((s) => s.deleteLayout);
  const push = useToastStore((s) => s.push);
  const addEvent = useActivityStore((s) => s.addEvent);
  const currentUser = useCurrentUser();

  const meta2 = marketData.getSymbol(symbol);
  const spark = useMemo(() => marketData.getSparkline(symbol, 40), [symbol]);

  const commitDrawing = (d: Drawing) => {
    setDrawings((prev) => {
      const i = prev.findIndex((x) => x.id === d.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = d;
        return next;
      }
      return [...prev, d];
    });
  };

  const addIndicator = () => {
    const opt = INDICATOR_OPTIONS.find((o) => o.kind === newIndKind)!;
    setIndicators((prev) => [
      ...prev,
      { id: uid("ind"), kind: newIndKind, period: newIndPeriod, color: newIndColor, pane: opt.pane },
    ]);
    setIndicatorModal(false);
    push(`Added ${opt.label.split(" ")[0]}`, "success");
  };

  const saveCurrentLayout = () => {
    if (!layoutName.trim()) {
      push("Layout needs a name", "error");
      return;
    }
    saveLayout({
      name: layoutName.trim(),
      symbol,
      timeframe,
      chartType,
      indicators,
      drawings,
      showVolume,
      userId: currentUser.id,
      userName: currentUser.name,
    });
    setSaveModal(false);
    setLayoutName("");
    push("Chart layout saved", "success");
    addEvent({
      userName: currentUser.name,
      userId: currentUser.id,
      action: "saved chart layout",
      target: layoutName.trim(),
      kind: "chart",
    });
  };

  const up = (quote?.changePercent ?? 0) >= 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-full sm:w-72">
            <SymbolSearch
              large
              onSelect={(s) => {
                setSelectedSymbol(s);
                window.history.pushState(null, "", `/dashboard/charts?symbol=${s}`);
              }}
              placeholder="Search any asset…"
            />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <WatchlistToggle symbol={symbol} />
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-2xl font-bold tracking-tight text-primary tabular">
              {quote ? formatPrice(quote.price, Math.min(meta2?.decimals ?? 2, 4)) : "—"}
            </p>
            <p className={cn("text-[12px] font-medium tabular", up ? "text-up" : "text-down")}>
              {quote ? formatPercent(quote.changePercent) : "—"}
              <span className="ml-2 text-muted">· 24h vol {quote ? formatCompact(quote.volume) : "—"}</span>
            </p>
          </div>
          <MiniSpark data={spark} up={up} />
        </div>
      </div>

      {/* Toolbars */}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          size="sm"
          value={timeframe}
          onChange={setTimeframe}
          options={TIMEFRAMES.map((t) => ({ value: t, label: t }))}
        />
        <div className="mx-1 h-6 w-px bg-line" />
        <Segmented
          size="sm"
          value={chartType}
          onChange={setChartType}
          options={[
            { value: "candles", label: "Candles" },
            { value: "line", label: "Line" },
            { value: "area", label: "Area" },
          ]}
        />
        <button
          className={cn("chart-toolbar-btn", showVolume && "chart-toolbar-btn-active")}
          onClick={() => setShowVolume(!showVolume)}
          title="Toggle volume"
        >
          <Volume2 className="size-3.5" /> Vol
        </button>
        <button className="chart-toolbar-btn" onClick={() => setIndicatorModal(true)}>
          <Plus className="size-3.5" /> Indicators
        </button>
        <button className="chart-toolbar-btn" onClick={() => setSaveModal(true)}>
          <Save className="size-3.5" /> Save layout
        </button>
        <Dropdown
          trigger={
            <button className="chart-toolbar-btn">
              <FolderOpen className="size-3.5" /> Layouts
            </button>
          }
        >
          <DropdownHeader>Saved layouts</DropdownHeader>
          <div className="max-h-64 overflow-y-auto">
            {savedLayouts.length === 0 && (
              <p className="px-3 py-4 text-center text-[11px] text-muted">No saved layouts yet</p>
            )}
            {savedLayouts.map((l) => (
              <DropdownItem
                key={l.id}
                onClick={() => {
                  setTimeframe(l.timeframe);
                  setChartType(l.chartType);
                  setIndicators(l.indicators);
                  setDrawings(l.drawings);
                  setShowVolume(l.showVolume);
                  setSelectedSymbol(l.symbol);
                  window.history.pushState(null, "", `/dashboard/charts?symbol=${l.symbol}`);
                  push(`Loaded “${l.name}”`, "success");
                }}
              >
                <FolderOpen className="size-3.5 text-muted" />
                <span className="flex-1">
                  {l.name}
                  <span className="block text-[10px] text-muted">
                    {l.symbol} · {l.timeframe} · by {l.userName}
                  </span>
                </span>
                <button
                  className="text-muted hover:text-down"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayout(l.id);
                    push("Layout deleted", "info");
                  }}
                >
                  <Trash2 className="size-3" />
                </button>
              </DropdownItem>
            ))}
          </div>
          <DropdownDivider />
          <DropdownItem onClick={() => setDrawings([])}>
            <Trash2 className="size-3.5" /> Clear drawings
          </DropdownItem>
        </Dropdown>
        <div className="flex-1" />
        <button
          className="chart-toolbar-btn"
          onClick={() => setFullscreen(!fullscreen)}
          title="Fullscreen (F)"
        >
          {fullscreen ? <Shrink className="size-3.5" /> : <Expand className="size-3.5" />}
          {fullscreen ? "Exit" : "Fullscreen"}
        </button>
      </div>

      {/* Active indicators chips */}
      {indicators.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {indicators.map((ind) => {
            const opt = INDICATOR_OPTIONS.find((o) => o.kind === ind.kind);
            return (
              <span
                key={ind.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-raised/60 px-2 py-1 text-[11px] text-secondary"
              >
                <span className="size-2 rounded-full" style={{ background: ind.color }} />
                {opt?.label.split(" ")[0]}
                {ind.period > 0 && <span className="text-muted">({ind.period})</span>}
                <button
                  onClick={() => setIndicators((prev) => prev.filter((x) => x.id !== ind.id))}
                  className="text-muted transition-colors hover:text-down"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <TradingChart
        symbol={symbol}
        timeframe={timeframe}
        chartType={chartType}
        indicators={indicators}
        drawings={drawings}
        showVolume={showVolume}
        tool={tool}
        onToolChange={setTool}
        onCommitDrawing={commitDrawing}
        onDeleteDrawing={(id) => setDrawings((prev) => prev.filter((d) => d.id !== id))}
        onClearDrawings={() => setDrawings([])}
        onCrosshair={setCrosshair}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen(!fullscreen)}
      />

      {/* Legend */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2.5 text-[12px] tabular">
          <LegendItem label="Open" value={crosshair ? formatPrice(crosshair.open, meta?.decimals) : "—"} />
          <LegendItem label="High" value={crosshair ? formatPrice(crosshair.high, meta?.decimals) : "—"} />
          <LegendItem label="Low" value={crosshair ? formatPrice(crosshair.low, meta?.decimals) : "—"} />
          <LegendItem
            label="Close"
            value={crosshair ? formatPrice(crosshair.close, meta?.decimals) : "—"}
            tone={crosshair && crosshair.close >= crosshair.open ? "up" : crosshair && crosshair.close < crosshair.open ? "down" : undefined}
          />
          <LegendItem label="Volume" value={crosshair ? formatCompact(crosshair.volume) : "—"} />
          <span className="ml-auto text-[11px] text-muted">
            {crosshair
              ? new Date(crosshair.time * 1000).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Move the crosshair for details"}
          </span>
        </CardContent>
      </Card>

      {/* Indicator modal */}
      <Modal
        open={indicatorModal}
        onClose={() => setIndicatorModal(false)}
        title="Add indicator"
        description="Multiple indicators can be added at once. Secondary indicators render in a separate pane."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Indicator</label>
            <Select
              value={newIndKind}
              onChange={(e) => {
                const kind = e.target.value as IndicatorKind;
                setNewIndKind(kind);
                setNewIndPeriod(INDICATOR_OPTIONS.find((o) => o.kind === kind)?.defaultPeriod ?? 14);
              }}
            >
              {INDICATOR_OPTIONS.map((o) => (
                <option key={o.kind} value={o.kind}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Period</label>
              <Input
                type="number"
                min={1}
                max={500}
                value={newIndPeriod || ""}
                disabled={newIndKind === "vwap"}
                onChange={(e) => setNewIndPeriod(parseInt(e.target.value || "0", 10))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Color</label>
              <div className="flex h-9 items-center gap-2 rounded-lg border border-line bg-raised/60 px-2.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewIndColor(c)}
                    className={cn(
                      "size-4.5 rounded-full transition-transform",
                      newIndColor === c && "scale-125 ring-2 ring-white/40"
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIndicatorModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={addIndicator}>
              <Plus className="size-3.5" /> Add indicator
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save layout modal */}
      <Modal
        open={saveModal}
        onClose={() => setSaveModal(false)}
        title="Save chart layout"
        description="Your indicators, drawings, timeframe and chart type will be saved."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Layout name</label>
            <Input
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder={`${symbol} ${timeframe} setup`}
              onKeyDown={(e) => e.key === "Enter" && saveCurrentLayout()}
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-raised/40 px-3 py-2 text-[11px] text-secondary">
            <Badge variant="accent">{symbol}</Badge>
            <Badge variant="default">{timeframe}</Badge>
            <Badge variant="default">{indicators.length} indicators</Badge>
            <Badge variant="default">{drawings.length} drawings</Badge>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSaveModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveCurrentLayout}>
              <Save className="size-3.5" /> Save layout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function LegendItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <span
        className={cn(
          "font-medium text-primary",
          tone === "up" && "text-up",
          tone === "down" && "text-down"
        )}
      >
        {value}
      </span>
    </span>
  );
}

function MiniSpark({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 72;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const color = up ? "#34d399" : "#fb7185";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="hidden h-8 w-18 sm:block">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}