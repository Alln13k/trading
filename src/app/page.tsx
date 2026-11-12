import Link from "next/link";
import { ArrowRight, LineChart } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg text-primary">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent">
              <LineChart className="size-3.5 text-white" />
            </span>
            <span className="text-[15px] font-bold">Trading Terminal</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-medium text-white"
          >
            Open terminal <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Paper trading · delayed market data
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Learn and analyze together.</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-secondary">
          Two-person workspace: watchlists, sessions, encyclopedia, risk math, paper ledger, and
          journal. Quotes come from Yahoo Finance when reachable and are labeled delayed. This page
          does not show sample prices.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white"
        >
          Launch Overview <ArrowRight className="size-4" />
        </Link>
        <p className="mt-4 text-[11px] text-secondary">
          Not financial advice. No live tape. No real brokerage execution.
        </p>
      </section>
    </main>
  );
}
