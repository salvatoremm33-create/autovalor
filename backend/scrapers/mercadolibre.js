/**
 * MercadoLibre Mexico Car Listing Scraper
 * Uses the official MercadoLibre API (no auth required for search)
 * Category MLM1744 = Autos y Camionetas en México
 */

const axios = require('axios');
const db = require('../db/connection');
const logger = require('../utils/logger');

const ML_BASE_URL = 'https://api.mercadolibre.com';
const ML_SITE = 'MLM';
const ML_CATEGORY = 'MLM1744';
const REQUEST_DELAY_MS = 500;

const httpClient = axios.create({
  baseURL: ML_BASE_URL,
  timeout: 15000,
  headers: {
    'User-Agent': 'AutoValor/1.0 (autovalor.mx)',
    'Accept': 'application/json'
  }
});

if (process.env.MERCADOLIBRE_APP_ID) {
  httpClient.defaults.headers['Authorization'] = `Bearer ${process.env.MERCADOLIBRE_ACCESS_TOKEN}`;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function searchListings(makeName, modelName, year, options = {}) {
  const { limit = 50, offset = 0 } = options;
  const query = `${makeName} ${modelName} ${year}`;

  try {
    const response = await httpClient.get(`/sites/${ML_SITE}/search`, {
      params: {
        category: ML_CATEGORY,
        q: query,
        limit,
        offset,
        condition: 'used'
      }
    });

    const { results, paging } = response.data;
    return { results: results || [], total: paging?.total || 0 };
  } catch (err) {
    logger.error(`ML search failed for "${query}": ${err.message}`);
    return { results: [], total: 0 };
  }
}

async function getItemDetails(itemId) {
  try {
    await sleep(REQUEST_DELAY_MS);
    const response = await httpClient.get(`/items/${itemId}`);
    return response.data;
  } catch (err) {
    logger.warn(`ML item details failed for ${itemId}: ${err.message}`);
    return null;
  }
}

function parseAttributes(attributes = []) {
  const attrMap = {};
  for (const attr of attributes) {
    attrMap[attr.id] = attr.value_name || attr.value_struct?.number;
  }
  return {
    mileage: parseInt(attrMap['VEHICLE_MILEAGE']) || null,
    year: parseInt(attrMap['VEHICLE_YEAR']) || null,
    color: attrMap['COLOR'] || null,
    fuelType: attrMap['FUEL_TYPE'] || null,
    transmission: attrMap['TRANSMISSION'] || null,
    condition: attrMap['ITEM_CONDITION'] || null,
    doors: attrMap['DOORS'] || null,
    sellerType: attrMap['SELLER_TYPE'] || null
  };
}

function extractLocation(location) {
  if (!location) return { city: null, state: null };
  return {
    city: location.city?.name || null,
    state: location.state?.name || null
  };
}

async function upsertListing(item, makeName, modelName, year) {
  const attrs = parseAttributes(item.attributes);
  const loc = extractLocation(item.location || item.seller_address);

  try {
    await db.query(
      `INSERT INTO listings
         (source, external_id, make_name, model_name, year, price_mxn, mileage_km,
          color, location_city, location_state, seller_type, title, url, thumbnail_url, scraped_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
       ON CONFLICT (external_id) DO UPDATE SET
         price_mxn = EXCLUDED.price_mxn,
         mileage_km = EXCLUDED.mileage_km,
         is_active = true,
         scraped_at = NOW(),
         updated_at = NOW()`,
      [
        'mercadolibre',
        item.id,
        makeName,
        modelName,
        attrs.year || year,
        Math.round(item.price || 0),
        attrs.mileage,
        attrs.color,
        loc.city,
        loc.state,
        item.seller?.car_dealer ? 'dealer' : 'private',
        item.title,
        item.permalink,
        item.thumbnail
      ]
    );
  } catch (err) {
    logger.warn(`Failed to upsert listing ${item.id}: ${err.message}`);
  }
}

async function scrapeModelYear(makeName, modelName, year) {
  logger.info(`Scraping: ${makeName} ${modelName} ${year}`);

  const { results, total } = await searchListings(makeName, modelName, year, { limit: 48 });
  logger.debug(`Found ${total} total listings, processing ${results.length}`);

  for (const item of results) {
    await upsertListing(item, makeName, modelName, year);
    await sleep(100);
  }

  // Update price history
  if (results.length > 0) {
    const prices = results.map(r => r.price).filter(p => p > 0);
    const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    await db.query(
      `INSERT INTO price_history (make_name, model_name, year, avg_price, min_price, max_price, sample_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (make_name, model_name, year, recorded_date)
       DO UPDATE SET avg_price = EXCLUDED.avg_price, sample_count = EXCLUDED.sample_count`,
      [makeName, modelName, year, avgPrice, minPrice, maxPrice, prices.length]
    );
  }

  return results.length;
}

async function scrapePopularModels() {
  const popularCombinations = [
    ['Nissan', 'Versa', [2019, 2020, 2021, 2022, 2023]],
    ['Nissan', 'Kicks', [2020, 2021, 2022, 2023]],
    ['Chevrolet', 'Aveo', [2018, 2019, 2020, 2021, 2022]],
    ['Toyota', 'Corolla', [2019, 2020, 2021, 2022, 2023]],
    ['Volkswagen', 'Jetta', [2019, 2020, 2021, 2022, 2023]],
    ['Kia', 'Sportage', [2019, 2020, 2021, 2022, 2023]],
    ['Honda', 'CR-V', [2019, 2020, 2021, 2022]],
    ['Ford', 'F-150', [2019, 2020, 2021, 2022]],
    ['Mazda', 'CX-5', [2019, 2020, 2021, 2022, 2023]],
    ['Hyundai', 'Tucson', [2019, 2020, 2021, 2022]]
  ];

  let totalScraped = 0;
  for (const [make, model, years] of popularCombinations) {
    for (const year of years) {
      const count = await scrapeModelYear(make, model, year);
      totalScraped += count;
      await sleep(REQUEST_DELAY_MS);
    }
  }

  // Mark stale listings inactive (not seen in last 48h)
  await db.query(
    `UPDATE listings SET is_active = false
     WHERE scraped_at < NOW() - INTERVAL '48 hours' AND is_active = true`
  );

  logger.info(`Scrape complete: ${totalScraped} listings processed`);
  return totalScraped;
}

async function scrapeOnDemand(makeName, modelName, year) {
  const count = await scrapeModelYear(makeName, modelName, year);
  return count;
}

module.exports = { scrapePopularModels, scrapeOnDemand, searchListings };
