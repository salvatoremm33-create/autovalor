require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta más tarde' }
});
app.use('/api/', apiLimiter);

const scrapeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Límite de búsquedas alcanzado' }
});

app.use('/api/makes', require('./routes/makes'));
app.use('/api/models', require('./routes/models'));
app.use('/api/years', require('./routes/years'));
app.use('/api/trims', require('./routes/trims'));
app.use('/api/prices', require('./routes/prices'));
app.use('/api/listings', scrapeLimiter, require('./routes/listings'));
app.use('/api/financing', require('./routes/financing'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AutoValor API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.use(require('./middleware/errorHandler'));

// Scheduled scraping every 6 hours
const intervalHours = parseInt(process.env.SCRAPE_INTERVAL_HOURS || '6');
cron.schedule(`0 */${intervalHours} * * *`, async () => {
  logger.info('Running scheduled MercadoLibre scrape...');
  try {
    const scraper = require('./scrapers/mercadolibre');
    await scraper.scrapePopularModels();
    logger.info('Scheduled scrape completed successfully');
  } catch (err) {
    logger.error('Scheduled scrape failed:', err.message);
  }
});

app.listen(PORT, () => {
  logger.info(`AutoValor backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
