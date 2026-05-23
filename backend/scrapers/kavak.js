/**
 * Kavak.com Mexico Scraper
 * Kavak is a Next.js app. We try:
 *   1. Their internal REST API (used by mobile apps)
 *   2. __NEXT_DATA__ JSON embedded in the search/listing page
 *   3. Their ISR Next.js data endpoints
 */

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db/connection');
const logger = require('../utils/logger');

const BASE_URL  = 'https://www.kavak.com';
const DELAY_MS  = 2000;

// Known Kavak API base — reverse-engineered from mobile app traffic
const kavakApi = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'es-MX,es;q=0.9',
    'Origin': 'https://www.kavak.com',
    'Referer': 'https://www.kavak.com/mx/'
  }
});

const webClient = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.9'
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

function mapKavakCar(car, defaultMake, defaultModel) {
  const price    = parsePriceMXN(car.price || car.salePrice || car.listingPrice || car.amount);
  const year     = parseInt(car.year || car.modelYear || car.vehicleYear, 10) || null;
  const mileage  = parseMileage(car.mileage || car.km || car.kilometers || car.odometer);
  const makeName = car.make || car.brand || car.marca || defaultMake;
  const modelName= car.model || car.modelo || defaultModel;
  const trim     = car.trim || car.version || car.trimLevel || null;
  const city     = car.city || car.hubCity || car.location?.city || null;
  const state    = car.state || car.hubState || car.location?.state || null;
  const carId    = car.id || car.stockNumber || car.stockId || `${Date.now()}${Math.random().toString(36).slice(2,6)}`;
  const externalId = `kv_${carId}`;
  const slug     = [makeName, modelName, year, carId].join('-').toLowerCase().replace(/[\s]+/g, '-');
  const url      = car.url || `${BASE_URL}/mx/${slug}`;
  const title    = [year, makeName, modelName, trim].filter(Boolean).join(' ').slice(0, 250);
  const thumbnail= car.mainImage || car.imageUrl || car.thumbnail
    || (Array.isArray(car.images) ? car.images[0]?.url || car.images[0] : null) || null;
  return price && year ? { externalId, makeName, modelName, year, price, mileage, city, state, trim, title, url, thumbnail } : null;
}

async function tryKavakApi(makeName, modelName, page = 1) {
  // Multiple known/guessed Kavak API patterns
  const endpoints = [
    `https://api.kavak.com/v3/cars/list?country=MX&brand=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}&page=${page}&limit=24`,
    `https://api.kavak.com/catalog/v2/mx/cars?brand=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}&page=${page}`,
    `https://api.kavak.com/v5/car-query/search?country=MX&make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}&page=${page}`,
    `${BASE_URL}/api/catalog?country=mx&brand=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}&page=${page}`,
    `${BASE_URL}/api/v1/cars/search?country=mx&brand=${encodeURIComponent(makeName)}&model=${encodeURIComponent(modelName)}`
  ];

  for (const url of endpoints) {
    try {
      const res = await kavakApi.get(url);
      const data = res.data;
      const items = data?.results || data?.cars || data?.data?.cars || data?.data?.results || data?.items || [];
      if (Array.isArray(items) && items.length > 0) {
        logger.info(`Kavak API at ${url}: ${items.length} results`);
        return items;
      }
    } catch {
      // try next
    }
  }
  return null;
}

async function tryNextDataScrape(makeName, modelName) {
  const makeSlug  = makeName.toLowerCase().replace(/[\s/]+/g, '-');
  const modelSlug = modelName.toLowerCase().replace(/[\s/]+/g, '-');

  const urls = [
    `${BASE_URL}/mx/autos/${makeSlug}`,
    `${BASE_URL}/mx/autos/${makeSlug}-${modelSlug}`,
    `${BASE_URL}/mx/comprar/${makeSlug}/${modelSlug}`,
    `${BASE_URL}/mx/autos`
  ];

  for (const url of urls) {
    try {
      const res = await webClient.get(url);
      if (!res.data || res.data.length < 5000) continue;

      const $ = cheerio.load(res.data);
      const nextDataText = $('#__NEXT_DATA__').html();
      if (!nextDataText) continue;

      const nextData = JSON.parse(nextDataText);
      const props = nextData?.props?.pageProps;
      if (!props) continue;

      // Try many possible data paths in Next.js pageProps
      const candidates = [
        props.initialData?.results,
        props.initialData?.data?.results,
        props.cars,
        props.listings,
        props.inventory?.items,
        props.data?.cars,
        props.data?.results,
        props.data?.listings,
        props.serverSideProps?.cars
      ];

      for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length > 0) {
          logger.info(`Kavak __NEXT_DATA__ from ${url}: ${candidate.length} cars`);
          return candidate;
        }
      }
    } catch (err) {
      logger.debug(`Kavak ${url}: ${err.message}`);
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
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'dealer',$10,$11,$12,NOW())
       ON CONFLICT (external_id) DO UPDATE SET
         price_mxn = EXCLUDED.price_mxn, mileage_km = EXCLUDED.mileage_km,
         is_active = true, scraped_at = NOW(), updated_at = NOW()`,
      ['kavak', l.externalId, l.makeName, l.modelName, l.year,
       l.price, l.mileage, l.city, l.state, l.title, l.url, l.thumbnail]
    );
  } catch (err) {
    logger.warn(`Kavak upsert failed: ${err.message}`);
  }
}

async function scrapeModelListings(makeName, modelName) {
  logger.info(`Kavak: ${makeName} ${modelName}`);
  let listings = [];

  // Strategy 1: internal API
  const apiItems = await tryKavakApi(makeName, modelName);
  if (apiItems && apiItems.length > 0) {
    listings = apiItems.map(c => mapKavakCar(c, makeName, modelName)).filter(Boolean);
  }

  // Strategy 2: __NEXT_DATA__ scrape
  if (listings.length === 0) {
    const rawItems = await tryNextDataScrape(makeName, modelName);
    if (Array.isArray(rawItems)) {
      listings = rawItems.map(c => mapKavakCar(c, makeName, modelName)).filter(Boolean);
    }
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
  ['Toyota',     'RAV4'],
  ['Volkswagen', 'Jetta'],
  ['Kia',        'Sportage'],
  ['Honda',      'Civic'],
  ['Honda',      'CR-V'],
  ['Mazda',      'CX-5'],
  ['Ford',       'F-150'],
  ['Hyundai',    'Tucson']
];

async function scrapeAllListings() {
  logger.info('Kavak scraper started');
  let total = 0;
  for (const [make, model] of POPULAR_MODELS) {
    const count = await scrapeModelListings(make, model);
    total += count;
    await sleep(DELAY_MS);
  }
  await db.query(
    `UPDATE listings SET is_active = false
     WHERE source = 'kavak' AND scraped_at < NOW() - INTERVAL '48 hours' AND is_active = true`
  );
  logger.info(`Kavak done: ${total} listings`);
  return total;
}

module.exports = { scrapeAllListings, scrapeModelListings };
