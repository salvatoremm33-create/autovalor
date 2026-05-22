/**
 * AutoValor Price Calculator
 * Calculates fair market, private sale, dealer, and trade-in values
 * based on scraped listings, mileage, condition, and depreciation models.
 */

const CONDITION_MULTIPLIERS = {
  excellent: 1.08,
  good:      1.00,
  fair:      0.88,
  poor:      0.74
};

// Average km/year in Mexico: ~14,000
const AVG_KM_PER_YEAR = 14000;

// Depreciation: year 1=20%, y2=15%, y3=12%, y4=10%, y5+=8%
function getDepreciation(ageYears) {
  if (ageYears <= 0) return 0;
  if (ageYears === 1) return 0.20;
  if (ageYears === 2) return 0.32;
  if (ageYears === 3) return 0.41;
  if (ageYears === 4) return 0.49;
  if (ageYears === 5) return 0.55;
  return Math.min(0.80, 0.55 + (ageYears - 5) * 0.05);
}

function getMileageAdjustment(actualKm, year) {
  const currentYear = new Date().getFullYear();
  const ageYears = currentYear - year;
  const expectedKm = ageYears * AVG_KM_PER_YEAR;
  const diffKm = actualKm - expectedKm;

  // -0.5% per 1,000 km above expected, capped at ±20%
  const adjustment = -(diffKm / 1000) * 0.005;
  return Math.max(-0.20, Math.min(0.15, adjustment));
}

function calculatePricesFromListings(listings, msrp, year, mileageKm, condition) {
  const currentYear = new Date().getFullYear();
  const ageYears = currentYear - year;

  const conditionMult = CONDITION_MULTIPLIERS[condition] || 1.0;
  const mileageAdj = getMileageAdjustment(mileageKm, year);
  const depreciation = getDepreciation(ageYears);

  let basePrice;

  if (listings && listings.length > 0) {
    const prices = listings
      .map(l => l.price_mxn || l.price)
      .filter(p => p > 0)
      .sort((a, b) => a - b);

    // Remove top and bottom 10% as outliers
    const trimStart = Math.floor(prices.length * 0.1);
    const trimEnd = Math.ceil(prices.length * 0.9);
    const trimmed = prices.slice(trimStart, trimEnd);

    basePrice = trimmed.reduce((sum, p) => sum + p, 0) / trimmed.length;
  } else {
    // Fall back to MSRP-based estimate
    basePrice = msrp * (1 - depreciation);
  }

  const adjustedBase = basePrice * conditionMult * (1 + mileageAdj);

  const fairMarket       = Math.round(adjustedBase);
  const privateSaleLow   = Math.round(adjustedBase * 0.95);
  const privateSaleHigh  = Math.round(adjustedBase * 1.08);
  const dealerLow        = Math.round(adjustedBase * 1.08);
  const dealerHigh       = Math.round(adjustedBase * 1.22);
  const tradeInLow       = Math.round(adjustedBase * 0.78);
  const tradeInHigh      = Math.round(adjustedBase * 0.88);

  return {
    fairMarketValue: fairMarket,
    privateSale: { low: privateSaleLow, high: privateSaleHigh, mid: Math.round((privateSaleLow + privateSaleHigh) / 2) },
    dealerRetail: { low: dealerLow, high: dealerHigh, mid: Math.round((dealerLow + dealerHigh) / 2) },
    tradeIn:      { low: tradeInLow, high: tradeInHigh, mid: Math.round((tradeInLow + tradeInHigh) / 2) },
    adjustments: {
      conditionMultiplier: conditionMult,
      mileageAdjustment: Math.round(mileageAdj * 100 * 10) / 10,
      depreciationPercent: Math.round(depreciation * 100),
      sampleSize: listings ? listings.length : 0,
      dataSource: listings && listings.length > 0 ? 'market_listings' : 'msrp_estimate'
    }
  };
}

function getPriceRating(listingPrice, fairMarketValue) {
  const ratio = listingPrice / fairMarketValue;
  if (ratio < 0.88) return { label: 'Gran Precio', color: '#16a34a', score: 5 };
  if (ratio < 0.96) return { label: 'Buen Precio', color: '#65a30d', score: 4 };
  if (ratio < 1.04) return { label: 'Precio Justo', color: '#d97706', score: 3 };
  if (ratio < 1.12) return { label: 'Precio Alto', color: '#ea580c', score: 2 };
  return { label: 'Precio Muy Alto', color: '#dc2626', score: 1 };
}

module.exports = { calculatePricesFromListings, getPriceRating, getMileageAdjustment, getDepreciation };
