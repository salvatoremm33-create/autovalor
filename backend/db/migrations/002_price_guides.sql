-- Price guides from reference sources (Autocosmos, etc.)
CREATE TABLE IF NOT EXISTS price_guides (
  id           SERIAL PRIMARY KEY,
  source       VARCHAR(50)  NOT NULL DEFAULT 'autocosmos',
  make_name    VARCHAR(100) NOT NULL,
  model_name   VARCHAR(100) NOT NULL,
  year         SMALLINT     NOT NULL,
  trim_name    VARCHAR(200),
  buy_price_mxn  INTEGER,
  sell_price_mxn INTEGER,
  scraped_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (source, make_name, model_name, year, trim_name)
);

CREATE INDEX IF NOT EXISTS idx_price_guides_vehicle
  ON price_guides (make_name, model_name, year);
