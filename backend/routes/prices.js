const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const db = require('../db/connection');
const { calculatePricesFromListings, getPriceRating } = require('../services/priceCalculator');
const { generateAIAnalysis } = require('../services/aiAnalysis');
const { scrapeOnDemand } = require('../scrapers/mercadolibre');
const logger = require('../utils/logger');

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

    const msrp = trimData?.msrp_mxn || 350000;
    const prices = calculatePricesFromListings(listings.rows, msrp, yearInt, mileageKm, condition);

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
       ORDER BY source, trim_name NULLS LAST
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
