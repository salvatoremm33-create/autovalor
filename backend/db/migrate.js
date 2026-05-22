require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function migrate() {
  const sqlFile = path.join(__dirname, 'migrations', '001_initial.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Running database migrations...');
  try {
    await db.query(sql);
    console.log('Migrations completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

migrate();
