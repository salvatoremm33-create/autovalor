-- AutoValor Database Schema

CREATE TABLE IF NOT EXISTS makes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  name_es VARCHAR(100),
  country VARCHAR(50),
  logo_url VARCHAR(255),
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS models (
  id SERIAL PRIMARY KEY,
  make_id INTEGER NOT NULL REFERENCES makes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  body_type VARCHAR(50),
  segment VARCHAR(50),
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(make_id, name)
);

CREATE TABLE IF NOT EXISTS years (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2026),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(model_id, year)
);

CREATE TABLE IF NOT EXISTS trims (
  id SERIAL PRIMARY KEY,
  year_id INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  engine VARCHAR(100),
  transmission VARCHAR(50),
  drivetrain VARCHAR(20),
  fuel_type VARCHAR(30),
  msrp_mxn INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year_id, name)
);

CREATE TABLE IF NOT EXISTS market_prices (
  id SERIAL PRIMARY KEY,
  trim_id INTEGER NOT NULL REFERENCES trims(id) ON DELETE CASCADE,
  mileage_km INTEGER NOT NULL DEFAULT 0,
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  trade_in_low INTEGER NOT NULL,
  trade_in_high INTEGER NOT NULL,
  private_sale_low INTEGER NOT NULL,
  private_sale_high INTEGER NOT NULL,
  dealer_retail_low INTEGER NOT NULL,
  dealer_retail_high INTEGER NOT NULL,
  fair_market_value INTEGER NOT NULL,
  sample_size INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trim_id, mileage_km, condition)
);

CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL DEFAULT 'mercadolibre',
  external_id VARCHAR(100) UNIQUE,
  make_name VARCHAR(100) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  trim_name VARCHAR(100),
  price_mxn INTEGER NOT NULL,
  mileage_km INTEGER,
  condition VARCHAR(50),
  color VARCHAR(50),
  location_city VARCHAR(100),
  location_state VARCHAR(100),
  seller_type VARCHAR(50),
  title TEXT,
  url TEXT,
  thumbnail_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  trim_id INTEGER REFERENCES trims(id) ON DELETE SET NULL,
  make_name VARCHAR(100) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  avg_price INTEGER NOT NULL,
  min_price INTEGER NOT NULL,
  max_price INTEGER NOT NULL,
  sample_count INTEGER DEFAULT 0,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(make_name, model_name, year, recorded_date)
);

CREATE TABLE IF NOT EXISTS search_analytics (
  id SERIAL PRIMARY KEY,
  make_name VARCHAR(100),
  model_name VARCHAR(100),
  year INTEGER,
  trim_name VARCHAR(100),
  mileage_km INTEGER,
  condition VARCHAR(20),
  ip_address VARCHAR(45),
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_models_make_id ON models(make_id);
CREATE INDEX IF NOT EXISTS idx_years_model_id ON years(model_id);
CREATE INDEX IF NOT EXISTS idx_trims_year_id ON trims(year_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_trim_id ON market_prices(trim_id);
CREATE INDEX IF NOT EXISTS idx_listings_make_model ON listings(make_name, model_name, year);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active, scraped_at);
CREATE INDEX IF NOT EXISTS idx_price_history_lookup ON price_history(make_name, model_name, year, recorded_date);
