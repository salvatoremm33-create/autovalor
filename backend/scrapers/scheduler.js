/**
 * Nightly scraper scheduler.
 * Runs all scrapers sequentially so they don't hammer sites simultaneously.
 * Called by the cron job in server.js.
 */

const logger = require('../utils/logger');

async function runNightlyScrapers() {
  const startedAt = Date.now();
  logger.info('=== Nightly scraper run started ===');

  const results = {};

  // 1. Autocosmos price guides
  try {
    const { scrapeAllPriceGuides } = require('./autocosmos');
    results.autocosmos = await scrapeAllPriceGuides();
    logger.info(`Autocosmos done: ${results.autocosmos} price entries`);
  } catch (err) {
    logger.error(`Autocosmos scraper error: ${err.message}`);
    results.autocosmos = 0;
  }

  // 2. Seminuevos listings
  try {
    const { scrapeAllListings: scrapeSeminuevos } = require('./seminuevos');
    results.seminuevos = await scrapeSeminuevos();
    logger.info(`Seminuevos done: ${results.seminuevos} listings`);
  } catch (err) {
    logger.error(`Seminuevos scraper error: ${err.message}`);
    results.seminuevos = 0;
  }

  // 3. Kavak listings
  try {
    const { scrapeAllListings: scrapeKavak } = require('./kavak');
    results.kavak = await scrapeKavak();
    logger.info(`Kavak done: ${results.kavak} listings`);
  } catch (err) {
    logger.error(`Kavak scraper error: ${err.message}`);
    results.kavak = 0;
  }

  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  logger.info(`=== Nightly scraper run complete in ${elapsed}s — autocosmos:${results.autocosmos} seminuevos:${results.seminuevos} kavak:${results.kavak} ===`);
  return results;
}

module.exports = { runNightlyScrapers };
