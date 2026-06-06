const express = require('express');
const router = express.Router();
const path = require('path');
const { query, validationResult } = require('express-validator');
const db = require('../db/connection');
const { calculatePricesFromListings, getPriceRating, getMileageAdjustment } = require('../services/priceCalculator');
const { generateAIAnalysis } = require('../services/aiAnalysis');
const { scrapeOnDemand } = require('../scrapers/mercadolibre');
const logger = require('../utils/logger');

// ── Lobato price guide (primary source) ───────────────────────────────────────
let LOBATO = null;
try {
  LOBATO = require(path.join(__dirname, '../db/lobato_prices.json'));
  const brands = Object.keys(LOBATO).length;
  let totalEntries = 0;
  for (const b of Object.values(LOBATO))
    for (const m of Object.values(b))
      for (const yr of Object.values(m))
        totalEntries += yr.length;
  logger.info(`Lobato guide loaded: ${brands} brands, ${totalEntries} price entries`);
} catch (e) {
  logger.warn('lobato_prices.json not found — falling back to market data only');
}

const CONDITION_MULTIPLIERS = { excellent: 1.08, good: 1.00, fair: 0.88, poor: 0.74 };

// Find matching Lobato entries for a given make/model/year.
// Returns { brand, model, entries } or null.
function findLobatoEntries(make, model, year) {
  if (!LOBATO) return null;

  const makeUpper = make.trim().toUpperCase();
  // Exact brand match first, then prefix/suffix match
  let brandKey = Object.keys(LOBATO).find(b => b === makeUpper)
    || Object.keys(LOBATO).find(b => b.startsWith(makeUpper) || makeUpper.startsWith(b));
  if (!brandKey) return null;

  const modelNorm = model.trim().toLowerCase();
  const modelKeys = Object.keys(LOBATO[brandKey]);
  // Priority: exact → Lobato key starts with user term → user term starts with Lobato key
  const modelKey = modelKeys.find(m => m.toLowerCase() === modelNorm)
    || modelKeys.find(m => m.toLowerCase().startsWith(modelNorm))
    || modelKeys.find(m => modelNorm.startsWith(m.toLowerCase()));
  if (!modelKey) return null;

  const entries = LOBATO[brandKey][modelKey]?.[year];
  if (!entries || entries.length === 0) return null;
  return { brand: brandKey, model: modelKey, entries };
}

// Build a Lobato-sourced prices object using the same shape as calculatePricesFromListings.
function buildLobatoPrice(entries, condition, mileageKm, year) {
  const avgVenta  = Math.round(entries.reduce((s, e) => s + e.venta,  0) / entries.length);
  const avgCompra = Math.round(entries.reduce((s, e) => s + e.compra, 0) / entries.length);

  const condMult  = CONDITION_MULTIPLIERS[condition] || 1.0;
  const mileAdj   = getMileageAdjustment(mileageKm, year);
  const adj       = condMult * (1 + mileAdj);

  const venta  = Math.round(avgVenta  * adj);
  const compra = Math.round(avgCompra * adj);

  return {
    fairMarketValue: venta,
    privateSale: {
      low:  Math.round(compra * 1.02),
      high: Math.round(venta  * 0.97),
      mid:  Math.round((compra * 1.02 + venta * 0.97) / 2)
    },
    dealerRetail: {
      low:  venta,
      high: Math.round(venta  * 1.10),
      mid:  Math.round(venta  * 1.05)
    },
    tradeIn: {
      low:  Math.round(compra * 0.95),
      high: compra,
      mid:  Math.round(compra * 0.975)
    },
    adjustments: {
      conditionMultiplier:  condMult,
      mileageAdjustment:    Math.round(mileAdj * 1000) / 10,
      depreciationPercent:  null,
      sampleSize:           entries.length,
      dataSource:           'lobato_guide'
    }
  };
}

const priceValidation = [
  query('make').notEmpty().trim(),
  query('model').notEmpty().trim(),
  query('year').isInt({ min: 1990, max: 2026 }),
  query('mileage').isInt({ min: 0, max: 1000000 }),
  query('condition').isIn(['excellent', 'good', 'fair', 'poor'])
];

router.get('/estimate', priceValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Parámetros inválidos', details: errors.array() });
  }

  try {
    const { make, model, year, trim, mileage, condition } = req.query;
    const mileageKm = parseInt(mileage);
    const yearInt = parseInt(year);

    // Get trim info for MSRP
    let trimData = null;
    if (trim) {
      const trimResult = await db.query(
        `SELECT t.*, y.year, m.name AS model_name, mk.name AS make_name
         FROM trims t
         JOIN years y ON t.year_id = y.id
         JOIN models m ON y.model_id = m.id
         JOIN makes mk ON m.make_id = mk.id
         WHERE mk.name ILIKE $1 AND m.name ILIKE $2 AND y.year = $3 AND t.name ILIKE $4
         LIMIT 1`,
        [make, model, yearInt, trim]
      );
      trimData = trimResult.rows[0] || null;
    }

    // Get cached listings from DB
    let listings = await db.query(
      `SELECT price_mxn, mileage_km, condition, location_city, location_state
       FROM listings
       WHERE make_name ILIKE $1 AND model_name ILIKE $2
         AND year = $3 AND is_active = true
         AND price_mxn > 50000
       ORDER BY scraped_at DESC
       LIMIT 100`,
      [make, model, yearInt]
    );

    // If no cached listings, trigger on-demand scrape
    if (listings.rows.length < 5) {
      logger.info(`Triggering on-demand scrape for ${make} ${model} ${year}`);
      try {
        await scrapeOnDemand(make, model, yearInt);
        listings = await db.query(
          `SELECT price_mxn, mileage_km FROM listings
           WHERE make_name ILIKE $1 AND model_name ILIKE $2
             AND year = $3 AND is_active = true AND price_mxn > 50000
           ORDER BY scraped_at DESC LIMIT 100`,
          [make, model, yearInt]
        );
      } catch (scrapeErr) {
        logger.warn(`On-demand scrape failed: ${scrapeErr.message}`);
      }
    }

    // ── Primary: Lobato price guide ─────────────────────────────────────────
    const lobatoMatch = findLobatoEntries(make, model, yearInt);
    let prices;
    let lobatoData = null;

    if (lobatoMatch) {
      prices = buildLobatoPrice(lobatoMatch.entries, condition, mileageKm, yearInt);
      lobatoData = {
        brand:   lobatoMatch.brand,
        model:   lobatoMatch.model,
        year:    yearInt,
        trims:   lobatoMatch.entries,
        source:  'Guía Autoprecios Lobato Feb 2026'
      };
      logger.info(`Lobato match: ${lobatoMatch.brand} / ${lobatoMatch.model} / ${yearInt} (${lobatoMatch.entries.length} trims)`);
    } else {
      // ── Fallback: depreciation algorithm from market listings / MSRP ──────
      const msrp = trimData?.msrp_mxn || 350000;
      prices = calculatePricesFromListings(listings.rows, msrp, yearInt, mileageKm, condition);
    }

    // Get price history
    const historyResult = await db.query(
      `SELECT recorded_date, avg_price, min_price, max_price, sample_count
       FROM price_history
       WHERE make_name ILIKE $1 AND model_name ILIKE $2 AND year = $3
       ORDER BY recorded_date DESC LIMIT 12`,
      [make, model, yearInt]
    );

    const priceHistory = historyResult.rows.reverse();

    // Log search for analytics
    db.query(
      `INSERT INTO search_analytics (make_name, model_name, year, trim_name, mileage_km, condition)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [make, model, yearInt, trim || null, mileageKm, condition]
    ).catch(() => {});

    // Fetch Autocosmos reference prices for this vehicle
    const guideResult = await db.query(
      `SELECT trim_name, buy_price_mxn, sell_price_mxn, source
       FROM price_guides
       WHERE make_name ILIKE $1 AND model_name ILIKE $2 AND year = $3
       ORDER BY
         CASE source WHEN 'autocosmos' THEN 1 WHEN 'autometrica' THEN 2 ELSE 3 END,
         trim_name NULLS LAST
       LIMIT 20`,
      [make, model, yearInt]
    );

    let priceGuide = null;
    if (guideResult.rows.length > 0) {
      const buyPrices  = guideResult.rows.map(r => r.buy_price_mxn).filter(Boolean);
      const sellPrices = guideResult.rows.map(r => r.sell_price_mxn).filter(Boolean);
      priceGuide = {
        entries: guideResult.rows,
        avgBuyPrice:  buyPrices.length  ? Math.round(buyPrices.reduce((a, b) => a + b, 0)  / buyPrices.length)  : null,
        avgSellPrice: sellPrices.length ? Math.round(sellPrices.reduce((a, b) => a + b, 0) / sellPrices.length) : null
      };
    }

    // Generate AI analysis
    const analysis = await generateAIAnalysis({
      makeName: make, modelName: model, year: yearInt,
      trimName: trim, mileageKm, condition,
      prices, listings: listings.rows, priceHistory
    });

    res.json({
      vehicle: {
        make, model, year: yearInt, trim: trim || null,
        mileageKm, condition,
        msrp: trimData?.msrp_mxn || null,
        engine: trimData?.engine || null,
        transmission: trimData?.transmission || null
      },
      prices,
      lobatoData,
      priceGuide,
      priceHistory,
      analysis,
      sampleSize: listings.rows.length
    });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const { make, model, year } = req.query;
    if (!make || !model || !year) {
      return res.status(400).json({ error: 'Se requieren make, model y year' });
    }

    const result = await db.query(
      `SELECT recorded_date, avg_price, min_price, max_price, sample_count
       FROM price_history
       WHERE make_name ILIKE $1 AND model_name ILIKE $2 AND year = $3
       ORDER BY recorded_date ASC LIMIT 24`,
      [make, model, parseInt(year)]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/compare', async (req, res, next) => {
  try {
    const { make, model } = req.query;
    if (!make || !model) {
      return res.status(400).json({ error: 'Se requieren make y model' });
    }

    const result = await db.query(
      `SELECT ph.year, ph.avg_price, ph.sample_count
       FROM price_history ph
       WHERE ph.make_name ILIKE $1 AND ph.model_name ILIKE $2
         AND ph.recorded_date >= NOW() - INTERVAL '7 days'
       ORDER BY ph.year DESC`,
      [make, model]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
