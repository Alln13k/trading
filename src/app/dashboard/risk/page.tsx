"use client";

import { useMemo, useState } from "react";
import { positionSize } from "@/lib/risk";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export default function RiskPage() {
  const [equity, setEquity] = useState("100000");
  const [riskPct, setRiskPct] = useState("0.5");
  const [entry, setEntry] = useState("1.08");
  const [stop, setStop] = useState("1.072");
  const [pv, setPv] = useState("1");

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
          <div className="rounded-lg border border-line bg-raised/40 p-4 text-[13px]">
            {"error" in result ? (
              <p className="text-down">{result.error}</p>
            ) : (
              <ul className="space-y-1 text-secondary">
                <li>Risk amount: <span className="text-primary tabular">{formatCurrency(result.riskAmount)}</span></li>
                <li>Stop distance: <span className="text-primary tabular">{result.stopDistance.toFixed(6)}</span></li>
                <li>Units: <span className="text-primary tabular">{result.units.toFixed(4)}</span></li>
                <li>Notional: <span className="text-primary tabular">{formatCurrency(result.notional)}</span></li>
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
