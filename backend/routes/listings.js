const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { getPriceRating } = require('../services/priceCalculator');
const { scrapeOnDemand } = require('../scrapers/mercadolibre');
const logger = require('../utils/logger');

router.get('/', async (req, res, next) => {
  try {
    const { make, model, year, limit = 24, offset = 0, sort = 'price_asc' } = req.query;

    if (!make || !model || !year) {
      return res.status(400).json({ error: 'Se requieren make, model y year' });
    }

    const orderMap = {
      price_asc: 'price_mxn ASC',
      price_desc: 'price_mxn DESC',
      mileage_asc: 'mileage_km ASC NULLS LAST',
      newest: 'scraped_at DESC'
    };
    const orderClause = orderMap[sort] || 'price_mxn ASC';

    const result = await db.query(
      `SELECT id, source, external_id, make_name, model_name, year, trim_name,
              price_mxn, mileage_km, condition, color, location_city, location_state,
              seller_type, title, url, thumbnail_url, scraped_at
       FROM listings
       WHERE make_name ILIKE $1 AND model_name ILIKE $2
         AND year = $3 AND is_active = true AND price_mxn > 50000
       ORDER BY ${orderClause}
       LIMIT $4 OFFSET $5`,
      [make, model, parseInt(year), parseInt(limit), parseInt(offset)]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM listings
       WHERE make_name ILIKE $1 AND model_name ILIKE $2
         AND year = $3 AND is_active = true AND price_mxn > 50000`,
      [make, model, parseInt(year)]
    );

    // Enrich with price ratings if fair market value is provided
    const fairMarket = req.query.fair_market ? parseInt(req.query.fair_market) : null;
    const enriched = result.rows.map(listing => ({
      ...listing,
      priceRating: fairMarket ? getPriceRating(listing.price_mxn, fairMarket) : null
    }));

    res.json({
      listings: enriched,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { make, model, year } = req.body;
    if (!make || !model || !year) {
      return res.status(400).json({ error: 'Se requieren make, model y year' });
    }

    logger.info(`Manual refresh requested: ${make} ${model} ${year}`);
    const count = await scrapeOnDemand(make, model, parseInt(year));

    res.json({ message: 'Actualización completada', count, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
