# NexTrade

A premium trading platform workspace for two traders learning the markets together — paper trading, professional charts, shared watchlists, trade journaling and macro news, all with clearly-labeled demo data.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **zustand** and **lightweight-charts v5**.

## Features

- **Dashboard** — portfolio value, P&L stats, market overview, equity curve, activity feed
- **Pro Charts** — candlestick/line/area, 9 timeframes, 8 technical indicators (SMA, EMA, RSI, MACD, Bollinger, VWAP, Stochastic, ATR), drawing tools (trendline, rectangle, Fibonacci, zones), saved layouts, fullscreen
- **Markets & Watchlists** — ~100 simulated assets across crypto, forex, stocks, indices and commodities; multiple watchlists
- **Paper Trading** — open/close positions with live P&L, stop loss / take profit, shared comments
- **Portfolio** — holdings with allocation, risk card (SL/TP), equity history
- **Trade Journal** — stats, strategy breakdown, day-by-day calendar, screenshots, emotions
- **Alerts** — price / RSI / EMA-cross conditions evaluated every few seconds with a notification center
- **News & Economic Calendar** — demo feed with real-world themes
- **Analysis** — automated technical snapshot: trend, momentum, volatility, key levels, score
- **Collaboration** — two users (Allan & Alex), shared workspace, activity feed, comments

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data

All market data is **simulated and deterministic** (seeded per symbol — refreshing reproduces the same market; quotes tick every 3 seconds while the app is open). Everything is labeled "Demo Data"; no real trades are placed.

To connect a live market-data API, implement the `MarketDataProvider` interface in `src/lib/data/provider.ts` and swap `DATA_SOURCE`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint (React Compiler rules)