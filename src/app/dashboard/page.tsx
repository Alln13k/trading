"use client";

import { PROVIDER_ATTRIBUTION } from "@/lib/data/provider";
import { PageHeader } from "@/components/ui/page-header";
import { SessionBoard } from "@/components/dashboard/session-board";
import { CoreQuotes } from "@/components/dashboard/core-quotes";
import { WatchlistPanel } from "@/components/dashboard/watchlist-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { usePositionsStore } from "@/lib/stores/positions-store";
import { formatCurrency } from "@/lib/utils";
import { useSettingsStore } from "@/lib/stores/settings-store";

export default function OverviewPage() {
  const cash = usePortfolioStore((s) => s.cash);
  const initial = usePortfolioStore((s) => s.initialCapital);
  const positions = usePositionsStore((s) => s.positions);
  const currency = useSettingsStore((s) => s.settings.currency);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Overview"
        description="Paper-only terminal. Quotes are delayed or unavailable — never simulated as live."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Paper cash</CardDescription>
            <CardTitle className="text-lg tabular">{formatCurrency(cash, currency)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Starting capital</CardDescription>
            <CardTitle className="text-lg tabular">{formatCurrency(initial, currency)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Open paper positions</CardDescription>
            <CardTitle className="text-lg">{positions.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <SessionBoard />
      <CoreQuotes />
      <WatchlistPanel />

      <Card>
        <CardContent className="py-4 text-[12px] leading-relaxed text-secondary">
          {PROVIDER_ATTRIBUTION} Paper trading only. Not financial advice. Scenarios in later
          modules are not forecasts.
        </CardContent>
      </Card>
    </div>
  );
}
