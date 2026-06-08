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

// Blend delta: how much condition shifts the private-sale position between compra and venta.
const CONDITION_BLEND_DELTA  = { excellent: 0.15, good: 0, fair: -0.12, poor: -0.25 };
// For the UI "Condición" adjustment label (keeps familiar ±% display).
const CONDITION_DISPLAY_MULT = { excellent: 1.08, good: 1.00, fair: 0.88, poor: 0.74 };

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
  // Build candidate list in priority order: exact → Lobato key starts with query → query starts with key
  const candidates = [
    ...modelKeys.filter(m => m.toLowerCase() === modelNorm),
    ...modelKeys.filter(m => m.toLowerCase() !== modelNorm && m.toLowerCase().startsWith(modelNorm)),
    ...modelKeys.filter(m => !m.toLowerCase().startsWith(modelNorm) && modelNorm.startsWith(m.toLowerCase()))
  ];
  // Pick first candidate that actually has entries for the requested year
  for (const modelKey of candidates) {
    const entries = LOBATO[brandKey][modelKey]?.[year];
    if (entries && entries.length > 0) return { brand: brandKey, model: modelKey, entries };
  }
  return null;
}

// Parse a raw Lobato trim string into display-friendly { name, engine, transmission }.
function parseLobatoParts(raw) {
  const s = raw.replace(/\s+/g, ' ').trim();
  const withoutPts = s.replace(/^\d+\s*[Pp]ts\.?\s*/, '');
  const parts = withoutPts.split(/,\s*/);
  const nameParts = [], engineParts = [], transParts = [];
  let foundEngine = false;
  for (const p of parts) {
    const pt = p.trim();
    if (!pt) continue;
    if (/^(piel|tela|gamuza|alcantara|RA-|R-\d|QC|SNAV|QP|pant|HUD|spoiler|xen|cuero)/i.test(pt)) continue;
    if (/^[LVI]\d/.test(pt) || /^(BEV|EV|HEV|MHEV)$/i.test(pt)) {
      foundEngine = true; engineParts.push(pt);
    } else if (/HP$|\bHP\b|\blt\b|\dT\.\d|\dT\b|kWh/.test(pt)) {
      engineParts.push(pt);
    } else if (/^(TM|TA)\s*\d/i.test(pt) || /^(CVT|DSG)$/i.test(pt) || pt === 'TA') {
      transParts.push(pt);
    } else if (!foundEngine) {
      nameParts.push(pt);
    }
  }
  let name = nameParts.join(' ').trim();
  const engine = engineParts.join(' ').trim() || null;
  const transmission = transParts.join(' ').trim() || null;
  if (!name) {
    name = withoutPts
      .replace(/,(piel|tela|gamuza|alcantara|QC|SNAV|QP|pant|spoiler|xen)/gi, '')
      .replace(/,RA-\d+|,R-\d+/gi, '').trim();
  }
  return { name, engine, transmission };
}

// Build a Lobato-sourced prices object with the same shape as calculatePricesFromListings.
//
// Business rules:
//   Lobato COMPRA  = Intercambio (trade-in) anchor
//   Lobato VENTA   = Concesionario (dealer) anchor
//   Venta Privada  = blend between COMPRA and VENTA; condition + mileage shift the ratio
//                    so prices always stay within the guide range.
//
// dataSource field lets callers know the origin for future weighting or regional logic.
function buildLobatoPrice(entries, condition, mileageKm, year) {
  const avgVenta  = Math.round(entries.reduce((s, e) => s + e.venta,  0) / entries.length);
  const avgCompra = Math.round(entries.reduce((s, e) => s + e.compra, 0) / entries.length);
  const spread    = avgVenta - avgCompra;

  const condBlend  = CONDITION_BLEND_DELTA[condition] ?? 0;
  const mileAdj    = getMileageAdjustment(mileageKm, year);
  const mileBlend  = mileAdj * 0.8;
  const blend      = Math.max(0.10, Math.min(0.90, 0.625 + condBlend + mileBlend));

  const privateMid    = Math.round(avgCompra + spread * blend);
  const privateSpread = Math.round(spread * 0.05);

  return {
    fairMarketValue: privateMid,
    privateSale: {
      low:  privateMid - privateSpread,
      high: privateMid + privateSpread,
      mid:  privateMid
    },
    dealerRetail: {
      low:  Math.round(avgVenta * 0.97),
      high: Math.round(avgVenta * 1.05),
      mid:  avgVenta
    },
    tradeIn: {
      low:  Math.round(avgCompra * 0.95),
      high: Math.round(avgCompra * 1.02),
      mid:  avgCompra
    },
    adjustments: {
      conditionMultiplier:  CONDITION_DISPLAY_MULT[condition] || 1.0,
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
      // Filter to the specific selected trim; fall back to all trims when trim is absent
      // (e.g. "No sé la versión exacta") or no match found.
      let activeEntries = lobatoMatch.entries;
      if (trim && trim.trim()) {
        const trimLower = trim.trim().toLowerCase();
        const matched = lobatoMatch.entries.find(e => {
          const { name } = parseLobatoParts(e.trim);
          return name.toLowerCase() === trimLower;
        });
        if (matched) activeEntries = [matched];
      }

      prices = buildLobatoPrice(activeEntries, condition, mileageKm, yearInt);
      lobatoData = {
        brand:   lobatoMatch.brand,
        model:   lobatoMatch.model,
        year:    yearInt,
        trims:   activeEntries,
        source:  'market_guide'
      };
      logger.info(`Lobato match: ${lobatoMatch.brand} / ${lobatoMatch.model} / ${yearInt} (${activeEntries.length}/${lobatoMatch.entries.length} trims)`);
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

// Return Lobato trim entries for a given make/model/year, shaped for the trim-selector UI.
router.get('/lobato-trims', async (req, res, next) => {
  try {
    const { make, model, year } = req.query;
    if (!make || !model || !year) {
      return res.status(400).json({ error: 'Se requieren make, model y year' });
    }
    const match = findLobatoEntries(make, model, parseInt(year, 10));
    if (!match) return res.json([]);

    const trims = match.entries.map((e, i) => {
      const { name, engine, transmission } = parseLobatoParts(e.trim);
      return {
        id:           `lobato_${i}`,
        name,
        engine,
        transmission,
        fuel_type:    null,
        msrp_mxn:     e.venta,
        priceLabel:   'Precio guía',
        lobato_venta: e.venta,
        lobato_compra: e.compra,
        source:       'lobato'
      };
    });
    res.json(trims);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
