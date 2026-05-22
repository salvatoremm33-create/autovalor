# AutoValor 🚗 — Guía de Precios de Autos en México

A full-stack car price guide application for the Mexican market, similar to Kelley Blue Book.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router 6, Recharts |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL |
| Scraper | MercadoLibre Mexico API (free, no auth needed) |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally
- npm

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE autovalor;"

# Copy env file
cd backend
copy .env.example .env
# Edit .env and set your DATABASE_URL
```

### 2. Backend Setup

```bash
cd backend
npm install

# Run migrations
npm run migrate

# Seed initial data (makes, models, years, trims)
npm run seed

# Start dev server
npm run dev
```

Backend runs on: http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:3000

### 4. Initial Scrape (optional)

```bash
cd backend
npm run scrape
```

This fetches real listings from MercadoLibre for popular models.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/makes | List all car makes |
| GET | /api/models?make_id= | Models for a make |
| GET | /api/years?model_id= | Years for a model |
| GET | /api/trims?year_id= | Trims for a year |
| GET | /api/prices/estimate | Full price estimate |
| GET | /api/prices/history | Historical price data |
| GET | /api/listings | Market listings |
| POST | /api/listings/refresh | Trigger fresh scrape |
| POST | /api/financing/calculate | Financing calculator |
| GET | /api/financing/rates | Bank rates |

### Price Estimate Example

```
GET /api/prices/estimate?make=Toyota&model=Corolla&year=2022&trim=LE&mileage=35000&condition=good
```

## Features

- **Multi-step search flow**: Make → Model → Year → Trim → Mileage → Condition
- **3-tier pricing**: Trade-in / Fair Market Value / Dealer Retail
- **Real listings**: Scraped from MercadoLibre Mexico in real time
- **AI Analysis**: Rule-based market analysis (+ optional OpenAI integration)
- **Price history chart**: Powered by Recharts
- **Financing calculator**: Simulates credit with Mexican bank rates
- **Price rating**: Each listing rated vs. fair market value

## Environment Variables

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/autovalor
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=          # Optional: enables richer AI analysis
SCRAPE_INTERVAL_HOURS=6  # How often to auto-scrape
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a managed PostgreSQL (Neon, Supabase, RDS)
3. Build frontend: `cd frontend && npm run build`
4. Serve frontend build with nginx or from Express static middleware
5. Use PM2 for process management: `pm2 start server.js`

## Price Methodology

Prices are calculated using:
1. **Live market data**: Median of active MercadoLibre listings (outliers trimmed)
2. **Depreciation model**: Curves matching Mexican market (20% yr1, 15% yr2, ...)
3. **Mileage adjustment**: ±0.5% per 1,000 km vs. 14,000 km/year average
4. **Condition multiplier**: Excellent +8%, Good 0%, Fair -12%, Poor -26%
5. **Price tiers**: Trade-in (78-88%), Private Sale (95-108%), Dealer (108-122%)
