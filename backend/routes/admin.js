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

  scrapeState = { running: true, startedAt: new Date().toISOString(), completedAt: null, result: null, error: null };
  logger.info('Admin: manual scrape triggered');

  // Fire-and-forget — response returns immediately
  (async () => {
    try {
      const { runNightlyScrapers } = require('../scrapers/scheduler');
      const result = await runNightlyScrapers();
      scrapeState = { running: false, startedAt: scrapeState.startedAt, completedAt: new Date().toISOString(), result, error: null };
      logger.info('Admin scrape completed:', result);
    } catch (err) {
      scrapeState = { running: false, startedAt: scrapeState.startedAt, completedAt: new Date().toISOString(), result: null, error: err.message };
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

module.exports = router;
