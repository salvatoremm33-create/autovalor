/**
 * Autocosmos.com.mx Price Guide Scraper
 * Extracts make/model/year/trim buy & sell reference prices.
 * URL pattern: https://www.autocosmos.com.mx/auto/{make}/{model}
 */

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db/connection');
const logger = require('../utils/logger');

const BASE_URL = 'https://www.autocosmos.com.mx';
const DELAY_MS = 1500;

const httpClient = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.9,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive'
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
  const cleaned = text.replace(/[^\d]/g, '');
  const value = parseInt(cleaned, 10);
  return isNaN(value) || value < 10000 ? null : value;
}

async function scrapeModelPrices(makeName, modelName) {
  const makeSlug = slugify(makeName);
  const modelSlug = slugify(modelName);
  const url = `${BASE_URL}/auto/${makeSlug}/${modelSlug}`;

  let html;
  try {
    const res = await httpClient.get(url);
    html = res.data;
  } catch (err) {
    logger.warn(`Autocosmos fetch failed for ${makeName} ${modelName}: ${err.message}`);
    return 0;
  }

  const $ = cheerio.load(html);
  const rows = [];

  // Autocosmos shows a table/list of versions with year and prices.
  // Structure: each version row has year, trim name, buy price, sell price.
  // Selector targets their version table rows.
  $('table.version-table tr, .version-row, [class*="version"]').each((_, el) => {
    const cells = $(el).find('td, [class*="cell"], [class*="col"]');
    if (cells.length < 3) return;

    const yearText = $(cells[0]).text().trim();
    const trimText = $(cells[1]).text().trim();
    const buyText  = $(cells[2]).text().trim();
    const sellText = $(cells[3] || cells[2]).text().trim();

    const year = parseInt(yearText, 10);
    if (!year || year < 2000 || year > 2030) return;

    rows.push({
      year,
      trim: trimText || null,
      buyPrice: parsePriceMXN(buyText),
      sellPrice: parsePriceMXN(sellText)
    });
  });

  // Fallback: look for JSON-LD or structured data
  if (rows.length === 0) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Car' || item['@type'] === 'Vehicle') {
            const year = parseInt(item.vehicleModelDate || item.modelDate, 10);
            const price = parsePriceMXN(String(item.price || item.offers?.price || ''));
            if (year && price) {
              rows.push({ year, trim: item.name || null, buyPrice: price, sellPrice: Math.round(price * 1.08) });
            }
          }
        }
      } catch {}
    });
  }

  // Fallback: extract any price-like text near year mentions
  if (rows.length === 0) {
    const currentYear = new Date().getFullYear();
    $('[class*="precio"], [class*="price"], [class*="valor"]').each((_, el) => {
      const text = $(el).closest('[class*="row"], [class*="item"], li, tr').text();
      const yearMatch = text.match(/20(1[5-9]|2[0-9])/);
      const priceMatches = text.match(/\$[\s]?[\d,]+/g);
      if (yearMatch && priceMatches && priceMatches.length >= 1) {
        const year = parseInt(yearMatch[0], 10);
        const buy  = parsePriceMXN(priceMatches[0]);
        const sell = parsePriceMXN(priceMatches[1] || priceMatches[0]);
        if (year && buy) rows.push({ year, trim: null, buyPrice: buy, sellPrice: sell });
      }
    });
  }

  let upserted = 0;
  for (const row of rows) {
    try {
      await db.query(
        `INSERT INTO price_guides (source, make_name, model_name, year, trim_name, buy_price_mxn, sell_price_mxn, scraped_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
         ON CONFLICT (source, make_name, model_name, year, trim_name) DO UPDATE SET
           buy_price_mxn  = EXCLUDED.buy_price_mxn,
           sell_price_mxn = EXCLUDED.sell_price_mxn,
           scraped_at     = NOW(),
           updated_at     = NOW()`,
        ['autocosmos', makeName, modelName, row.year, row.trim, row.buyPrice, row.sellPrice]
      );
      upserted++;
    } catch (err) {
      logger.warn(`Autocosmos upsert failed: ${err.message}`);
    }
  }

  logger.info(`Autocosmos ${makeName} ${modelName}: ${upserted} price entries saved`);
  return upserted;
}

const POPULAR_MODELS = [
  ['Nissan',      'Versa'],
  ['Nissan',      'Kicks'],
  ['Nissan',      'Sentra'],
  ['Chevrolet',   'Aveo'],
  ['Chevrolet',   'Equinox'],
  ['Toyota',      'Corolla'],
  ['Toyota',      'Camry'],
  ['Toyota',      'RAV4'],
  ['Volkswagen',  'Jetta'],
  ['Volkswagen',  'Tiguan'],
  ['Kia',         'Sportage'],
  ['Kia',         'Rio'],
  ['Honda',       'Civic'],
  ['Honda',       'CR-V'],
  ['Mazda',       'CX-5'],
  ['Mazda',       'Mazda3'],
  ['Ford',        'F-150'],
  ['Ford',        'Escape'],
  ['Hyundai',     'Tucson'],
  ['Hyundai',     'Accent']
];

async function scrapeAllPriceGuides() {
  logger.info('Autocosmos scraper started');
  let total = 0;
  for (const [make, model] of POPULAR_MODELS) {
    const count = await scrapeModelPrices(make, model);
    total += count;
    await sleep(DELAY_MS);
  }
  logger.info(`Autocosmos scraper done: ${total} total entries`);
  return total;
}

module.exports = { scrapeAllPriceGuides, scrapeModelPrices };
