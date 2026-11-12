"use client";

import { useMemo, useState } from "react";
import { plannedR, portfolioHeat, positionSize } from "@/lib/risk";
import { openRisk, unrealized, usePaperStore } from "@/lib/stores/paper-store";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function RiskPage() {
  const [equity, setEquity] = useState("100000");
  const [riskPct, setRiskPct] = useState("0.5");
  const [entry, setEntry] = useState("1.08");
  const [stop, setStop] = useState("1.072");
  const [pv, setPv] = useState("1");
  const [target, setTarget] = useState("");
  const positions = usePaperStore((s) => s.positions);
  const cash = usePaperStore((s) => s.cash);
  const margin = usePaperStore((s) => s.margin);

  const result = useMemo(
    () =>
      positionSize({
        accountEquity: Number(equity),
        riskPercent: Number(riskPct),
        entry: Number(entry),
        stop: Number(stop),
        pointValue: Number(pv),
      }),
    [equity, riskPct, entry, stop, pv]
  );

  const rResult = useMemo(() => {
    if (!target.trim()) return null;
    return plannedR(Number(entry), Number(stop), Number(target));
  }, [entry, stop, target]);

  const heat = useMemo(() => {
    const equityNow = cash + margin + positions.reduce((a, p) => a + unrealized(p), 0);
    return portfolioHeat(equityNow, positions.map((p) => openRisk(p)));
  }, [cash, margin, positions]);

  return (
    <div>
      <PageHeader
        title="Risk Calculator"
        description="Position size from equity, risk %, and stop distance. Paper planning only — no orders are sent."
      />
      <Card>
        <CardHeader>
          <CardTitle>Size a paper trade</CardTitle>
          <CardDescription>Uses your numbers, not a price feed. Wrong inputs return an error instead of a guess.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="text-[12px] text-secondary">
            Account equity
            <Input className="mt-1" value={equity} onChange={(e) => setEquity(e.target.value)} />
          </label>
          <label className="text-[12px] text-secondary">
            Risk %
            <Input className="mt-1" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} />
          </label>
          <label className="text-[12px] text-secondary">
            Entry
            <Input className="mt-1" value={entry} onChange={(e) => setEntry(e.target.value)} />
          </label>
          <label className="text-[12px] text-secondary">
            Stop
            <Input className="mt-1" value={stop} onChange={(e) => setStop(e.target.value)} />
          </label>
          <label className="text-[12px] text-secondary">
            Point value
            <Input className="mt-1" value={pv} onChange={(e) => setPv(e.target.value)} />
          </label>
          <label className="text-[12px] text-secondary">
            Target (for R)
            <Input className="mt-1" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Optional" />
          </label>
          <div className="rounded-lg border border-line bg-raised/40 p-4 text-[13px]">
            {"error" in result ? (
              <p className="text-down">{result.error}</p>
            ) : (
              <ul className="space-y-1 text-secondary">
                <li>Risk amount (1R): <span className="text-primary tabular">{formatCurrency(result.riskAmount)}</span></li>
                <li>Stop distance: <span className="text-primary tabular">{result.stopDistance.toFixed(6)}</span></li>
                <li>Units: <span className="text-primary tabular">{result.units.toFixed(4)}</span></li>
                <li>Notional: <span className="text-primary tabular">{formatCurrency(result.notional)}</span></li>
                <li>
                  Planned R:{" "}
                  <span className="text-primary tabular">
                    {rResult === null ? "—" : "error" in rResult ? rResult.error : `${rResult.r.toFixed(2)}R`}
                  </span>
                </li>
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Portfolio heat</CardTitle>
          <CardDescription>
            Open paper risk (distance from entry to stop × size) divided by paper equity. Positions without a stop are left out.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-[13px] text-secondary">
          {"error" in heat ? (
            <p className="text-down">{heat.error}</p>
          ) : (
            <p data-testid="portfolio-heat">
              Open risk {formatCurrency(heat.openRisk)} is {formatPercent(heat.heat * 100, false)} of paper equity.
              {heat.unstopped > 0 ? ` ${heat.unstopped} open position${heat.unstopped === 1 ? "" : "s"} have no stop and are not in this heat.` : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
