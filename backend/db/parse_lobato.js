'use strict';

const fs   = require('fs');
const path = require('path');

const INPUT_FILE  = path.join(__dirname, 'lobato_layout.txt');
const OUTPUT_FILE = path.join(__dirname, 'lobato_prices.json');

// Trim lines must contain at least one engine/spec marker to be captured.
// "HP" alone covers 99% of cases; add BEV/kWh/CVT/DSG/Híbrido for EVs and edge cases.
const SPEC_RE = /HP|Pts|kWh|BEV|CVT|DSG|Híbrido|Hibrido|\bcil\b/;

// Lines that are pure noise and should be discarded entirely.
const NOISE_PATTERNS = [
  /QUEDA PROHIBIDA/i,
  /AUTOPRECIOS LOBATO/i,
  /WhatsApp/i,
  /Copyright/i,
  /©/,
  /VEHÍCULOS DE PASAJEROS/i,
  /VEHÍCULOS COMERCIALES/i,
  /CONSULTE LA TABLA/i,
  /DEDUZCA EL REACONDICIONAMIENTO/i,
  /PROHIBIDA SU REPRODUCCIÓN/i,
  /TONATIUH_CHAN_VALENCIA/i,
  /EVITE SANCIONES/i,
  /^[A-Z]\s*$/,          // single-letter page markers ("A")
  /^Nota:/i,
  /^PASAJEROS\s*-/i,     // section-header footers
  /^•\s+[A-Z]/,          // bullet brand headers ("• ACURA V ENTA COMPRA")
  /^V\s*ENTA\s+COMPRA/i,
  /^Venta\s+Compra\s*$/i,
  /^LISTA\s+CONTADO\s*$/i,
  /^PRECIOS DE (LISTA)?/i,
];

function isNoise(s) {
  return NOISE_PATTERNS.some(re => re.test(s));
}

// ─── Phase 1: collect known brand names ─────────────────────────────────────
// We read "PASAJEROS - BRAND" and "• BRAND" footers to build a registry so we
// can reliably detect standalone brand-header lines later.
function collectBrands(lines) {
  const brands = new Set();

  for (const line of lines) {
    const norm = line.trim().replace(/\s+/g, ' ');
    if (!norm) continue;

    // "PASAJEROS - BRAND" or "PASAJEROS - BRAND1 - BRAND2"
    const pasM = norm.match(/^PASAJEROS\s*-\s*([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s-]+)/);
    if (pasM) {
      const part = pasM[1].replace(/\s+V\s*ENTA.*$/, '').trim();
      part.split(/\s+-\s+/).forEach(b => { b = b.trim(); if (b.length > 1) brands.add(b); });
    }

    // "• BRAND [- BRAND2] VENTA COMPRA"
    const bulM = norm.match(/^•\s+([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s-]+?)(?:\s+V\s*ENTA|\s*$)/);
    if (bulM) {
      const part = bulM[1].trim();
      part.split(/\s+-\s+/).forEach(b => { b = b.trim(); if (b.length > 1) brands.add(b); });
    }
  }

  return brands;
}

function parseNumber(s) {
  return parseInt(s.replace(/,/g, ''), 10);
}

// Strip column-header words that leak into model/year text
function cleanTrailing(s) {
  return s.replace(/\s+(Venta|Compra|LISTA|CONTADO|PRECIOS)\b.*$/i, '').trim();
}

// ─── Phase 2: main parse ─────────────────────────────────────────────────────
function parseLobato() {
  const text  = fs.readFileSync(INPUT_FILE, 'utf8');
  const lines = text.split('\n');

  const brandSet = collectBrands(lines);

  // Build no-space map to handle letter-spaced headers like "T O Y O TA"
  const brandNoSpaceMap = new Map();
  for (const b of brandSet) brandNoSpaceMap.set(b.replace(/\s/g, ''), b);

  const result = {};
  let currentBrand = null;
  let currentModel = null;
  let currentYear  = null;
  let skipMode     = false; // true when inside a "Nuevos / LISTA" block

  for (const rawLine of lines) {
    const stripped = rawLine.trim();
    if (!stripped) continue;

    // Collapse internal whitespace (preserves horizontal-position intent as single spaces)
    const norm = stripped.replace(/\s+/g, ' ');

    // ── Discard noise ──────────────────────────────────────────────────────
    if (isNoise(norm)) continue;

    // ── Brand header (standalone all-caps line matching a known brand) ─────
    if (brandSet.has(norm)) {
      currentBrand = norm;
      currentModel = null;
      skipMode     = false;
      continue;
    }
    // Handle letter-spaced forms like "T O Y O TA"
    const normNoSpace = norm.replace(/\s/g, '');
    if (normNoSpace.length > 2 && brandNoSpaceMap.has(normNoSpace)) {
      currentBrand = brandNoSpaceMap.get(normNoSpace);
      currentModel = null;
      skipMode     = false;
      continue;
    }

    // ── Year-block header: "YYYY - rest …" ────────────────────────────────
    const yearM = norm.match(/^(\d{4})\s*-\s+(.+)$/);
    if (yearM) {
      const yr   = parseInt(yearM[1], 10);
      const rest = yearM[2];

      if (yr < 2000 || yr > 2027) continue;

      if (/\bNuevos\b|PRECIOS DE LISTA/.test(rest)) {
        // New-car pricing block — skip until next year header
        skipMode = true;
      } else {
        skipMode    = false;
        currentYear = yr;
        // Extract model name: the segment before the first " -", " /", or " ("
        const rawModel = rest.split(/\s+[-\/\(]/)[0];
        const model    = cleanTrailing(rawModel).trim();
        if (model) currentModel = model;
      }
      continue;
    }

    // ── Skip everything inside a Nuevos block ──────────────────────────────
    if (skipMode) continue;

    // ── Price line: trim description followed by two comma-formatted numbers ─
    const priceM = norm.match(/^(.+?)\s+([\d,]+)\s+([\d,]+)\s*$/);
    if (priceM) {
      if (!currentBrand || !currentModel || !currentYear) continue;

      const trimDesc = cleanTrailing(priceM[1].trim());
      const venta    = parseNumber(priceM[2]);
      const compra   = parseNumber(priceM[3]);

      // Must contain engine/spec markers to be a real trim line
      if (!SPEC_RE.test(trimDesc)) continue;

      // Compra should always be less than venta (buy low / sell high)
      if (venta <= 0 || compra <= 0 || venta < compra) continue;

      if (!result[currentBrand])                        result[currentBrand] = {};
      if (!result[currentBrand][currentModel])          result[currentBrand][currentModel] = {};
      if (!result[currentBrand][currentModel][currentYear]) result[currentBrand][currentModel][currentYear] = [];

      result[currentBrand][currentModel][currentYear].push({ trim: trimDesc, venta, compra });
      continue;
    }

    // ── All other lines (single-price addons, model headers, etc.) ──────────
    // We intentionally ignore them: model name always comes from year-block headers.
  }

  return result;
}

// ─── Run ─────────────────────────────────────────────────────────────────────
const result = parseLobato();

// ── Summary ──────────────────────────────────────────────────────────────────
const brands = Object.keys(result).sort();
let totalModels  = 0;
let totalEntries = 0;

for (const b of brands) {
  const models = Object.keys(result[b]);
  totalModels += models.length;
  for (const m of models) {
    for (const yr of Object.keys(result[b][m])) {
      totalEntries += result[b][m][yr].length;
    }
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Brands:  ${brands.length}`);
console.log(`Models:  ${totalModels}`);
console.log(`Entries: ${totalEntries}`);

// ── Acura spot-check ─────────────────────────────────────────────────────────
console.log('\n=== ACURA SPOT-CHECK ===');

function check(label, entries, trimKeyword, expectedVenta, expectedCompra) {
  const e = entries.find(x => x.trim.includes(trimKeyword));
  if (!e) { console.log(`${label}: NOT FOUND`); return; }
  const ok = e.venta === expectedVenta && e.compra === expectedCompra;
  console.log(`${label}: venta=${e.venta} compra=${e.compra} → ${ok ? '✓ OK' : '✗ MISMATCH'}`);
}

check(
  '2025 ADX Advance',
  result['ACURA']?.['ADX']?.[2025] || [],
  'Advance', 678200, 568500
);
check(
  '2024 MDX Advance',
  result['ACURA']?.['MDX']?.[2024] || [],
  'Advance', 933700, 780700
);
check(
  '2019 RDX Tech',
  result['ACURA']?.['RDX']?.[2019] || [],
  'Tech', 362300, 296500
);

console.log('\nAll Acura ADX 2025 entries:');
(result['ACURA']?.['ADX']?.[2025] || []).forEach(e =>
  console.log(`  ${e.trim}  →  venta=${e.venta}  compra=${e.compra}`)
);

// ── Write JSON ────────────────────────────────────────────────────────────────
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
console.log(`\nWrote ${OUTPUT_FILE}`);
