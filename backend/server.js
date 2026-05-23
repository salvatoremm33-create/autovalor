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
const allowedOrigins = [
  'http://localhost:3000',
  'https://autovalor.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / curl requests (no origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin === o || origin.endsWith('.vercel.app'))) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
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
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AutoValor API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.use(require('./middleware/errorHandler'));

// Auto-migrate and seed on startup
const { initDatabase } = require('./db/init');

// MercadoLibre — every 6 hours
const intervalHours = parseInt(process.env.SCRAPE_INTERVAL_HOURS || '6');
cron.schedule(`0 */${intervalHours} * * *`, async () => {
  logger.info('Running scheduled MercadoLibre scrape...');
  try {
    const scraper = require('./scrapers/mercadolibre');
    await scraper.scrapePopularModels();
    logger.info('Scheduled MercadoLibre scrape completed');
  } catch (err) {
    logger.error('Scheduled MercadoLibre scrape failed:', err.message);
  }
});

// Nightly scrapers — Autocosmos, Seminuevos, Kavak at 03:00 MX time
cron.schedule('0 3 * * *', async () => {
  logger.info('Running nightly scrapers (Autocosmos, Seminuevos, Kavak)...');
  try {
    const { runNightlyScrapers } = require('./scrapers/scheduler');
    await runNightlyScrapers();
  } catch (err) {
    logger.error('Nightly scrapers failed:', err.message);
  }
}, { timezone: 'America/Mexico_City' });

async function startServer() {
  try {
    await initDatabase();
  } catch (err) {
    logger.error('Database init failed — starting anyway:', err.message);
  }

  app.listen(PORT, () => {
    logger.info(`AutoValor backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer();

module.exports = app;
