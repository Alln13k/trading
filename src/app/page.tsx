import Link from "next/link";
import {
  ArrowRight,
  CandlestickChart,
  LineChart,
  NotebookPen,
  Users,
  Bell,
  BarChart3,
  Star,
  ShieldCheck,
  Zap,
  Wallet,
  TrendingUp,
  Sparkles,
  Globe,
} from "lucide-react";
import { Card } from "@/components/ui/card";

function LandingSparkline({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const color = up ? "#34d399" : "#fb7185";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-full">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const mockData = [
  { sym: "BTC", name: "Bitcoin", price: "98,012.44", chg: "+2.4%", up: true, d: [92, 91, 93, 95, 94, 96, 98, 97, 99, 101] },
  { sym: "ETH", name: "Ethereum", price: "3,462.80", chg: "+1.8%", up: true, d: [34, 33, 35, 34, 36, 37, 36, 38, 39, 41] },
  { sym: "EUR/USD", name: "Euro", price: "1.08452", chg: "+0.32%", up: true, d: [88, 87, 87.5, 88, 87.4, 88.2, 88.8, 89, 88.6, 89.4] },
  { sym: "GOLD", name: "Gold", price: "3,205.40", chg: "+0.9%", up: true, d: [77, 78, 77.5, 79, 80, 79.5, 81, 82, 81.5, 83] },
  { sym: "NVDA", name: "NVIDIA", price: "174.82", chg: "-1.2%", up: false, d: [95, 94, 95.5, 93, 92, 93, 91, 92, 90, 89.5] },
  { sym: "SPX", name: "S&P 500", price: "6,210.30", chg: "+0.6%", up: true, d: [70, 71, 70.5, 72, 71.5, 73, 74, 73.5, 75, 76] },
];

const FEATURES = [
  { icon: CandlestickChart, title: "Pro-grade charts", text: "Candles, 9 timeframes, 8 indicators and full drawing tools — the workspace you'd expect from a terminal, not a toy." },
  { icon: Wallet, title: "Paper trading", text: "Build a virtual portfolio, open positions with stop loss and take profit, and track every dollar without risk." },
  { icon: NotebookPen, title: "Trade journal", text: "Log every trade with strategy, emotions and screenshots. Watch your win rate, profit factor and best strategies improve." },
  { icon: Users, title: "Built for two", text: "Allan and Alex share the workspace: watchlists, charts, positions and activity feed — everything in sync." },
  { icon: Bell, title: "Smart alerts", text: "Price levels, RSI thresholds, EMA crosses. Get notified the moment your setup triggers — day or night." },
  { icon: ShieldCheck, title: "Paper trading", text: "Trade with real live market data on a simulated account — the market is real, the money is not." },
];

const STEPS = [
  { n: "01", title: "Watch the market", text: "Follow crypto, forex, stocks, indices and commodities with live quotes, sparklines and a market overview built for speed." },
  { n: "02", title: "Plan your trade", text: "Draw support and resistance, add your indicators, save chart layouts. Define entry, stop loss and take profit before anything else." },
  { n: "03", title: "Execute on paper", text: "Open positions in simulation, set your risk levels, and let the journal capture the full picture of every decision." },
  { n: "04", title: "Review and improve", text: "Win rate, average win vs loss, profit factor, best strategy. Data-backed decisions replace gut feelings." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg text-primary">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-accent shadow-[0_0_16px_rgba(99,102,241,0.5)]">
              <LineChart className="size-3.5 text-white" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              Nex<span className="text-gradient">Trade</span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-[13px] text-secondary md:flex">
            <a href="#features" className="transition-colors hover:text-primary">Features</a>
            <a href="#charts" className="transition-colors hover:text-primary">Charts</a>
            <a href="#journal" className="transition-colors hover:text-primary">Journal</a>
            <a href="#team" className="transition-colors hover:text-primary">Collaboration</a>
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex h-8.5 items-center gap-1.5 rounded-lg bg-gradient-accent px-4 text-[13px] font-medium text-white shadow-[0_1px_14px_rgba(99,102,241,0.4)] transition-all hover:brightness-110"
          >
            Launch app <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40">
        <div className="grid-bg absolute inset-0" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]" />
        <div className="pointer-events-none absolute top-40 right-0 h-[300px] w-[300px] rounded-full bg-violet/15 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-raised/60 px-3.5 py-1.5 text-[11px] text-secondary backdrop-blur animate-fade-in">
            <Sparkles className="size-3 text-warn" />
            A shared trading workspace for two people — paper trading, live market data
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl animate-slide-up">
            Your Market.
            <br />
            Your Strategy.
            <br />
            <span className="text-gradient">Your Edge.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-secondary md:text-base animate-slide-up">
            One platform to follow the markets, analyze charts, manage a paper portfolio
            and keep a sharp trade journal. Everything you need to learn, plan and
            improve — together.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-slide-up">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-accent px-6 text-sm font-semibold text-white shadow-[0_2px_24px_rgba(99,102,241,0.45)] transition-all hover:brightness-110"
            >
              Get Started <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-raised/60 px-6 text-sm font-medium text-primary transition-all hover:border-accent/50"
            >
              Explore Dashboard
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-muted">
            No signup, no credit card. Simulation mode — no real transactions.
          </p>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface/90 shadow-2xl shadow-black/50 backdrop-blur">
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
            <span className="size-2.5 rounded-full bg-down/70" />
            <span className="size-2.5 rounded-full bg-warn/70" />
            <span className="size-2.5 rounded-full bg-up/70" />
            <span className="ml-3 text-[11px] text-muted">app.nextrade.workspace — Dashboard</span>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-[220px_1fr]">
            <div className="hidden flex-col gap-1 rounded-xl border border-line bg-raised/40 p-3 lg:flex">
              {["Dashboard", "Markets", "Charts", "Watchlist", "Portfolio", "Positions", "Trade Journal", "Alerts", "Settings"].map((l, i) => (
                <span
                  key={l}
                  className={
                    i === 0
                      ? "rounded-md bg-accent-soft px-2.5 py-1.5 text-[11px] font-medium text-accent-bright"
                      : "rounded-md px-2.5 py-1.5 text-[11px] text-muted"
                  }
                >
                  {l}
                </span>
              ))}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { l: "Portfolio value", v: "$28,412.90", d: "+6.2%", up: true },
                  { l: "Day P&L", v: "+$184.20", d: "+0.65%", up: true },
                  { l: "Win rate", v: "64.3%", d: "14 trades", up: true },
                  { l: "Open positions", v: "3", d: "+$1,842", up: true },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-line bg-raised/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted">{s.l}</p>
                    <p className="mt-1 text-sm font-semibold tabular">{s.v}</p>
                    <p className={`text-[10px] font-medium ${s.up ? "text-up" : "text-down"}`}>{s.d}</p>
                  </div>
                ))}
              </div>
              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-secondary">Market Overview</p>
                  <span className="rounded-md bg-up-soft px-2 py-0.5 text-[10px] font-medium text-up">Live</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3">
                  {mockData.map((m) => (
                    <div key={m.sym} className="flex items-center gap-2.5">
                      <LandingSparkline data={m.d} up={m.up} />
                      <div className="w-20 shrink-0">
                        <p className="text-[11px] font-semibold">{m.sym}</p>
                        <p className="text-[10px] text-muted">{m.name}</p>
                        <p className={`text-[11px] font-medium tabular ${m.up ? "text-up" : "text-down"}`}>{m.chg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-4">
                <p className="mb-3 text-xs font-semibold text-secondary">Portfolio equity — 3 months</p>
                <svg viewBox="0 0 600 120" className="h-28 w-full">
                  <defs>
                    <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,90 C40,86 60,80 90,82 C130,84 150,70 180,68 C220,66 240,74 270,70 C310,65 330,52 360,48 C400,44 420,40 450,34 C490,27 520,30 560,18 C580,12 590,10 600,8 L600,120 L0,120 Z"
                    fill="url(#lg1)"
                  />
                  <path
                    d="M0,90 C40,86 60,80 90,82 C130,84 150,70 180,68 C220,66 240,74 270,70 C310,65 330,52 360,48 C400,44 420,40 450,34 C490,27 520,30 560,18 C580,12 590,10 600,8"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2"
                  />
                </svg>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-bright">The workspace</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            Everything a trader needs. Nothing they don&apos;t.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-secondary">
            Designed for two people learning the markets together — with the depth of a
            professional terminal and the clarity of a modern SaaS product.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-line bg-surface/80 p-5 transition-all duration-200 hover:border-accent/40 hover:bg-raised/60"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-bright transition-transform duration-200 group-hover:scale-105 [&>svg]:size-5">
                <f.icon />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="charts" className="border-y border-line bg-surface/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-bright">The workflow</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                From idea to edge, in four steps.
              </h2>
              <div className="mt-8 space-y-6">
                {STEPS.map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <span className="font-mono text-sm font-bold text-gradient">{s.n}</span>
                    <div>
                      <h3 className="text-sm font-semibold">{s.title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-secondary">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Card className="flex items-center gap-3 p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent-bright [&>svg]:size-4">
                  <CandlestickChart />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold">Charts</p>
                  <p className="text-[11px] text-muted">9 timeframes · 8 indicators · drawing tools</p>
                </div>
                <BarChart3 className="size-4 text-muted" />
              </Card>
              <Card className="flex items-center gap-3 p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-up-soft text-up [&>svg]:size-4">
                  <Wallet />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold">Paper portfolio</p>
                  <p className="text-[11px] text-muted">Holdings · P&L · allocation · equity curve</p>
                </div>
                <TrendingUp className="size-4 text-muted" />
              </Card>
              <Card className="flex items-center gap-3 p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-warn-soft text-warn [&>svg]:size-4">
                  <NotebookPen />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold">Trade journal</p>
                  <p className="text-[11px] text-muted">Win rate · profit factor · best strategy</p>
                </div>
                <Star className="size-4 text-muted" />
              </Card>
              <Card className="flex items-center gap-3 p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-down-soft text-down [&>svg]:size-4">
                  <Bell />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold">Alerts & news</p>
                  <p className="text-[11px] text-muted">Price, RSI, EMA cross · market headlines</p>
                </div>
                <Globe className="size-4 text-muted" />
              </Card>
              <Card className="flex items-center gap-3 p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent-bright [&>svg]:size-4">
                  <Users />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold">Shared workspace</p>
                  <p className="text-[11px] text-muted">Activity feed · shared watchlists · comments</p>
                </div>
                <Zap className="size-4 text-muted" />
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-bright">Built for two</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            Learn together, grow together.
          </h2>
          <p className="mt-3 text-sm text-secondary">
            NexTrade is designed as a two-person workspace from day one. Positions show
            who opened them, the feed shows what changed, and every journal entry is
            ready for a comment from your partner.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-line bg-surface/80 p-6">
          <div className="space-y-4">
            {[
              { who: "Allan", what: "opened a paper trade on BTC/USD (Long)", when: "2h ago" },
              { who: "Alex", what: "added Gold to Long Term watchlist", when: "5h ago" },
              { who: "Allan", what: "closed NVDA trade · +$412", when: "1d ago" },
              { who: "Alex", what: "created alert: BTC > 120,000", when: "1d ago" },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-raised/40 px-4 py-3">
                <span
                  className={`flex size-8 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                    e.who === "Allan" ? "bg-gradient-to-br from-indigo-500 to-violet-500" : "bg-gradient-to-br from-cyan-500 to-blue-500"
                  }`}
                >
                  {e.who.slice(0, 2).toUpperCase()}
                </span>
                <p className="flex-1 text-[13px] text-secondary">
                  <span className="font-semibold text-primary">{e.who}</span> {e.what}
                </p>
                <span className="text-[11px] text-muted">{e.when}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-line py-20">
        <div className="grid-bg absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[130px]" />
        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Start building your edge today.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-secondary">
            A complete, professional trading workspace — instantly, in your browser,
            on paper.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-accent px-6 text-sm font-semibold text-white shadow-[0_2px_24px_rgba(99,102,241,0.45)] transition-all hover:brightness-110"
            >
              Get Started <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard/charts"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-raised/60 px-6 text-sm font-medium text-primary transition-all hover:border-accent/50"
            >
              <CandlestickChart className="size-4" /> Open the charts
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-gradient-accent">
              <LineChart className="size-3 text-white" />
            </span>
            <span className="text-[13px] font-semibold">Nex<span className="text-gradient">Trade</span></span>
          </div>
          <p className="text-[11px] text-muted">
            Simulation platform · Live market data · Not financial advice · No real transactions
          </p>
          <p className="text-[11px] text-muted">© 2026 NexTrade Workspace</p>
        </div>
      </footer>
    </main>
  );
}