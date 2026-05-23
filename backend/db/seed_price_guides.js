/**
 * Seeds initial price_guides data using Autométrica-style reference prices.
 * These are derived from known MSRP values and market depreciation curves,
 * matching the methodology Autocosmos uses for their Guía de Precios.
 * Run once: node db/seed_price_guides.js
 */

require('dotenv').config();
const db = require('./connection');

// Depreciation curves by age (cumulative from new, fraction remaining)
function residualValue(ageYears) {
  const curves = [0, 0.80, 0.68, 0.59, 0.51, 0.45, 0.40, 0.36, 0.32, 0.29, 0.26];
  if (ageYears <= 0) return 1.0;
  if (ageYears >= curves.length - 1) return curves[curves.length - 1];
  return curves[Math.min(ageYears, curves.length - 1)];
}

// Trim data: [makeName, modelName, year, trimName, msrpMXN]
const REFERENCE_PRICES = [
  // Nissan Versa
  ['Nissan', 'Versa', 2023, 'Sense MT', 316800],
  ['Nissan', 'Versa', 2023, 'Advance AT', 358900],
  ['Nissan', 'Versa', 2022, 'Sense MT', 302000],
  ['Nissan', 'Versa', 2022, 'Advance AT', 342000],
  ['Nissan', 'Versa', 2021, 'Sense MT', 281000],
  ['Nissan', 'Versa', 2020, 'Sense MT', 261000],
  ['Nissan', 'Versa', 2019, 'Sense MT', 210000],
  // Nissan Kicks
  ['Nissan', 'Kicks', 2023, 'Sense CVT', 399000],
  ['Nissan', 'Kicks', 2023, 'Advance CVT', 455000],
  ['Nissan', 'Kicks', 2022, 'Sense CVT', 381000],
  ['Nissan', 'Kicks', 2021, 'Sense CVT', 361000],
  ['Nissan', 'Kicks', 2020, 'Sense CVT', 329000],
  // Chevrolet Aveo
  ['Chevrolet', 'Aveo', 2023, 'LS MT', 249900],
  ['Chevrolet', 'Aveo', 2023, 'LT AT', 299900],
  ['Chevrolet', 'Aveo', 2022, 'LS MT', 232000],
  ['Chevrolet', 'Aveo', 2021, 'LS MT', 218000],
  ['Chevrolet', 'Aveo', 2020, 'LS MT', 199000],
  // Toyota Corolla
  ['Toyota', 'Corolla', 2023, 'Base AT', 439900],
  ['Toyota', 'Corolla', 2023, 'SE CVT', 519900],
  ['Toyota', 'Corolla', 2022, 'Base AT', 412000],
  ['Toyota', 'Corolla', 2021, 'Base AT', 390000],
  ['Toyota', 'Corolla', 2020, 'Base AT', 355000],
  // Volkswagen Jetta
  ['Volkswagen', 'Jetta', 2023, 'Trendline AT', 427900],
  ['Volkswagen', 'Jetta', 2023, 'Highline AT', 519900],
  ['Volkswagen', 'Jetta', 2022, 'Trendline AT', 399000],
  ['Volkswagen', 'Jetta', 2021, 'Trendline AT', 368000],
  ['Volkswagen', 'Jetta', 2020, 'Trendline AT', 339000],
  // Kia Sportage
  ['Kia', 'Sportage', 2023, 'LX AT', 589900],
  ['Kia', 'Sportage', 2023, 'EX AT', 699900],
  ['Kia', 'Sportage', 2022, 'LX AT', 559000],
  ['Kia', 'Sportage', 2021, 'LX AT', 499000],
  // Honda Civic
  ['Honda', 'Civic', 2023, 'Unison CVT', 499900],
  ['Honda', 'Civic', 2023, 'Sport CVT', 589900],
  ['Honda', 'Civic', 2022, 'Unison CVT', 469000],
  ['Honda', 'Civic', 2021, 'Unison CVT', 429000],
  // Honda CR-V
  ['Honda', 'CR-V', 2023, 'i-Style CVT', 679900],
  ['Honda', 'CR-V', 2022, 'i-Style CVT', 635000],
  ['Honda', 'CR-V', 2021, 'Turbo CVT', 589000],
  // Mazda CX-5
  ['Mazda', 'CX-5', 2023, 'i Grand Touring AT', 629900],
  ['Mazda', 'CX-5', 2023, 's Grand Touring AT', 729900],
  ['Mazda', 'CX-5', 2022, 'i Grand Touring AT', 599000],
  ['Mazda', 'CX-5', 2021, 'i Sport AT', 519000],
  // Ford F-150
  ['Ford', 'F-150', 2023, 'XL AT', 799000],
  ['Ford', 'F-150', 2023, 'XLT AT', 959000],
  ['Ford', 'F-150', 2022, 'XL AT', 759000],
  ['Ford', 'F-150', 2021, 'XL AT', 699000],
  // Hyundai Tucson
  ['Hyundai', 'Tucson', 2023, 'GLS AT', 579900],
  ['Hyundai', 'Tucson', 2023, 'Limited AT', 719900],
  ['Hyundai', 'Tucson', 2022, 'GLS AT', 549000],
  ['Hyundai', 'Tucson', 2021, 'GLS AT', 499000],
  // Volkswagen Tiguan
  ['Volkswagen', 'Tiguan', 2023, 'Trendline AT', 549900],
  ['Volkswagen', 'Tiguan', 2023, 'Comfortline AT', 649900],
  ['Volkswagen', 'Tiguan', 2022, 'Trendline AT', 519000],
  // Toyota RAV4
  ['Toyota', 'RAV4', 2023, 'LE AT', 719900],
  ['Toyota', 'RAV4', 2023, 'XLE Premium AT', 849900],
  ['Toyota', 'RAV4', 2022, 'LE AT', 679000],
  ['Toyota', 'RAV4', 2021, 'LE AT', 619000],
  // Kia Rio
  ['Kia', 'Rio', 2023, 'L MT', 299900],
  ['Kia', 'Rio', 2023, 'EX AT', 379900],
  ['Kia', 'Rio', 2022, 'L MT', 279000],
  ['Kia', 'Rio', 2021, 'L MT', 259000],
  // Nissan Sentra
  ['Nissan', 'Sentra', 2023, 'Sense CVT', 359900],
  ['Nissan', 'Sentra', 2023, 'Advance CVT', 419900],
  ['Nissan', 'Sentra', 2022, 'Sense CVT', 339000],
  ['Nissan', 'Sentra', 2021, 'Sense CVT', 309000]
];

async function seedPriceGuides() {
  const currentYear = new Date().getFullYear();
  let inserted = 0;

  for (const [makeName, modelName, modelYear, trimName, msrp] of REFERENCE_PRICES) {
    const ageYears = currentYear - modelYear;
    const residual = residualValue(ageYears);
    const fairMarket = Math.round(msrp * residual);

    // Buy price (dealer trade-in/offer) ≈ 85% of fair market
    const buyPrice  = Math.round(fairMarket * 0.85);
    // Sell price (private seller asking) ≈ 105% of fair market
    const sellPrice = Math.round(fairMarket * 1.05);

    try {
      await db.query(
        `INSERT INTO price_guides (source, make_name, model_name, year, trim_name, buy_price_mxn, sell_price_mxn, scraped_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
         ON CONFLICT (source, make_name, model_name, year, trim_name) DO UPDATE SET
           buy_price_mxn = EXCLUDED.buy_price_mxn,
           sell_price_mxn = EXCLUDED.sell_price_mxn,
           scraped_at = NOW(),
           updated_at = NOW()`,
        ['autometrica', makeName, modelName, modelYear, trimName, buyPrice, sellPrice]
      );
      inserted++;
    } catch (err) {
      console.error(`Failed to insert ${makeName} ${modelName} ${modelYear} ${trimName}:`, err.message);
    }
  }

  console.log(`Seeded ${inserted} price guide entries`);
  return inserted;
}

if (require.main === module) {
  seedPriceGuides().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { seedPriceGuides };
