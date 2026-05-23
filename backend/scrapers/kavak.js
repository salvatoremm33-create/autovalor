/**
 * Kavak.com Mexico Scraper
 * Kavak is a Next.js app — we extract inventory data from __NEXT_DATA__ JSON
 * embedded in each page, which includes full car details and fixed prices.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db/connection');
const logger = require('../utils/logger');

const BASE_URL = 'https://www.kavak.com';
const API_BASE  = 'https://www.kavak.com/api';
const DELAY_MS  = 2000;
const MAX_PAGES = 5;

const httpClient = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.9',
    'Referer': 'https://www.kavak.com/mx/'
  }
});

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function parsePriceMXN(value) {
  if (value == null) return null;
  const num = typeof value === 'number' ? value : parseInt(String(value).replace(/[^\d]/g, ''), 10);
  return isNaN(num) || num < 10000 || num > 5000000 ? null : num;
}

function parseMileage(value) {
  if (value == null) return null;
  const num = typeof value === 'number' ? value : parseInt(String(value).replace(/[^\d]/g, ''), 10);
  return isNaN(num) || num < 0 || num > 500000 ? null : num;
}

function mapKavakCar(car, makeName, modelName) {
  // Kavak's JSON structure (may vary, handle multiple shapes)
  const price    = parsePriceMXN(car.price || car.salePrice || car.listingPrice);
  const year     = parseInt(car.year || car.modelYear, 10) || null;
  const mileage  = parseMileage(car.mileage || car.km || car.kilometers);
  const city     = car.city || car.location?.city || car.hubCity || null;
  const state    = car.state || car.location?.state || null;
  const carMake  = car.make || car.brand || makeName;
  const carModel = car.model || modelName;
  const trim     = car.trim || car.version || car.trimLevel || null;
  const color    = car.color || car.exteriorColor || null;
  const carId    = car.id || car.stockNumber || car.carId || `kv_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const externalId = `kv_${carId}`;

  const slug = [carMake, carModel, year, carId].join('-').toLowerCase().replace(/\s+/g, '-');
  const url  = `${BASE_URL}/mx/${slug}`;
  const title = [year, carMake, carModel, trim].filter(Boolean).join(' ');
  const thumbnail = car.mainImage || car.imageUrl || car.thumbnail
    || (Array.isArray(car.images) ? car.images[0] : null) || null;

  if (!price || !year) return null;

  return {
    externalId,
    makeName: carMake,
    modelName: carModel,
    year,
    price,
    mileage,
    city,
    state,
    sellerType: 'dealer',
    title: title.slice(0, 250),
    url,
    thumbnail
  };
}

async function extractNextData(url) {
  try {
    const res = await httpClient.get(url);
    const $ = cheerio.load(res.data);
    const nextDataEl = $('#__NEXT_DATA__');
    if (!nextDataEl.length) return null;
    return JSON.parse(nextDataEl.html());
  } catch (err) {
    logger.warn(`Kavak page fetch failed ${url}: ${err.message}`);
    return null;
  }
}

function extractCarsFromNextData(nextData, makeName, modelName) {
  if (!nextData) return [];

  const cars = [];
  const props = nextData?.props?.pageProps;
  if (!props) return cars;

  // Try common data paths Kavak Next.js apps use
  const candidates = [
    props.initialData?.results,
    props.cars,
    props.listings,
    props.inventory,
    props.data?.cars,
    props.data?.results,
    props.initialState?.catalog?.cars,
    props.dehydratedState?.queries?.[0]?.state?.data?.pages?.[0]?.results
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      for (const car of candidate) {
        const mapped = mapKavakCar(car, makeName, modelName);
        if (mapped) cars.push(mapped);
      }
      break;
    }
  }

  return cars;
}

async function fetchKavakApiPage(makeName, modelName, page) {
  // Kavak's internal search API (reverse-engineered from network tab)
  // They may change this, so we catch errors gracefully
  try {
    const res = await apiClient.get('/mx/cars', {
      params: {
        make: makeName,
        model: modelName,
        page,
        pageSize: 24,
        country: 'mx',
        sortBy: 'price_asc'
      }
    });
    const data = res.data;
    const results = data.results || data.cars || data.data || [];
    const total   = data.total  || data.totalCount || 0;
    return { results: Array.isArray(results) ? results : [], total };
  } catch {
    return { results: [], total: 0 };
  }
}

async function upsertListing(listing) {
  try {
    await db.query(
      `INSERT INTO listings
         (source, external_id, make_name, model_name, year, price_mxn, mileage_km,
          location_city, location_state, seller_type, title, url, thumbnail_url, scraped_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
       ON CONFLICT (external_id) DO UPDATE SET
         price_mxn   = EXCLUDED.price_mxn,
         mileage_km  = EXCLUDED.mileage_km,
         is_active   = true,
         scraped_at  = NOW(),
         updated_at  = NOW()`,
      [
        'kavak',
        listing.externalId,
        listing.makeName,
        listing.modelName,
        listing.year,
        listing.price,
        listing.mileage,
        listing.city,
        listing.state,
        'dealer',
        listing.title,
        listing.url,
        listing.thumbnail
      ]
    );
  } catch (err) {
    logger.warn(`Kavak upsert failed ${listing.externalId}: ${err.message}`);
  }
}

async function scrapeModelListings(makeName, modelName) {
  logger.info(`Kavak scraping: ${makeName} ${modelName}`);
  let totalSaved = 0;

  // Strategy 1: internal API
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { results, total } = await fetchKavakApiPage(makeName, modelName, page);

    if (results.length === 0) break;

    for (const car of results) {
      const mapped = mapKavakCar(car, makeName, modelName);
      if (!mapped) continue;
      await upsertListing(mapped);
      totalSaved++;
    }

    if (totalSaved >= total || totalSaved >= MAX_PAGES * 24) break;
    await sleep(DELAY_MS);
  }

  // Strategy 2: __NEXT_DATA__ HTML scrape if API returned nothing
  if (totalSaved === 0) {
    const makeSlug  = makeName.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = modelName.toLowerCase().replace(/\s+/g, '-');
    const url = `${BASE_URL}/mx/comprar/${makeSlug}/${modelSlug}`;
    const nextData = await extractNextData(url);
    const cars = extractCarsFromNextData(nextData, makeName, modelName);

    for (const car of cars) {
      await upsertListing(car);
      totalSaved++;
    }
  }

  logger.info(`Kavak ${makeName} ${modelName}: ${totalSaved} listings saved`);
  return totalSaved;
}

const POPULAR_MODELS = [
  ['Nissan',     'Versa'],
  ['Nissan',     'Kicks'],
  ['Nissan',     'Sentra'],
  ['Chevrolet',  'Aveo'],
  ['Chevrolet',  'Equinox'],
  ['Toyota',     'Corolla'],
  ['Toyota',     'RAV4'],
  ['Volkswagen', 'Jetta'],
  ['Volkswagen', 'Tiguan'],
  ['Kia',        'Sportage'],
  ['Kia',        'Rio'],
  ['Honda',      'Civic'],
  ['Honda',      'CR-V'],
  ['Mazda',      'CX-5'],
  ['Ford',       'F-150'],
  ['Hyundai',    'Tucson'],
  ['BMW',        '3 Series'],
  ['Mercedes',   'C-Class'],
  ['Audi',       'A3']
];

async function scrapeAllListings() {
  logger.info('Kavak scraper started');
  let total = 0;
  for (const [make, model] of POPULAR_MODELS) {
    const count = await scrapeModelListings(make, model);
    total += count;
    await sleep(DELAY_MS);
  }

  // Mark stale Kavak listings inactive
  await db.query(
    `UPDATE listings SET is_active = false
     WHERE source = 'kavak' AND scraped_at < NOW() - INTERVAL '48 hours' AND is_active = true`
  );

  logger.info(`Kavak scraper done: ${total} listings saved`);
  return total;
}

module.exports = { scrapeAllListings, scrapeModelListings };
