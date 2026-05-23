const fs   = require('fs');
const path = require('path');
const db   = require('./connection');
const logger = require('../utils/logger');

async function runMigrations() {
  for (const file of ['001_initial.sql', '002_price_guides.sql']) {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf8');
    await db.query(sql);
  }
  logger.info('DB migrations applied');
}

async function runSeedIfEmpty() {
  // Guard: only seed when makes table exists and is empty
  try {
    const { rows } = await db.query('SELECT COUNT(*) AS n FROM makes');
    if (parseInt(rows[0].n, 10) > 0) {
      logger.info(`DB already seeded (${rows[0].n} makes) — skipping`);
      return;
    }
  } catch {
    // Table doesn't exist yet; migrations just created it — fall through to seed
  }

  logger.info('Seeding database...');
  const { seedDatabase } = require('./seed');
  await seedDatabase();
  logger.info('DB seed complete');
}

async function initDatabase() {
  await runMigrations();
  await runSeedIfEmpty();
}

module.exports = { initDatabase };
