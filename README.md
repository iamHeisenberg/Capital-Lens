# Capital-Lens

🌐 **Live:** [capital-lens.vercel.app](https://capital-lens.vercel.app)

> **Systematic equity analysis for NSE markets. Rule-based. Multi-layer. India-focused.**

A full-stack financial analysis platform for Indian equities (NSE), built around a 5-layer Compounder Framework. It combines sector-level macro analysis, DMA-based technical trend confirmation, and multi-dimensional fundamental scoring into a single disciplined decision-support tool.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Markets](#1-markets)
  - [Technicals](#2-technicals)
  - [Fundamentals](#3-fundamentals)
  - [Methodology](#4-methodology)
- [The 5-Layer Framework](#the-5-layer-compounder-framework)
- [Data Pipeline & Caching](#data-pipeline--caching)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Cache Seeding](#cache-seeding)
- [Environment Variables](#environment-variables)
- [Known Constraints](#known-constraints)

---

## What It Does

Capital-Lens is not a trading terminal. It is a **decision-support system** for long-term investors who want to:

1. Monitor NSE sector trends at a glance (Markets)
2. Confirm structural price trends for individual stocks (Technicals)
3. Evaluate multi-dimensional fundamental health (Fundamentals)
4. Understand the underlying investment framework (Methodology)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│   React + Vite + MUI                                        │
│   https://capital-lens.vercel.app                          │
│                                                             │
│   Pages: Home | Markets | Technicals | Fundamentals | Methodology │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (REST)
┌────────────────────────▼────────────────────────────────────┐
│                        BACKEND                              │
│   Node.js + Express                                         │
│   https://capital-lens-backend.onrender.com                │
│                                                             │
│   Routes:                                                   │
│     GET /api/markets                → all sector summaries  │
│     GET /api/markets/:symbol        → single sector full    │
│     GET /api/markets/:symbol/stocks → constituent stocks    │
│     GET /api/price/:ticker          → stock technicals      │
│     GET /api/financials/:ticker     → stock fundamentals    │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
┌─────────▼──────────┐    ┌────────────▼───────────┐
│   Upstash Redis     │    │    Yahoo Finance API    │
│   (remote cache)    │    │   (data source)         │
│                     │    │                         │
│  v4:price:TCS.NS   │    │  Rate-limited on Render │
│  v4:fundamentals:* │    │  → seeder runs locally  │
│  sector:^CNXMETAL  │    └────────────────────────┘
└────────────────────┘
```

### Key Design Decision: Cache-First Architecture

Yahoo Finance rate-limits Render's datacenter IP. The solution is a **local cache seeder** (`seedCache.js`) that runs on your local machine (where Yahoo Finance works fine) and pushes data into a shared Upstash Redis instance. The production server then serves exclusively from Redis — it never calls Yahoo Finance directly in production (except as a last-resort fallback for the Technicals/Fundamentals endpoints).

The `/api/markets/:symbol/stocks` endpoint is **cache-only** — it reads directly from Redis via `getCache()`, never falling back to Yahoo Finance, because firing 14 parallel Yahoo Finance calls simultaneously causes immediate 429 rate-limiting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Material-UI (MUI v5) |
| Backend | Node.js, Express |
| Cache | Upstash Redis (REST API via `@upstash/redis`) |
| Data Source | Yahoo Finance (via `yahoo-finance2`) |
| Charts | Recharts (lazy-loaded) |
| Deployment | Render (backend), Vercel / Render (frontend) |
| CI / Cache Warming | GitHub Actions (scheduled cron) |

---

## Features

### 1. Markets

**Route:** `/markets`

The macro-level view. Shows all 11 NSE sector indices simultaneously.

#### Heatmap
- Color-coded tiles for 11 sector indices + 4 benchmark indices
- Colors scale from deep red (large negative return) to deep green (large positive)
- Period selector: 1M / 3M / 6M / 1Y / 2Y
- Click any tile to open the sector detail panel

#### All Indices Table
- Same data as heatmap in tabular form with sortable columns
- Shows: name, latest close, return for each period, DMA50, DMA200, trend

#### Sector Detail Panel (two tabs)
**📊 Stocks tab** (sector indices only, not benchmarks):
- Lists all constituent stocks with multi-period returns (1M/3M/6M/1Y/2Y)
- Reference row shows the sector index's own returns for comparison
- Beat/Lag badge (↑↓) on the active sort column — shows which stocks outperform/underperform the index with exact % difference in tooltip
- Sortable by any return period, auto-syncs to heatmap period
- Click any stock row to navigate to `/technicals/<ticker>`
- Stocks absent from cache shown at 45% opacity with `—` values

**📈 Chart tab:**
- Full interactive price chart for the sector index
- Overlaid 50 DMA and 200 DMA lines
- Trend verdict (Uptrend / Downtrend / Sideways)

#### Sector Coverage (sectorConstituents.json)
| Index | Symbol | Stocks |
|---|---|---|
| NIFTY Bank | `^NSEBANK` | 14 |
| NIFTY IT | `^CNXIT` | 10 |
| NIFTY FMCG | `^CNXFMCG` | 14 |
| NIFTY Auto | `^CNXAUTO` | 15 |
| NIFTY Pharma | `^CNXPHARMA` | 17 |
| NIFTY Metal | `^CNXMETAL` | 15 |
| NIFTY Energy | `^CNXENERGY` | 10 |
| NIFTY Realty | `^CNXREALTY` | 8 |
| NIFTY Infra | `^CNXINFRA` | 11 |
| NIFTY PSU Bank | `^CNXPSUBANK` | 5 |
| NIFTY Media | `^CNXMEDIA` | 7 |

---

### 2. Technicals

**Route:** `/technicals` or `/technicals/:ticker`

Stock-level technical analysis for any of the 482 tracked NSE equities.

#### Search
- Autocomplete from `tickers.json` (482 stocks)
- Supports partial name or symbol search

#### PriceChartCard
- 200 trading days of OHLC close prices
- 50-day DMA overlay (green)
- 200-day DMA overlay (purple)
- Volume bars (when available)
- Period selector: 1M / 3M / 6M / 1Y / 2Y

#### PriceCard
- Latest close price
- Distance from 50 DMA (% above/below)
- Distance from 200 DMA (% above/below)
- DMA50 vs DMA200 spread

#### TrendCard
- Structural trend verdict: **UPTREND** / **DOWNTREND** / **SIDEWAYS**
- Logic: Price > DMA200 + DMA50 > DMA200 = Uptrend; spread < 2% = Sideways

#### RSICard (collapsible)
- RSI(14) chart with 30/70 threshold lines
- Signal: Oversold / Weak Momentum / Neutral / Strong / Overbought

#### OBVCard (collapsible)
- On-Balance Volume chart
- Signal: Bullish Divergence / Bearish Divergence / Confirmed / Neutral

#### InterpretationCard
- Combines trend + RSI + OBV signals into a plain-English summary

---

### 3. Fundamentals

**Route:** `/fundamentals` or `/fundamentals/:ticker`

5-pillar fundamental scorecard calibrated to Indian market norms.

#### Scoring System
Each pillar is scored 0–N points, aggregated into a Compounder Score.

| Pillar | Key Metrics |
|---|---|
| **Valuation** | P/E, PEG (1Y EPS), PEG (3Y Profit), EV/EBITDA, MCap/Sales |
| **Growth** | Sales YoY, Sales 3Y CAGR, Profit YoY, Profit 3Y CAGR |
| **Profitability** | EBITDA Margin, Operating Margin, Net Margin |
| **Capital Efficiency** | ROE, ROCE, CFO/EBITDA |
| **Balance Sheet** | Debt/Equity ratio |

Each card shows:
- Score bar (points earned / max)
- Color-coded verdict (Strong / Good / Adequate / Weak / Poor)
- Expandable breakdown showing per-metric scoring rationale

#### India-Specific Thresholds
Thresholds are calibrated to India's nominal GDP growth (~12–14% nominal), cost of capital in emerging markets, and sector-specific norms.

---

### 4. Methodology

**Route:** `/methodology`

A scroll-snapped 10-section presentation of the investment framework. Not interactive — it's the philosophical foundation for every metric threshold used in the app.

Sections: Investment Philosophy → Macro Context → Layers 1–5 → Position Sizing → What This Does Not Do → Core Principle.

---

## The 5-Layer Compounder Framework

| Layer | Name | What It Checks | Tool in App |
|---|---|---|---|
| 1 | Durable Business Quality | ROCE ≥ 20%, ROE ≥ 20%, Sales CAGR ≥ 12–15%, D/E ≤ 0.6 | Fundamentals |
| 2 | Valuation Discipline | PE vs history, PEG ≤ 1.5, EV/EBITDA | Fundamentals |
| 3 | Structural Trend Confirmation | Price > DMA200, DMA50 > DMA200, trend direction | Technicals |
| 4 | Sector & Capital Flow | Sector relative performance, institutional flow | Markets |
| 5 | Qualitative Risk Validation | Management commentary, tone shifts, red flags | *(Planned — AI)* |

**A stock is only a candidate if all implemented layers align.**

---

## Data Pipeline & Caching

### Cache Keys (Upstash Redis)

| Key Pattern | Content | TTL | Who Writes |
|---|---|---|---|
| `v4:price:<TICKER>.NS` | Historical closes, DMAs, RSI, OBV | **25h** | `priceService.js` / seeder |
| `v4:fundamentals:<TICKER>.NS` | P/E, CAGR, margins, ratios | **7.5 days** | `fetchFinancials.js` / seeder |
| `sector:<SYMBOL>` | Sector returns, DMA, historicalCloses | 4h | `sectorService.js` / seeder |

> **Note:** Sector cache keys are intentionally NOT version-prefixed — they survive a `CACHE_VERSION` bump that invalidates stock caches.

### GitHub Actions Cron (Auto Cache Warming)

| Job | Schedule | What |
|---|---|---|
| `seed-price` | Daily at 02:00 UTC (07:30 IST) | 482 stock price caches + 15 sector caches |
| `seed-fundamentals` | Weekly Mon at 03:00 UTC (08:30 IST) | 482 stock fundamental caches |

Manual trigger available via GitHub Actions UI (`workflow_dispatch`) — use before demos/interviews.

---

## Project Structure

```
Capital-Lens/
├── backend/
│   ├── config/
│   │   └── cacheConfig.js          # CACHE_VERSION constant
│   ├── controllers/
│   │   └── priceController.js
│   ├── middleware/
│   │   └── validateTicker.js
│   ├── routes/
│   │   ├── marketsRoutes.js         # /api/markets, /api/markets/:symbol, /api/markets/:symbol/stocks
│   │   ├── priceRoutes.js           # /api/price/:ticker
│   │   └── fundamentalsRoutes.js    # /api/financials/:ticker
│   ├── services/
│   │   ├── cacheService.js          # getCache / setCache / cacheKeys
│   │   ├── priceService.js          # getStockData → Yahoo Finance → Redis
│   │   ├── sectorService.js         # getSectorData → Yahoo Finance → Redis
│   │   └── fundamentals/
│   │       └── fetchFinancials.js   # fetchFinancials → Yahoo Finance → Redis
│   ├── scripts/
│   │   └── seedCache.js             # Local seeder: price | fundamentals | sectors | all
│   └── utils/
│       ├── logger.js                # Structured JSON logger (correlationId, event)
│       ├── yahooFinanceClient.js    # Yahoo Finance wrapper
│       ├── withRetry.js             # Retry + timeout utility
│       ├── indicators.js            # RSI, OBV, rolling MA computations
│       ├── dmaUtils.js              # DMA calculation helpers
│       └── trendUtils.js            # Trend verdict logic
│
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── home/                # HomePage.jsx
│       │   ├── markets/             # MarketsPage + SectorHeatmap + SectorTable + SectorDetailPanel + SectorStocksTable
│       │   ├── stock-analysis/      # StockAnalysisPage + PriceChartCard + RSICard + OBVCard + TrendCard + PriceCard
│       │   ├── fundamentals/        # FundamentalsPage + 11 scoring cards
│       │   └── methodology/         # MethodologyPage (scroll-snap presentation)
│       ├── data/
│       │   ├── tickers.json         # 482 NSE stocks (symbol + name)
│       │   ├── sectors.json         # 15 sector/index symbols with metadata
│       │   └── sectorConstituents.json  # Constituent stocks per sector index
│       └── components/
│           └── layout/              # PageLayout, Navbar
│
└── .github/
    └── workflows/
        └── seed-cache.yml           # Automated cache warming cron
```

---

## Running Locally

**Production URLs:**
- Frontend: https://capital-lens.vercel.app
- Backend API: https://capital-lens-backend.onrender.com

**Run locally:**
```bash
# 1. Clone and install
git clone <repo>
cd Capital-Lens

# 2. Backend
cd backend
npm install
# Create .env (see Environment Variables below)
npm run dev       # starts on :5000 (local)

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev       # starts on :5173 (local)
```

> The frontend `.env.development` already points `VITE_API_BASE_URL` to `http://localhost:5000` for local dev, and `.env` points to the Render backend for production builds.

---

## Cache Seeding

The backend cannot fetch from Yahoo Finance in production (Render IP is rate-limited). Run the seeder from your local machine to populate Upstash Redis.

```bash
# From project root
node backend/scripts/seedCache.js                    # all 482 stocks (price + fundamentals)
node backend/scripts/seedCache.js --type price       # price only (~6 min)
node backend/scripts/seedCache.js --type fundamentals # fundamentals only (~12 min)
node backend/scripts/seedCache.js --type sectors     # 15 sector indices (~15 sec)
node backend/scripts/seedCache.js --limit 50         # first 50 tickers only (for testing)
node backend/scripts/seedCache.js --refresh          # force re-fetch even on cache hit
```

**Run this before demos/interviews** to ensure the cache is warm.

---

## Environment Variables

**`backend/.env`**
```
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
PORT=5000
```

**`frontend/.env`** (production)
```
VITE_API_BASE_URL=https://capital-lens-backend.onrender.com
```

**`frontend/.env.development`** (local)
```
VITE_API_BASE_URL=http://localhost:5000
```

**GitHub Secrets** (for Actions cron)
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

---

## Known Constraints

| Constraint | Reason | Mitigation |
|---|---|---|
| Yahoo Finance IP rate-limiting on Render | Render's datacenter IPs are blocked/throttled by Yahoo Finance | Cache seeder runs locally; GitHub Actions cron keeps cache warm |
| Stocks endpoint is cache-only | Firing 14 parallel YF calls causes immediate 429 storm | `getCache()` directly; `available:false` degradation for cold stocks |
| Price TTL is 25h (not real-time) | Yahoo Finance isn't a licensed data provider | Acceptable for long-term structural analysis; not a trading terminal |
| 482 stocks tracked | Manual curation of `tickers.json` | Add any NSE stock by appending `{ "symbol": "XYZ.NS", "name": "..." }` |
| Layer 5 (AI) not yet implemented | Requires LLM integration for earnings call parsing | Listed in roadmap |
