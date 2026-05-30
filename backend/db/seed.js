require('dotenv').config();
const db = require('./connection');
const { MAKES_DATA, TRIMS_DATA } = require('./catalog');

const YEAR_DEFAULT_START = 2015;
const YEAR_DEFAULT_END   = 2026;

// ─── Make metadata (country + popular) ───────────────────────────────────────

const MAKE_META = {
  'Acura':         { country: 'Japan',       popular: false },
  'Alfa Romeo':    { country: 'Italy',        popular: false },
  'Audi':          { country: 'Germany',      popular: false },
  'BAIC':          { country: 'China',        popular: false },
  'Bestune':       { country: 'China',        popular: false },
  'BMW':           { country: 'Germany',      popular: false },
  'Buick':         { country: 'USA',          popular: false },
  'BYD':           { country: 'China',        popular: true  },
  'Cadillac':      { country: 'USA',          popular: false },
  'Changan':       { country: 'China',        popular: true  },
  'Chevrolet':     { country: 'USA',          popular: true  },
  'Chirey':        { country: 'China',        popular: true  },
  'Chrysler':      { country: 'USA',          popular: false },
  'Cupra':         { country: 'Spain',        popular: false },
  'Dodge':         { country: 'USA',          popular: false },
  'Ferrari':       { country: 'Italy',        popular: false },
  'Fiat':          { country: 'Italy',        popular: false },
  'Ford':          { country: 'USA',          popular: true  },
  'GAC':           { country: 'China',        popular: false },
  'Geely':         { country: 'China',        popular: false },
  'GMC':           { country: 'USA',          popular: false },
  'GWM':           { country: 'China',        popular: false },
  'Honda':         { country: 'Japan',        popular: true  },
  'Hyundai':       { country: 'South Korea',  popular: true  },
  'INEOS':         { country: 'UK',           popular: false },
  'Infiniti':      { country: 'Japan',        popular: false },
  'JAC':           { country: 'China',        popular: false },
  'JAECOO':        { country: 'China',        popular: false },
  'Jaguar':        { country: 'UK',           popular: false },
  'Jeep':          { country: 'USA',          popular: false },
  'Jetour':        { country: 'China',        popular: false },
  'Kia':           { country: 'South Korea',  popular: true  },
  'Land Rover':    { country: 'UK',           popular: false },
  'Lexus':         { country: 'Japan',        popular: false },
  'Lincoln':       { country: 'USA',          popular: false },
  'Maserati':      { country: 'Italy',        popular: false },
  'Mazda':         { country: 'Japan',        popular: true  },
  'Mercedes-Benz': { country: 'Germany',      popular: false },
  'MG':            { country: 'China',        popular: true  },
  'Mini':          { country: 'UK',           popular: false },
  'Mitsubishi':    { country: 'Japan',        popular: false },
  'Nissan':        { country: 'Japan',        popular: true  },
  'Omoda':         { country: 'China',        popular: false },
  'Peugeot':       { country: 'France',       popular: false },
  'Porsche':       { country: 'Germany',      popular: false },
  'Renault':       { country: 'France',       popular: false },
  'Seat':          { country: 'Spain',        popular: false },
  'SERES':         { country: 'China',        popular: false },
  'Smart':         { country: 'Germany',      popular: false },
  'Subaru':        { country: 'Japan',        popular: false },
  'Suzuki':        { country: 'Japan',        popular: false },
  'Tesla':         { country: 'USA',          popular: false },
  'Toyota':        { country: 'Japan',        popular: true  },
  'Volkswagen':    { country: 'Germany',      popular: true  },
  'Volvo':         { country: 'Sweden',       popular: false },
  'Zeekr':         { country: 'China',        popular: false },
};

// ─── Model metadata (body_type + segment + optional yearStart/yearEnd) ────────

const MODEL_META = {
  // Nissan
  'Versa':          { body_type: 'Sedan',     segment: 'Subcompact',      popular: true  },
  'Kicks':          { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true  },
  'March':          { body_type: 'Hatchback', segment: 'Minicompact',     popular: true  },
  'X-Trail':        { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Altima':         { body_type: 'Sedan',     segment: 'Midsize',         popular: false },
  'Pathfinder':     { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'Leaf':           { body_type: 'Hatchback', segment: 'Compact',         popular: false },
  'Juke':           { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  // Chevrolet
  'Spark':          { body_type: 'Hatchback', segment: 'Minicompact',     popular: true  },
  'Aveo':           { body_type: 'Sedan',     segment: 'Subcompact',      popular: true  },
  'Onix':           { body_type: 'Sedan',     segment: 'Subcompact',      popular: true,  yearStart: 2021 },
  'Cavalier':       { body_type: 'Sedan',     segment: 'Compact',         popular: true,  yearStart: 2018 },
  'Tracker':        { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true,  yearStart: 2020 },
  'Trax':           { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true  },
  'Equinox':        { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Tahoe':          { body_type: 'SUV',       segment: 'Full-size SUV',   popular: false },
  'Suburban':       { body_type: 'SUV',       segment: 'Full-size SUV',   popular: false },
  // Toyota
  'Yaris':          { body_type: 'Sedan',     segment: 'Subcompact',      popular: true  },
  'Corolla':        { body_type: 'Sedan',     segment: 'Compact',         popular: true  },
  'Camry':          { body_type: 'Sedan',     segment: 'Midsize',         popular: true  },
  'RAV4':           { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Tacoma':         { body_type: 'Pickup',    segment: 'Midsize Pickup',  popular: false },
  'Land Cruiser':   { body_type: 'SUV',       segment: 'Full-size SUV',   popular: false },
  'C-HR':           { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false, yearStart: 2018 },
  'Avanza':         { body_type: 'Van',       segment: 'Compact MPV',     popular: false },
  'Prius':          { body_type: 'Sedan',     segment: 'Compact',         popular: false },
  '4Runner':        { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  // Volkswagen
  'Vento':          { body_type: 'Sedan',     segment: 'Compact',         popular: true  },
  'Jetta A7':       { body_type: 'Sedan',     segment: 'Compact',         popular: true  },
  'Jetta A6':       { body_type: 'Sedan',     segment: 'Compact',         popular: false, yearEnd: 2021 },
  'Jetta A4':       { body_type: 'Sedan',     segment: 'Compact',         popular: false, yearEnd: 2017 },
  'T-Cross':        { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true,  yearStart: 2020 },
  'Tiguan':         { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Polo':           { body_type: 'Hatchback', segment: 'Subcompact',      popular: false },
  'Virtus':         { body_type: 'Sedan',     segment: 'Compact',         popular: true,  yearStart: 2020 },
  'Taos':           { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2021 },
  'Touareg':        { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'Teramont':       { body_type: 'SUV',       segment: 'Full-size SUV',   popular: false },
  'Nivus':          { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false, yearStart: 2022 },
  'Amarok':         { body_type: 'Pickup',    segment: 'Midsize Pickup',  popular: false },
  // Kia
  'Rio':            { body_type: 'Sedan',     segment: 'Subcompact',      popular: true  },
  'Forte':          { body_type: 'Sedan',     segment: 'Compact',         popular: true  },
  'Sportage':       { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Seltos':         { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true,  yearStart: 2020 },
  'Sorento':        { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'Telluride':      { body_type: 'SUV',       segment: 'Full-size SUV',   popular: false },
  'Stinger':        { body_type: 'Sedan',     segment: 'Midsize',         popular: false },
  'Niro':           { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  // Honda
  'City':           { body_type: 'Sedan',     segment: 'Subcompact',      popular: true  },
  'Civic':          { body_type: 'Sedan',     segment: 'Compact',         popular: true  },
  'HR-V':           { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true  },
  'CR-V':           { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Accord':         { body_type: 'Sedan',     segment: 'Midsize',         popular: false },
  'Pilot':          { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'BR-V':           { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  // Ford
  'F-150':          { body_type: 'Pickup',    segment: 'Full-size Pickup', popular: true  },
  'EcoSport':       { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true,  yearEnd: 2022 },
  'Escape':         { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Explorer':       { body_type: 'SUV',       segment: 'Midsize SUV',     popular: true  },
  'Bronco':         { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2021 },
  'Ranger':         { body_type: 'Pickup',    segment: 'Midsize Pickup',  popular: false, yearStart: 2019 },
  'Maverick':       { body_type: 'Pickup',    segment: 'Compact Pickup',  popular: false, yearStart: 2022 },
  'Mustang':        { body_type: 'Coupe',     segment: 'Sports',          popular: false },
  'Territory':      { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2020 },
  // Mazda
  'Mazda2':         { body_type: 'Sedan',     segment: 'Subcompact',      popular: true  },
  'Mazda3':         { body_type: 'Sedan',     segment: 'Compact',         popular: true  },
  'CX-30':          { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true,  yearStart: 2020 },
  'CX-5':           { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Mazda6':         { body_type: 'Sedan',     segment: 'Midsize',         popular: false },
  'CX-9':           { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'CX-50':          { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2023 },
  'CX-90':          { body_type: 'SUV',       segment: 'Full-size SUV',   popular: false, yearStart: 2024 },
  'CX-3':           { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  'MX-5':           { body_type: 'Convertible',segment: 'Sports',         popular: false },
  // Hyundai
  'Grand i10':      { body_type: 'Sedan',     segment: 'Subcompact',      popular: true  },
  'Accent':         { body_type: 'Sedan',     segment: 'Subcompact',      popular: true  },
  'Elantra':        { body_type: 'Sedan',     segment: 'Compact',         popular: true  },
  'Creta':          { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true,  yearStart: 2017 },
  'Tucson':         { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Santa Fe':       { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'Ioniq 5':        { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2022 },
  // SEAT / Cupra
  'Ibiza':          { body_type: 'Hatchback', segment: 'Subcompact',      popular: true  },
  'León':           { body_type: 'Hatchback', segment: 'Compact',         popular: true  },
  'Ateca':          { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Tarraco':        { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false, yearStart: 2019 },
  'Formentor':      { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2021 },
  // Jeep
  'Renegade':       { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  'Compass':        { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Cherokee':       { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'Wrangler':       { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'Grand Cherokee': { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'Commander':      { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false, yearStart: 2022 },
  // Renault
  'Kwid':           { body_type: 'Hatchback', segment: 'Minicompact',     popular: true  },
  'Sandero':        { body_type: 'Hatchback', segment: 'Subcompact',      popular: true  },
  'Logan':          { body_type: 'Sedan',     segment: 'Compact',         popular: false },
  'Stepway':        { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true  },
  'Duster':         { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Koleos':         { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'Clio':           { body_type: 'Hatchback', segment: 'Subcompact',      popular: false },
  'Captur':         { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  'Arkana':         { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2022 },
  'Kardian':        { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false, yearStart: 2024 },
  // Peugeot
  '208':            { body_type: 'Hatchback', segment: 'Subcompact',      popular: false },
  '2008':           { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  '3008':           { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  '5008':           { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  // Suzuki
  'Swift':          { body_type: 'Hatchback', segment: 'Subcompact',      popular: false },
  'Vitara':         { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  'Grand Vitara':   { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'Jimny':          { body_type: 'SUV',       segment: 'Minicompact SUV', popular: false, yearStart: 2019 },
  'Ignis':          { body_type: 'Hatchback', segment: 'Minicompact',     popular: false },
  'Ciaz':           { body_type: 'Sedan',     segment: 'Compact',         popular: false },
  // Mitsubishi
  'Eclipse Cross':  { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2018 },
  'Outlander':      { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'Xpander':        { body_type: 'SUV',       segment: 'Compact MPV',     popular: false, yearStart: 2020 },
  'Mirage':         { body_type: 'Hatchback', segment: 'Minicompact',     popular: false },
  // Audi
  'A3':             { body_type: 'Hatchback', segment: 'Compact',         popular: false },
  'A4':             { body_type: 'Sedan',     segment: 'Midsize',         popular: false },
  'Q3':             { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  'Q5':             { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'Q7':             { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'Q8':             { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false, yearStart: 2019 },
  'e-tron':         { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2020 },
  // BMW
  'Serie 3':        { body_type: 'Sedan',     segment: 'Compact',         popular: false },
  'Serie 5':        { body_type: 'Sedan',     segment: 'Midsize',         popular: false },
  'X1':             { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  'X3':             { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'X5':             { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'iX':             { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false, yearStart: 2022 },
  // Mercedes-Benz
  'Clase A':        { body_type: 'Hatchback', segment: 'Compact',         popular: false },
  'Clase C':        { body_type: 'Sedan',     segment: 'Compact',         popular: false },
  'Clase E':        { body_type: 'Sedan',     segment: 'Midsize',         popular: false },
  'Clase GLA':      { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  'Clase GLB':      { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false, yearStart: 2020 },
  'Clase GLC':      { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'Clase GLE':      { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'Clase GLS':      { body_type: 'SUV',       segment: 'Full-size SUV',   popular: false },
  'Clase S':        { body_type: 'Sedan',     segment: 'Full-size',       popular: false },
  // Land Rover
  'Range Rover Evoque':  { body_type: 'SUV',  segment: 'Compact SUV',     popular: false },
  'Range Rover Sport':   { body_type: 'SUV',  segment: 'Midsize SUV',     popular: false },
  'Range Rover':         { body_type: 'SUV',  segment: 'Full-size SUV',   popular: false },
  'Defender':            { body_type: 'SUV',  segment: 'Midsize SUV',     popular: false, yearStart: 2021 },
  'Discovery':           { body_type: 'SUV',  segment: 'Midsize SUV',     popular: false },
  // Lexus
  'ES':             { body_type: 'Sedan',     segment: 'Midsize',         popular: false },
  'IS':             { body_type: 'Sedan',     segment: 'Compact',         popular: false },
  'NX':             { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'RX':             { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'UX':             { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false, yearStart: 2019 },
  // Infiniti
  'Q50':            { body_type: 'Sedan',     segment: 'Midsize',         popular: false },
  'QX50':           { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'QX60':           { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  // Cadillac
  'Escalade':       { body_type: 'SUV',       segment: 'Full-size SUV',   popular: false },
  'XT5':            { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  // Lincoln
  'Navigator':      { body_type: 'SUV',       segment: 'Full-size SUV',   popular: false },
  // Porsche
  'Cayenne':        { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
  'Macan':          { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  '911':            { body_type: 'Coupe',     segment: 'Sports',          popular: false },
  'Panamera':       { body_type: 'Sedan',     segment: 'Full-size',       popular: false },
  'Taycan':         { body_type: 'Sedan',     segment: 'Midsize',         popular: false, yearStart: 2020 },
  // Jaguar
  'F-Pace':         { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'E-Pace':         { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  'F-Type':         { body_type: 'Coupe',     segment: 'Sports',          popular: false },
  // GWM / Haval
  'Haval H6':       { body_type: 'SUV',       segment: 'Compact SUV',     popular: true  },
  'Haval Jolion':   { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: true  },
  'Tank 300':       { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2023 },
  'Tank 500':       { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false, yearStart: 2024 },
  // Subaru
  'Forester':       { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'Outback':        { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'WRX':            { body_type: 'Sedan',     segment: 'Compact',         popular: false },
  'Crosstrek':      { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false },
  // Tesla
  'Model 3':        { body_type: 'Sedan',     segment: 'Compact',         popular: false, yearStart: 2020 },
  'Model Y':        { body_type: 'SUV',       segment: 'Compact SUV',     popular: false, yearStart: 2022 },
  'Model S':        { body_type: 'Sedan',     segment: 'Full-size',       popular: false },
  'Model X':        { body_type: 'SUV',       segment: 'Full-size SUV',   popular: false },
  // Volvo
  'XC40':           { body_type: 'SUV',       segment: 'Subcompact SUV',  popular: false, yearStart: 2019 },
  'XC60':           { body_type: 'SUV',       segment: 'Compact SUV',     popular: false },
  'XC90':           { body_type: 'SUV',       segment: 'Midsize SUV',     popular: false },
};

// ─── Derive seedData from catalog ────────────────────────────────────────────

const makesArray = Object.keys(MAKES_DATA).sort().map(name => ({
  name,
  ...(MAKE_META[name] || { country: 'N/D', popular: false })
}));

const modelsObject = Object.fromEntries(
  Object.entries(MAKES_DATA).map(([make, modelNames]) => [
    make,
    modelNames.map(name => ({
      name,
      ...(MODEL_META[name] || { body_type: null, segment: null, popular: false })
    }))
  ])
);

const seedData = { makes: makesArray, models: modelsObject };

// ─── Derive trimsByModel from TRIMS_DATA ──────────────────────────────────────

function inferTransmission(name) {
  if (/CVT/i.test(name)) return 'CVT';
  const dsg = name.match(/DSG(\d)/i);
  if (dsg) return `DSG ${dsg[1]} vel`;
  const ta = name.match(/TA(\d+)/i);
  if (ta) return `Automático ${ta[1]} vel`;
  const tm = name.match(/TM(\d+)/i);
  if (tm) return `Manual ${tm[1]} vel`;
  if (/\b(TA|AT)\b/.test(name)) return 'Automático';
  if (/\b(TM|MT)\b/.test(name)) return 'Manual';
  return null;
}

function inferFuelType(name) {
  if (/\bEV\b|eléctrico|electric|recharge/i.test(name)) return 'Eléctrico';
  if (/PHEV|plug.in/i.test(name)) return 'Híbrido Enchufable';
  if (/\bHEV\b|hybrid|híbrido/i.test(name)) return 'Híbrido';
  if (/diesel|diésel/i.test(name)) return 'Diésel';
  return 'Gasolina';
}

const trimsByModel = Object.fromEntries(
  Object.entries(TRIMS_DATA).map(([model, names]) => [
    model,
    names.map(name => ({
      name,
      engine:       null,
      transmission: inferTransmission(name),
      fuel_type:    inferFuelType(name)
    }))
  ])
);

// ─── MSRP lookup ─────────────────────────────────────────────────────────────

const BASE_PRICES_2022 = {
  // Nissan
  'Versa': 245000, 'Kicks': 370000, 'March': 210000, 'X-Trail': 520000,
  'Altima': 530000, 'Pathfinder': 720000,
  // Chevrolet
  'Spark': 215000, 'Aveo': 265000, 'Onix': 270000, 'Cavalier': 320000,
  'Tracker': 355000, 'Trax': 390000, 'Equinox': 490000, 'Tahoe': 1050000,
  // Toyota
  'Yaris': 265000, 'Corolla': 410000, 'Camry': 590000, 'RAV4': 620000,
  'Tacoma': 560000, 'Land Cruiser': 1500000, 'C-HR': 420000, 'Avanza': 280000,
  // Volkswagen
  'Vento': 295000, 'Jetta A7': 400000, 'Jetta A6': 350000, 'T-Cross': 410000,
  'Tiguan': 550000, 'Polo': 290000, 'Taos': 500000, 'Touareg': 1050000,
  'Virtus': 340000, 'Nivus': 390000,
  // Kia
  'Rio': 265000, 'Forte': 355000, 'Sportage': 490000, 'Seltos': 410000,
  'Sorento': 610000, 'Telluride': 850000,
  // Honda
  'City': 285000, 'Civic': 450000, 'HR-V': 430000, 'CR-V': 580000,
  'Accord': 620000, 'Pilot': 710000,
  // Ford
  'F-150': 750000, 'EcoSport': 385000, 'Escape': 490000, 'Explorer': 790000,
  'Bronco': 750000, 'Ranger': 540000, 'Maverick': 440000, 'Mustang': 680000,
  // Mazda
  'Mazda2': 270000, 'Mazda3': 405000, 'CX-30': 450000, 'CX-5': 530000,
  'Mazda6': 540000, 'CX-9': 730000, 'CX-50': 580000,
  // Hyundai
  'Grand i10': 235000, 'Accent': 255000, 'Elantra': 380000, 'Creta': 385000,
  'Tucson': 490000, 'Santa Fe': 650000, 'Ioniq 5': 780000,
  // SEAT
  'Ibiza': 320000, 'León': 430000, 'Ateca': 500000, 'Tarraco': 640000,
  'Formentor': 560000,
  // Jeep
  'Renegade': 380000, 'Compass': 430000, 'Cherokee': 520000,
  'Wrangler': 680000, 'Grand Cherokee': 780000, 'Commander': 720000,
  // Renault
  'Kwid': 195000, 'Sandero': 250000, 'Logan': 240000, 'Stepway': 270000,
  'Duster': 315000, 'Koleos': 450000, 'Clio': 280000, 'Captur': 350000,
  'Arkana': 420000, 'Kardian': 370000,
  // Peugeot
  '208': 320000, '2008': 380000, '3008': 450000, '5008': 540000,
  // Suzuki
  'Swift': 265000, 'Vitara': 335000, 'Grand Vitara': 380000, 'Jimny': 320000,
  // Mitsubishi
  'Eclipse Cross': 430000, 'Outlander': 490000, 'Xpander': 350000,
  // Audi
  'A3': 460000, 'A4': 550000, 'Q3': 480000, 'Q5': 680000, 'Q7': 980000,
  // BMW
  'Serie 3': 580000, 'Serie 5': 780000, 'X1': 530000, 'X3': 700000, 'X5': 1100000,
  // Mercedes-Benz
  'Clase A': 480000, 'Clase C': 650000, 'Clase E': 850000,
  'Clase GLA': 580000, 'Clase GLC': 780000, 'Clase GLE': 1100000, 'Clase GLS': 1500000,
  // Land Rover
  'Range Rover Evoque': 900000, 'Range Rover Sport': 1400000,
  'Range Rover': 2000000, 'Defender': 1300000,
  // Lexus
  'ES': 720000, 'IS': 680000, 'NX': 780000, 'RX': 950000, 'UX': 650000,
  // Infiniti
  'Q50': 650000, 'QX50': 780000, 'QX60': 900000,
  // Cadillac
  'Escalade': 2000000, 'XT5': 820000,
  // Lincoln
  'Navigator': 1800000,
  // Porsche
  'Cayenne': 1500000, 'Macan': 950000, '911': 1800000,
  'Panamera': 1600000, 'Taycan': 1400000,
  // Jaguar
  'F-Pace': 950000, 'E-Pace': 750000, 'F-Type': 1200000,
  // GWM / Haval
  'Haval H6': 380000, 'Haval Jolion': 360000,
  // Subaru
  'Forester': 490000, 'Outback': 550000, 'WRX': 560000,
  // Tesla
  'Model 3': 680000, 'Model Y': 750000, 'Model S': 1400000, 'Model X': 1600000,
  // Volvo
  'XC40': 680000, 'XC60': 820000, 'XC90': 1050000,
};

const TRIM_MULTIPLIERS = {
  'Base TA':     { 'F-150': 1.00 },
  'XLT TA':      { 'F-150': 1.20 },
  'Limited TA':  { 'F-150': 1.87 },
  'Platinum TA': { 'F-150': 1.60 },
  'ST TA':       { 'F-150': 1.27 },
  'LS CVT':      { 'Tracker': 1.00 },
  'LT CVT':      { 'Tracker': 1.11 },
  'RS CVT':      { 'Tracker': 1.22 },
  'Premier CVT': { 'Tracker': 1.34 }
};

const GENERIC_POSITION_MULT = [1.00, 1.10, 1.22, 1.35];

function getMSRP(makeName, modelName, year, trimName, trimIndex = 0) {
  const base2022 = BASE_PRICES_2022[modelName] || 350000;
  const yearAdj  = (year - 2022) * Math.round(base2022 * 0.03);
  const baseYear = base2022 + yearAdj;

  const modelSpecific = TRIM_MULTIPLIERS[trimName]?.[modelName];
  if (modelSpecific != null) {
    return Math.round(Math.max(150000, baseYear * modelSpecific));
  }

  const mult = GENERIC_POSITION_MULT[Math.min(trimIndex, GENERIC_POSITION_MULT.length - 1)];
  return Math.round(Math.max(150000, baseYear * mult));
}

// ─── Seed function ────────────────────────────────────────────────────────────

async function seed() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Makes
    const makeIds = {};
    for (const make of seedData.makes) {
      const res = await client.query(
        `INSERT INTO makes (name, country, popular) VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET country = EXCLUDED.country, popular = EXCLUDED.popular
         RETURNING id`,
        [make.name, make.country, make.popular]
      );
      makeIds[make.name] = res.rows[0].id;
    }
    console.log(`Seeded ${Object.keys(makeIds).length} makes`);

    // Models
    const modelIds = {};
    for (const [makeName, models] of Object.entries(seedData.models)) {
      const makeId = makeIds[makeName];
      if (!makeId) continue;
      for (const model of models) {
        const res = await client.query(
          `INSERT INTO models (make_id, name, body_type, segment, popular)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (make_id, name) DO UPDATE
             SET body_type = EXCLUDED.body_type, segment = EXCLUDED.segment, popular = EXCLUDED.popular
           RETURNING id`,
          [makeId, model.name, model.body_type, model.segment, model.popular]
        );
        modelIds[`${makeName}/${model.name}`] = {
          id:        res.rows[0].id,
          yearStart: model.yearStart || YEAR_DEFAULT_START,
          yearEnd:   model.yearEnd   || YEAR_DEFAULT_END
        };
      }
    }
    console.log(`Seeded ${Object.keys(modelIds).length} models`);

    // Years (per-model range)
    const yearIds = {};
    for (const [key, { id: modelId, yearStart, yearEnd }] of Object.entries(modelIds)) {
      for (let year = yearStart; year <= yearEnd; year++) {
        const res = await client.query(
          `INSERT INTO years (model_id, year) VALUES ($1, $2)
           ON CONFLICT (model_id, year) DO UPDATE SET year = EXCLUDED.year
           RETURNING id`,
          [modelId, year]
        );
        yearIds[`${key}/${year}`] = res.rows[0].id;
      }
    }
    console.log(`Seeded ${Object.keys(yearIds).length} year records`);

    // Trims
    let trimCount = 0;
    const defaultTrims = [
      { name: 'Base',  engine: null, transmission: 'Manual',     fuel_type: 'Gasolina' },
      { name: 'Mid',   engine: null, transmission: 'Automático', fuel_type: 'Gasolina' },
      { name: 'Top',   engine: null, transmission: 'Automático', fuel_type: 'Gasolina' }
    ];

    for (const [key, yearId] of Object.entries(yearIds)) {
      const parts     = key.split('/');
      const makeName  = parts[0];
      const modelName = parts[1];
      const year      = parseInt(parts[2]);

      const trims = trimsByModel[modelName] || defaultTrims;

      const currentNames = trims.map(t => t.name);
      await client.query(
        `DELETE FROM trims WHERE year_id = $1 AND name != ALL($2::text[])`,
        [yearId, currentNames]
      );

      for (let i = 0; i < trims.length; i++) {
        const trim = trims[i];
        const msrp = getMSRP(makeName, modelName, year, trim.name, i);
        await client.query(
          `INSERT INTO trims (year_id, name, engine, transmission, fuel_type, msrp_mxn)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (year_id, name) DO UPDATE
             SET engine = EXCLUDED.engine, transmission = EXCLUDED.transmission,
                 fuel_type = EXCLUDED.fuel_type, msrp_mxn = EXCLUDED.msrp_mxn`,
          [yearId, trim.name, trim.engine, trim.transmission, trim.fuel_type, msrp]
        );
        trimCount++;
      }
    }
    console.log(`Seeded ${trimCount} trims`);

    await client.query('COMMIT');
    console.log('Database seeded successfully!');

    return {
      makes:  Object.keys(makeIds).length,
      models: Object.keys(modelIds).length,
      years:  Object.keys(yearIds).length,
      trims:  trimCount
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function seedDatabase() { return seed(); }

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = { seedDatabase };
