/**
 * Seminuevos.com Listings Scraper
 * Seminuevos is a React SPA — content is client-side rendered.
 * We try their internal search API (reverse-engineered) and fall back
 * to page HTML parsing. Returns 0 gracefully when blocked.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db/connection');
const logger = require('../utils/logger');

const BASE_URL = 'https://www.seminuevos.com';
const DELAY_MS = 2500;

const httpClient = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'es-MX,es;q=0.9',
    'Referer': 'https://www.seminuevos.com/'
  }
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function parsePriceMXN(v) {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return !isNaN(n) && n >= 10000 && n <= 5000000 ? n : null;
}

function parseMileage(v) {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return !isNaN(n) && n >= 0 && n <= 600000 ? n : null;
}

async function tryInternalApi(makeName, modelName, page = 1) {
  // Seminuevos has an undocumented REST API used by their mobile app
  const apiUrls = [
    `${BASE_URL}/api/search?brand=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}&page=${page}`,
    `${BASE_URL}/api/v1/cars?brand=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}&page=${page}`,
    `${BASE_URL}/api/listings?marca=${encodeURIComponent(makeName)}&modelo=${encodeURIComponent(modelName)}&pagina=${page}`,
    `https://api.seminuevos.com/v1/inventory?brand=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}&page=${page}`
  ];

  for (const url of apiUrls) {
    try {
      const res = await httpClient.get(url, { headers: { Accept: 'application/json' } });
      const data = res.data;
      if (data && (Array.isArray(data.results) || Array.isArray(data.listings) || Array.isArray(data.cars))) {
        const items = data.results || data.listings || data.cars || [];
        logger.info(`Seminuevos API found at ${url}: ${items.length} results`);
        return items;
      }
    } catch {
      // try next URL
    }
  }
  return null;
}

function mapApiCar(car, makeName, modelName) {
  const price    = parsePriceMXN(car.price || car.precio || car.monto);
  const year     = parseInt(car.year || car.anio || car.modelo, 10) || null;
  const mileage  = parseMileage(car.mileage || car.km || car.kilometraje);
  const city     = car.city || car.ciudad || car.location?.city || null;
  const state    = car.state || car.estado || car.location?.state || null;
  const carId    = car.id || car.slug || `${Date.now()}${Math.random().toString(36).slice(2,6)}`;
  const externalId = `sn_${carId}`;
  const url      = car.url || car.link || `${BASE_URL}/${carId}`;
  const title    = car.title || car.titulo || `${year || ''} ${car.make || makeName} ${car.model || modelName}`.trim();
  return price && year ? { externalId, makeName: car.make || makeName, modelName: car.model || modelName, year, price, mileage, city, state, title: title.slice(0, 250), url, thumbnail: car.image || car.foto || null } : null;
}

async function tryHtmlScrape(makeName, modelName) {
  // Try several URL patterns for SSR or HTML responses
  const makeSlug  = makeName.toLowerCase().replace(/\s+/g, '-');
  const modelSlug = modelName.toLowerCase().replace(/\s+/g, '-');

  const urls = [
    `${BASE_URL}/${makeName}/${modelName}`,
    `${BASE_URL}/${makeSlug}-${modelSlug}`,
    `${BASE_URL}/autos/${makeSlug}/${modelSlug}`,
    `${BASE_URL}/buscar?q=${encodeURIComponent(makeName + ' ' + modelName)}`
  ];

  for (const url of urls) {
    try {
      const res = await httpClient.get(url, { headers: { Accept: 'text/html' } });
      if (!res.data || res.data.length < 5000) continue;

      const $ = cheerio.load(res.data);
      const listings = [];

      // Try to find listing cards
      $('article, [class*="card"], [class*="listing"], [class*="resultado"]').each((_, el) => {
        const $el = $(el);
        const text = $el.text();
        const yearM = text.match(/\b(20(1[5-9]|2[0-9]))\b/);
        const priceM = text.match(/\$[\s]?([\d,]+)/);
        if (!yearM || !priceM) return;

        const price = parsePriceMXN(priceM[1]);
        const year = parseInt(yearM[1], 10);
        if (!price || !year) return;

        const href = $el.find('a').first().attr('href') || '';
        const absUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        const idM = absUrl.match(/\/(\d{5,})/);
        const externalId = `sn_${idM ? idM[1] : Date.now() + Math.random().toString(36).slice(2,5)}`;
        const kmM = text.match(/[\d,]+\s*km/i);

        listings.push({
          externalId, makeName, modelName, year, price,
          mileage: parseMileage((kmM || [])[0]),
          city: null, state: null,
          title: `${year} ${makeName} ${modelName}`.slice(0, 250),
          url: absUrl, thumbnail: $el.find('img').first().attr('src') || null
        });
      });

      if (listings.length > 0) {
        logger.info(`Seminuevos HTML ${url}: ${listings.length} listings`);
        return listings;
      }
    } catch (err) {
      logger.debug(`Seminuevos HTML ${url}: ${err.message}`);
    }
    await sleep(1000);
  }
  return [];
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
      ['seminuevos', l.externalId, l.makeName, l.modelName, l.year,
       l.price, l.mileage, l.city, l.state, l.title, l.url, l.thumbnail]
    );
  } catch (err) {
    logger.warn(`Seminuevos upsert failed: ${err.message}`);
  }
}

async function scrapeModelListings(makeName, modelName) {
  logger.info(`Seminuevos: ${makeName} ${modelName}`);
  let listings = [];

  // Strategy 1: internal API
  const apiResults = await tryInternalApi(makeName, modelName);
  if (apiResults && apiResults.length > 0) {
    listings = apiResults.map(c => mapApiCar(c, makeName, modelName)).filter(Boolean);
  }

  // Strategy 2: HTML scrape
  if (listings.length === 0) {
    listings = await tryHtmlScrape(makeName, modelName);
  }

  for (const l of listings) {
    await upsertListing(l);
  }
  return listings.length;
}

const POPULAR_MODELS = [
  ['Nissan',     'Versa'],
  ['Nissan',     'Kicks'],
  ['Chevrolet',  'Aveo'],
  ['Toyota',     'Corolla'],
  ['Volkswagen', 'Jetta'],
  ['Kia',        'Sportage'],
  ['Honda',      'Civic'],
  ['Mazda',      'CX-5'],
  ['Ford',       'F-150'],
  ['Hyundai',    'Tucson']
];

async function scrapeAllListings() {
  logger.info('Seminuevos scraper started');
  let total = 0;
  for (const [make, model] of POPULAR_MODELS) {
    const count = await scrapeModelListings(make, model);
    total += count;
    await sleep(DELAY_MS);
  }
  await db.query(
    `UPDATE listings SET is_active = false
     WHERE source = 'seminuevos' AND scraped_at < NOW() - INTERVAL '48 hours' AND is_active = true`
  );
  logger.info(`Seminuevos done: ${total} listings`);
  return total;
}

module.exports = { scrapeAllListings, scrapeModelListings };
