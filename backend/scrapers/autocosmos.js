/**
 * Autocosmos.com.mx Listings Scraper
 * URL pattern: /auto/usado/{make}/{model} — these pages are SSR (~267KB HTML).
 * We scrape classified listings and derive buy/sell reference prices from
 * the P25 and P75 of actual market prices, grouped by year/trim.
 * Results go into both listings (source='autocosmos') and price_guides.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db/connection');
const logger = require('../utils/logger');

const BASE_URL = 'https://www.autocosmos.com.mx';
const DELAY_MS = 3000;
const REQUEST_TIMEOUT = 25000;

const httpClient = axios.create({
  timeout: REQUEST_TIMEOUT,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.8,en-US;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  }
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parsePriceMXN(text) {
  if (!text) return null;
  const m = text.match(/[\d,]+/);
  if (!m) return null;
  const v = parseInt(m[0].replace(/,/g, ''), 10);
  return v >= 10000 && v <= 5000000 ? v : null;
}

function parseMileage(text) {
  if (!text) return null;
  const m = text.replace(/,/g, '').match(/\d+/);
  if (!m) return null;
  const v = parseInt(m[0], 10);
  return v >= 0 && v <= 600000 ? v : null;
}

function extractListings($, makeName, modelName) {
  const listings = [];

  // Autocosmos classified listing cards — try several selector patterns
  const cardSelectors = [
    '.multi-link-card',
    '.clasificado-card',
    '.listing-card',
    '[class*="clasificado"]',
    '[class*="listing"]',
    '[class*="card-auto"]',
    'article',
    '.resultado'
  ];

  let cards = $();
  for (const sel of cardSelectors) {
    cards = $(sel);
    if (cards.length > 1) break;
  }

  cards.each((_, card) => {
    const $c = $(card);
    const text = $c.text();

    // Must contain a year and price-like number
    if (!/20\d{2}/.test(text) || !/[\d,]{5,}/.test(text)) return;

    const yearM = text.match(/\b(20(1[5-9]|2[0-9]))\b/);
    const year = yearM ? parseInt(yearM[1], 10) : null;

    // Price: look for $NNN,NNN or NNN,NNN patterns
    const priceEl = $c.find('[class*="price"],[class*="precio"],[class*="monto"],[class*="valor"]').first();
    const priceText = priceEl.text() || (text.match(/\$[\s]?[\d,]+/g) || [])[0] || '';
    const price = parsePriceMXN(priceText);

    // Mileage
    const kmText = (text.match(/[\d,]+\s*(?:km|kms|kilómetros)/i) || [])[0] || '';
    const mileage = parseMileage(kmText);

    // Location
    const locEl = $c.find('[class*="location"],[class*="ciudad"],[class*="city"],[class*="estado"]').first();
    const locText = locEl.text().trim();
    const locParts = locText.split(',').map(s => s.trim());

    // Title / trim
    const title = $c.find('h2,h3,[class*="title"],[class*="name"]').first().text().trim()
      || `${makeName} ${modelName} ${year || ''}`;

    // Link
    const href = $c.find('a').first().attr('href') || '';
    const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    const idM = url.match(/\/(\d{4,})/);
    const externalId = `ac_${idM ? idM[1] : Date.now() + Math.random().toString(36).slice(2, 6)}`;

    // Thumbnail
    const thumbnail = $c.find('img').first().attr('src')
      || $c.find('img').first().attr('data-src') || null;

    if (!price || !year) return;

    listings.push({ externalId, makeName, modelName, year, price, mileage, city: locParts[0] || null, state: locParts[1] || null, title: title.slice(0, 250), url, thumbnail });
  });

  return listings;
}

async function upsertListing(l) {
  try {
    await db.query(
      `INSERT INTO listings
         (source, external_id, make_name, model_name, year, price_mxn, mileage_km,
          location_city, location_state, seller_type, title, url, thumbnail_url, scraped_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'private',$10,$11,$12,NOW())
       ON CONFLICT (external_id) DO UPDATE SET
         price_mxn = EXCLUDED.price_mxn, mileage_km = EXCLUDED.mileage_km,
         is_active = true, scraped_at = NOW(), updated_at = NOW()`,
      ['autocosmos', l.externalId, l.makeName, l.modelName, l.year,
       l.price, l.mileage, l.city, l.state, l.title, l.url, l.thumbnail]
    );
  } catch (err) {
    logger.warn(`Autocosmos listing upsert failed: ${err.message}`);
  }
}

async function deriveAndSavePriceGuide(listings, makeName, modelName) {
  // Group by year, compute P25 (buy) and P75 (sell) from actual classified prices
  const byYear = {};
  for (const l of listings) {
    if (!byYear[l.year]) byYear[l.year] = [];
    byYear[l.year].push(l.price);
  }

  for (const [yearStr, prices] of Object.entries(byYear)) {
    if (prices.length < 2) continue;
    const sorted = [...prices].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(sorted.length * 0.25)];
    const p75 = sorted[Math.floor(sorted.length * 0.75)];

    try {
      await db.query(
        `INSERT INTO price_guides (source, make_name, model_name, year, trim_name, buy_price_mxn, sell_price_mxn, scraped_at)
         VALUES ($1,$2,$3,$4,NULL,$5,$6,NOW())
         ON CONFLICT (source, make_name, model_name, year, trim_name) DO UPDATE SET
           buy_price_mxn = EXCLUDED.buy_price_mxn, sell_price_mxn = EXCLUDED.sell_price_mxn,
           scraped_at = NOW(), updated_at = NOW()`,
        ['autocosmos', makeName, modelName, parseInt(yearStr), p25, p75]
      );
    } catch (err) {
      logger.warn(`Price guide upsert failed: ${err.message}`);
    }
  }
}

async function scrapeModelPrices(makeName, modelName) {
  const makeSlug  = slugify(makeName);
  const modelSlug = slugify(modelName);

  // Try used listings page, then new page
  const urls = [
    `${BASE_URL}/auto/usado/${makeSlug}/${modelSlug}`,
    `${BASE_URL}/auto/usado/${makeSlug}`,
    `${BASE_URL}/clasificados?marca=${makeSlug}&modelo=${modelSlug}`
  ];

  let html = null;
  for (const url of urls) {
    try {
      const res = await httpClient.get(url);
      if (res.data && res.data.length > 10000) {
        html = res.data;
        logger.debug(`Autocosmos: got ${res.data.length}B from ${url}`);
        break;
      }
    } catch (err) {
      logger.debug(`Autocosmos fetch ${url}: ${err.message}`);
      await sleep(1000);
    }
  }

  if (!html) {
    logger.warn(`Autocosmos: no HTML for ${makeName} ${modelName}`);
    return 0;
  }

  const $ = cheerio.load(html);
  const listings = extractListings($, makeName, modelName);
  logger.info(`Autocosmos ${makeName} ${modelName}: ${listings.length} listings parsed`);

  for (const l of listings) {
    await upsertListing(l);
  }

  if (listings.length > 0) {
    await deriveAndSavePriceGuide(listings, makeName, modelName);
  }

  return listings.length;
}

const POPULAR_MODELS = [
  ['Nissan',     'Versa'],
  ['Nissan',     'Kicks'],
  ['Nissan',     'Sentra'],
  ['Chevrolet',  'Aveo'],
  ['Toyota',     'Corolla'],
  ['Volkswagen', 'Jetta'],
  ['Kia',        'Sportage'],
  ['Honda',      'Civic'],
  ['Honda',      'CR-V'],
  ['Mazda',      'CX-5'],
  ['Ford',       'F-150'],
  ['Hyundai',    'Tucson']
];

async function scrapeAllPriceGuides() {
  logger.info('Autocosmos scraper started');
  let total = 0;
  for (const [make, model] of POPULAR_MODELS) {
    const count = await scrapeModelPrices(make, model);
    total += count;
    await sleep(DELAY_MS);
  }
  await db.query(
    `UPDATE listings SET is_active = false
     WHERE source = 'autocosmos' AND scraped_at < NOW() - INTERVAL '48 hours' AND is_active = true`
  );
  logger.info(`Autocosmos done: ${total} listings → price guides derived`);
  return total;
}

module.exports = { scrapeAllPriceGuides, scrapeModelPrices };
