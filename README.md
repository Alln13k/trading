# NexTrade

A premium trading platform workspace for two traders learning the markets together — paper trading, professional charts, shared watchlists, trade journaling and macro news, with live market data.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **zustand** and **lightweight-charts v5**.

## Features

- **Dashboard** — portfolio value, P&L stats, market overview, equity curve, activity feed
- **Pro Charts** — candlestick/line/area, 9 timeframes, 8 technical indicators (SMA, EMA, RSI, MACD, Bollinger, VWAP, Stochastic, ATR), drawing tools (trendline, rectangle, Fibonacci, zones), saved layouts, fullscreen
- **Markets & Watchlists** — ~100 assets across crypto, forex, stocks, indices and commodities; multiple watchlists
- **Paper Trading** — open/close positions with live P&L, stop loss / take profit, shared comments
- **Portfolio** — holdings with allocation, risk card (SL/TP), equity history
- **Trade Journal** — stats, strategy breakdown, day-by-day calendar, screenshots, emotions
- **Alerts** — price / RSI / EMA-cross conditions evaluated every few seconds with a notification center
- **News & Economic Calendar** — live headlines from Yahoo Finance, events from Forex Factory
- **Analysis** — automated technical snapshot: trend, momentum, volatility, key levels, score
- **Collaboration** — two users (Allan & Alex), shared workspace, activity feed, comments

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data

Market data is **live**: quotes, candles, sparklines and news come from Yahoo Finance, and the economic calendar from Forex Factory — proxied through self-hosted API routes (`/api/market/*`) with server-side caching and request coalescing. If a source is unreachable, the app falls back to deterministic simulated data so the UI never breaks; the fallback is never labeled as live.

Swap providers by implementing the `MarketDataProvider` interface in `src/lib/data/provider.ts` and changing `DATA_SOURCE`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint (React Compiler rules)