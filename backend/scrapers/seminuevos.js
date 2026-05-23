/**
 * Seminuevos.com Listings Scraper
 * Extracts real used-car listings (price, mileage, city) from Mexico's
 * largest used-car classified site and stores them in the listings table.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db/connection');
const logger = require('../utils/logger');

const BASE_URL = 'https://www.seminuevos.com';
const DELAY_MS = 2000;
const MAX_PAGES = 3;

const httpClient = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.9',
    'Referer': 'https://www.seminuevos.com/'
  }
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function parsePriceMXN(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^\d]/g, '');
  const value = parseInt(cleaned, 10);
  return isNaN(value) || value < 10000 || value > 5000000 ? null : value;
}

function parseMileage(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^\d]/g, '');
  const value = parseInt(cleaned, 10);
  return isNaN(value) || value < 0 || value > 500000 ? null : value;
}

function buildSearchUrl(makeName, modelName, page = 1) {
  const makeSlug = makeName.toLowerCase().replace(/\s+/g, '-');
  const modelSlug = modelName.toLowerCase().replace(/\s+/g, '-');
  const offset = (page - 1) * 20;
  return `${BASE_URL}/autos/${makeSlug}/${modelSlug}?page=${page}&offset=${offset}`;
}

async function fetchPage(url) {
  try {
    const res = await httpClient.get(url);
    return res.data;
  } catch (err) {
    logger.warn(`Seminuevos fetch failed ${url}: ${err.message}`);
    return null;
  }
}

function parseListings($, makeName, modelName) {
  const listings = [];

  // Primary selector for seminuevos listing cards
  const cardSelectors = [
    '[class*="listing-card"]',
    '[class*="vehicleCard"]',
    '[class*="car-card"]',
    'article[class*="card"]',
    '.listing',
    '[data-testid*="listing"]'
  ];

  let cards = $();
  for (const sel of cardSelectors) {
    cards = $(sel);
    if (cards.length > 0) break;
  }

  // Fallback: find divs/articles containing both a price and a year
  if (cards.length === 0) {
    $('article, .result, li[class*="result"]').each((_, el) => {
      const text = $(el).text();
      if (/\$[\s]?[\d,]+/.test(text) && /20\d{2}/.test(text)) {
        cards = cards.add(el);
      }
    });
  }

  cards.each((_, card) => {
    const $card = $(card);
    const fullText = $card.text();

    // Title
    const title = $card.find('h2, h3, [class*="title"], [class*="name"]').first().text().trim()
      || `${makeName} ${modelName}`;

    // Year from title or attribute
    const yearMatch = (title + fullText).match(/\b(201[5-9]|202[0-9])\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

    // Price
    const priceEl = $card.find('[class*="price"], [class*="precio"], [itemprop="price"]').first();
    const priceText = priceEl.text() || $card.find('[class*="monto"]').first().text();
    const price = parsePriceMXN(priceText);

    // Mileage
    const kmEl = $card.find('[class*="mileage"], [class*="km"], [class*="kilometraje"]').first();
    const kmText = kmEl.text() || (fullText.match(/[\d,]+\s*km/i) || [])[0] || '';
    const mileage = parseMileage(kmText);

    // Location
    const locEl = $card.find('[class*="location"], [class*="ciudad"], [class*="city"]').first();
    const locationText = locEl.text().trim();
    const locationParts = locationText.split(',').map(s => s.trim());
    const city  = locationParts[0] || null;
    const state = locationParts[1] || null;

    // URL
    const href = $card.find('a').first().attr('href') || '';
    const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    // Thumbnail
    const thumbnail = $card.find('img').first().attr('src')
      || $card.find('img').first().attr('data-src') || null;

    // Seller type
    const isDealer = /agencia|concesionaria|distribuidor/i.test(fullText);

    // External ID from URL or data attribute
    const idMatch = url.match(/\/(\d{5,})/);
    const externalId = idMatch ? `sn_${idMatch[1]}` : `sn_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

    if (!price || !year) return;

    listings.push({
      externalId,
      makeName,
      modelName,
      year,
      price,
      mileage,
      city,
      state,
      sellerType: isDealer ? 'dealer' : 'private',
      title: title.slice(0, 250),
      url,
      thumbnail
    });
  });

  return listings;
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
        'seminuevos',
        listing.externalId,
        listing.makeName,
        listing.modelName,
        listing.year,
        listing.price,
        listing.mileage,
        listing.city,
        listing.state,
        listing.sellerType,
        listing.title,
        listing.url,
        listing.thumbnail
      ]
    );
  } catch (err) {
    logger.warn(`Seminuevos upsert failed ${listing.externalId}: ${err.message}`);
  }
}

async function scrapeModelListings(makeName, modelName) {
  logger.info(`Seminuevos scraping: ${makeName} ${modelName}`);
  let totalSaved = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = buildSearchUrl(makeName, modelName, page);
    const html = await fetchPage(url);
    if (!html) break;

    const $ = cheerio.load(html);
    const listings = parseListings($, makeName, modelName);
    logger.debug(`Seminuevos ${makeName} ${modelName} page ${page}: ${listings.length} listings`);

    if (listings.length === 0) break;

    for (const listing of listings) {
      await upsertListing(listing);
      totalSaved++;
    }

    await sleep(DELAY_MS);
  }

  return totalSaved;
}

const POPULAR_MODELS = [
  ['Nissan',     'Versa'],
  ['Nissan',     'Kicks'],
  ['Nissan',     'Sentra'],
  ['Chevrolet',  'Aveo'],
  ['Chevrolet',  'Equinox'],
  ['Toyota',     'Corolla'],
  ['Toyota',     'Camry'],
  ['Volkswagen', 'Jetta'],
  ['Volkswagen', 'Tiguan'],
  ['Kia',        'Sportage'],
  ['Kia',        'Rio'],
  ['Honda',      'Civic'],
  ['Honda',      'CR-V'],
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

  // Mark stale listings inactive
  await db.query(
    `UPDATE listings SET is_active = false
     WHERE source = 'seminuevos' AND scraped_at < NOW() - INTERVAL '48 hours' AND is_active = true`
  );

  logger.info(`Seminuevos scraper done: ${total} listings saved`);
  return total;
}

module.exports = { scrapeAllListings, scrapeModelListings };
