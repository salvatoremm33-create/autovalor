const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// In-memory scrape state (resets on server restart)
let scrapeState = {
  running: false,
  startedAt: null,
  completedAt: null,
  result: null,
  error: null
};

function requireToken(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  const expected = process.env.ADMIN_TOKEN || 'autovalor-admin';
  if (token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /api/admin/scrape — kick off all scrapers in the background
router.post('/scrape', requireToken, (req, res) => {
  if (scrapeState.running) {
    return res.json({
      status: 'already_running',
      startedAt: scrapeState.startedAt,
      message: 'Scrapers are already running. Poll /api/admin/scrape/status for progress.'
    });
  }

  const startedAt = new Date().toISOString();
  scrapeState = { running: true, startedAt, completedAt: null, result: null, error: null };
  logger.info('Admin: manual scrape triggered');

  // Fire-and-forget — response returns immediately
  (async () => {
    try {
      // Seed reference prices first (fast, always works)
      const { seedPriceGuides } = require('../db/seed_price_guides');
      const seeded = await seedPriceGuides();
      logger.info(`Price guide seed: ${seeded} entries`);

      const { runNightlyScrapers } = require('../scrapers/scheduler');
      const result = await runNightlyScrapers();
      result.priceGuideSeed = seeded;
      scrapeState = { running: false, startedAt, completedAt: new Date().toISOString(), result, error: null };
      logger.info('Admin scrape completed:', result);
    } catch (err) {
      scrapeState = { running: false, startedAt, completedAt: new Date().toISOString(), result: null, error: err.message };
      logger.error('Admin scrape failed:', err.message);
    }
  })();

  res.json({
    status: 'started',
    startedAt: scrapeState.startedAt,
    message: 'All scrapers running in background. Poll GET /api/admin/scrape/status for results.'
  });
});

// GET /api/admin/scrape/status
router.get('/scrape/status', requireToken, (req, res) => {
  res.json(scrapeState);
});

// GET /api/admin/preview?url=... — fetch a URL and return structure info
router.get('/preview', requireToken, async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url param required' });
  try {
    const axios = require('axios');
    const cheerio = require('cheerio');
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9'
      }
    });
    const $ = cheerio.load(resp.data);

    // Collect all script tags with type or containing JSON-like data
    const scripts = [];
    $('script').each((_, el) => {
      const type = $(el).attr('type') || '';
      const id   = $(el).attr('id') || '';
      const src  = $(el).attr('src') || '';
      const text = ($(el).html() || '').slice(0, 400);
      if (type === 'application/ld+json' || id === '__NEXT_DATA__' || text.includes('precio') || text.includes('price')) {
        scripts.push({ type, id, src: src.slice(0, 80), preview: text });
      }
    });

    // Collect classes that look price/listing related
    const interestingClasses = new Set();
    $('[class]').each((_, el) => {
      const cls = ($(el).attr('class') || '').split(/\s+/);
      for (const c of cls) {
        if (/price|precio|listing|card|vehicle|car|version|result/i.test(c)) {
          interestingClasses.add(c);
        }
      }
    });

    // Collect car-related links
    const links = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (/nissan|toyota|honda|volkswagen|chevrolet|mazda|ford|kia|auto|car|precio|listing|versa|jetta|civic/i.test(href)) {
        links.push(href.slice(0, 120));
      }
    });

    res.json({
      status: resp.status,
      htmlLength: resp.data.length,
      title: $('title').text(),
      scripts,
      interestingClasses: [...interestingClasses].slice(0, 40),
      carLinks: [...new Set(links)].slice(0, 20),
      bodyPreview: ($('body').text() || '').replace(/\s+/g, ' ').slice(0, 600),
      rawHtml: (resp.data || '').slice(0, 3000)
    });
  } catch (err) {
    res.json({ error: err.message, code: err.response?.status });
  }
});

// GET /api/admin/diag — module health check
router.get('/diag', requireToken, (req, res) => {
  const mods = {};
  for (const name of ['cheerio', 'axios', 'pg']) {
    try { require(name); mods[name] = 'ok'; } catch (e) { mods[name] = e.message; }
  }
  for (const name of ['./autocosmos', './seminuevos', './kavak', './scheduler'].map(p => require('path').join(__dirname, '..', 'scrapers', p.slice(2)))) {
    const key = require('path').basename(name, '.js');
    try { require(name); mods[key] = 'ok'; } catch (e) { mods[key] = e.message; }
  }
  res.json({ node: process.version, env: process.env.NODE_ENV, modules: mods });
});

module.exports = router;
