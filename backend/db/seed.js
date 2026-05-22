require('dotenv').config();
const db = require('./connection');

const seedData = {
  makes: [
    { name: 'Nissan', country: 'Japan', popular: true },
    { name: 'Chevrolet', country: 'USA', popular: true },
    { name: 'Toyota', country: 'Japan', popular: true },
    { name: 'Volkswagen', country: 'Germany', popular: true },
    { name: 'Kia', country: 'South Korea', popular: true },
    { name: 'Honda', country: 'Japan', popular: true },
    { name: 'Ford', country: 'USA', popular: true },
    { name: 'Mazda', country: 'Japan', popular: true },
    { name: 'Hyundai', country: 'South Korea', popular: true },
    { name: 'SEAT', country: 'Spain', popular: true },
    { name: 'Jeep', country: 'USA', popular: false },
    { name: 'BMW', country: 'Germany', popular: false },
    { name: 'Mercedes-Benz', country: 'Germany', popular: false },
    { name: 'Audi', country: 'Germany', popular: false },
    { name: 'Renault', country: 'France', popular: false },
    { name: 'Peugeot', country: 'France', popular: false },
    { name: 'Mitsubishi', country: 'Japan', popular: false },
    { name: 'Suzuki', country: 'Japan', popular: false },
    { name: 'RAM', country: 'USA', popular: false },
    { name: 'GMC', country: 'USA', popular: false }
  ],
  models: {
    'Nissan': [
      { name: 'Versa', body_type: 'Sedan', segment: 'Subcompact', popular: true },
      { name: 'Kicks', body_type: 'SUV', segment: 'Subcompact SUV', popular: true },
      { name: 'Sentra', body_type: 'Sedan', segment: 'Compact', popular: true },
      { name: 'X-Trail', body_type: 'SUV', segment: 'Compact SUV', popular: true },
      { name: 'NP300', body_type: 'Pickup', segment: 'Pickup', popular: true },
      { name: 'Altima', body_type: 'Sedan', segment: 'Midsize', popular: false },
      { name: 'Frontier', body_type: 'Pickup', segment: 'Midsize Pickup', popular: false },
      { name: 'Pathfinder', body_type: 'SUV', segment: 'Midsize SUV', popular: false }
    ],
    'Chevrolet': [
      { name: 'Spark', body_type: 'Hatchback', segment: 'Minicompact', popular: true },
      { name: 'Aveo', body_type: 'Sedan', segment: 'Subcompact', popular: true },
      { name: 'Cavalier', body_type: 'Sedan', segment: 'Compact', popular: true },
      { name: 'Trax', body_type: 'SUV', segment: 'Subcompact SUV', popular: true },
      { name: 'Equinox', body_type: 'SUV', segment: 'Compact SUV', popular: true },
      { name: 'Silverado', body_type: 'Pickup', segment: 'Full-size Pickup', popular: true },
      { name: 'Blazer', body_type: 'SUV', segment: 'Midsize SUV', popular: false },
      { name: 'Tahoe', body_type: 'SUV', segment: 'Full-size SUV', popular: false }
    ],
    'Toyota': [
      { name: 'Yaris', body_type: 'Sedan', segment: 'Subcompact', popular: true },
      { name: 'Corolla', body_type: 'Sedan', segment: 'Compact', popular: true },
      { name: 'Camry', body_type: 'Sedan', segment: 'Midsize', popular: true },
      { name: 'RAV4', body_type: 'SUV', segment: 'Compact SUV', popular: true },
      { name: 'Hilux', body_type: 'Pickup', segment: 'Midsize Pickup', popular: true },
      { name: 'Tacoma', body_type: 'Pickup', segment: 'Midsize Pickup', popular: false },
      { name: 'Fortuner', body_type: 'SUV', segment: 'Midsize SUV', popular: false },
      { name: 'Land Cruiser', body_type: 'SUV', segment: 'Full-size SUV', popular: false }
    ],
    'Volkswagen': [
      { name: 'Vento', body_type: 'Sedan', segment: 'Compact', popular: true },
      { name: 'Jetta', body_type: 'Sedan', segment: 'Compact', popular: true },
      { name: 'Virtus', body_type: 'Sedan', segment: 'Compact', popular: true },
      { name: 'T-Cross', body_type: 'SUV', segment: 'Subcompact SUV', popular: true },
      { name: 'Tiguan', body_type: 'SUV', segment: 'Compact SUV', popular: true },
      { name: 'Polo', body_type: 'Hatchback', segment: 'Subcompact', popular: false },
      { name: 'Taos', body_type: 'SUV', segment: 'Compact SUV', popular: false },
      { name: 'Touareg', body_type: 'SUV', segment: 'Midsize SUV', popular: false }
    ],
    'Kia': [
      { name: 'Rio', body_type: 'Sedan', segment: 'Subcompact', popular: true },
      { name: 'Forte', body_type: 'Sedan', segment: 'Compact', popular: true },
      { name: 'Sportage', body_type: 'SUV', segment: 'Compact SUV', popular: true },
      { name: 'Seltos', body_type: 'SUV', segment: 'Subcompact SUV', popular: true },
      { name: 'Sorento', body_type: 'SUV', segment: 'Midsize SUV', popular: false },
      { name: 'Picanto', body_type: 'Hatchback', segment: 'Minicompact', popular: false }
    ],
    'Honda': [
      { name: 'City', body_type: 'Sedan', segment: 'Subcompact', popular: true },
      { name: 'Civic', body_type: 'Sedan', segment: 'Compact', popular: true },
      { name: 'HR-V', body_type: 'SUV', segment: 'Subcompact SUV', popular: true },
      { name: 'CR-V', body_type: 'SUV', segment: 'Compact SUV', popular: true },
      { name: 'Accord', body_type: 'Sedan', segment: 'Midsize', popular: false },
      { name: 'Pilot', body_type: 'SUV', segment: 'Midsize SUV', popular: false }
    ],
    'Ford': [
      { name: 'F-150', body_type: 'Pickup', segment: 'Full-size Pickup', popular: true },
      { name: 'EcoSport', body_type: 'SUV', segment: 'Subcompact SUV', popular: true },
      { name: 'Escape', body_type: 'SUV', segment: 'Compact SUV', popular: true },
      { name: 'Explorer', body_type: 'SUV', segment: 'Midsize SUV', popular: true },
      { name: 'Bronco', body_type: 'SUV', segment: 'Compact SUV', popular: false },
      { name: 'Ranger', body_type: 'Pickup', segment: 'Midsize Pickup', popular: false },
      { name: 'Maverick', body_type: 'Pickup', segment: 'Compact Pickup', popular: false }
    ],
    'Mazda': [
      { name: 'Mazda2', body_type: 'Sedan', segment: 'Subcompact', popular: true },
      { name: 'Mazda3', body_type: 'Sedan', segment: 'Compact', popular: true },
      { name: 'CX-30', body_type: 'SUV', segment: 'Subcompact SUV', popular: true },
      { name: 'CX-5', body_type: 'SUV', segment: 'Compact SUV', popular: true },
      { name: 'Mazda6', body_type: 'Sedan', segment: 'Midsize', popular: false },
      { name: 'CX-9', body_type: 'SUV', segment: 'Midsize SUV', popular: false }
    ],
    'Hyundai': [
      { name: 'Grand i10', body_type: 'Sedan', segment: 'Subcompact', popular: true },
      { name: 'Elantra', body_type: 'Sedan', segment: 'Compact', popular: true },
      { name: 'Creta', body_type: 'SUV', segment: 'Subcompact SUV', popular: true },
      { name: 'Tucson', body_type: 'SUV', segment: 'Compact SUV', popular: true },
      { name: 'Santa Fe', body_type: 'SUV', segment: 'Midsize SUV', popular: false }
    ],
    'SEAT': [
      { name: 'Ibiza', body_type: 'Hatchback', segment: 'Subcompact', popular: true },
      { name: 'Leon', body_type: 'Hatchback', segment: 'Compact', popular: true },
      { name: 'Ateca', body_type: 'SUV', segment: 'Compact SUV', popular: true },
      { name: 'Tarraco', body_type: 'SUV', segment: 'Midsize SUV', popular: false }
    ]
  }
};

const trimsByModel = {
  'Versa': [
    { name: 'Sense', engine: '1.6L 4-cyl 109hp', transmission: 'Manual 5-speed', fuel_type: 'Gasolina' },
    { name: 'Advance', engine: '1.6L 4-cyl 109hp', transmission: 'CVT', fuel_type: 'Gasolina' },
    { name: 'Exclusive', engine: '1.6L 4-cyl 109hp', transmission: 'CVT', fuel_type: 'Gasolina' }
  ],
  'Kicks': [
    { name: 'Sense', engine: '1.6L 4-cyl 122hp', transmission: 'CVT', fuel_type: 'Gasolina' },
    { name: 'Advance', engine: '1.6L 4-cyl 122hp', transmission: 'CVT', fuel_type: 'Gasolina' },
    { name: 'Exclusive', engine: '1.6L 4-cyl 122hp', transmission: 'CVT', fuel_type: 'Gasolina' }
  ],
  'Jetta': [
    { name: 'Trendline', engine: '1.4L Turbo 150hp', transmission: 'Manual 6-speed', fuel_type: 'Gasolina' },
    { name: 'Highline', engine: '1.4L Turbo 150hp', transmission: 'Automático 8-speed', fuel_type: 'Gasolina' },
    { name: 'GLI', engine: '2.0L Turbo 228hp', transmission: 'Automático 7-speed', fuel_type: 'Gasolina' }
  ],
  'Corolla': [
    { name: 'Base', engine: '1.8L 4-cyl 140hp', transmission: 'CVT', fuel_type: 'Gasolina' },
    { name: 'LE', engine: '1.8L 4-cyl 140hp', transmission: 'CVT', fuel_type: 'Gasolina' },
    { name: 'SE', engine: '2.0L 4-cyl 169hp', transmission: 'CVT', fuel_type: 'Gasolina' },
    { name: 'XSE', engine: '2.0L 4-cyl 169hp', transmission: 'CVT', fuel_type: 'Gasolina' }
  ],
  'Civic': [
    { name: 'Uniq', engine: '1.5L Turbo 174hp', transmission: 'Manual 6-speed', fuel_type: 'Gasolina' },
    { name: 'Sport', engine: '1.5L Turbo 174hp', transmission: 'CVT', fuel_type: 'Gasolina' },
    { name: 'Touring', engine: '1.5L Turbo 174hp', transmission: 'CVT', fuel_type: 'Gasolina' }
  ],
  'Sportage': [
    { name: 'LX', engine: '2.0L 4-cyl 155hp', transmission: 'Automático 6-speed', fuel_type: 'Gasolina' },
    { name: 'EX', engine: '2.0L 4-cyl 155hp', transmission: 'Automático 6-speed', fuel_type: 'Gasolina' },
    { name: 'SX', engine: '2.4L 4-cyl 181hp', transmission: 'Automático 6-speed', fuel_type: 'Gasolina' }
  ]
};

const defaultTrims = [
  { name: 'Base', engine: '1.6L 4-cyl', transmission: 'Manual', fuel_type: 'Gasolina' },
  { name: 'Mid', engine: '1.6L 4-cyl', transmission: 'Automático', fuel_type: 'Gasolina' },
  { name: 'Top', engine: '2.0L 4-cyl', transmission: 'Automático', fuel_type: 'Gasolina' }
];

function getMSRP(makeName, modelName, year, trimName) {
  const basePrices = {
    'Versa': 245000, 'Kicks': 370000, 'Sentra': 380000, 'X-Trail': 530000,
    'Spark': 210000, 'Aveo': 265000, 'Cavalier': 310000, 'Trax': 395000,
    'Yaris': 260000, 'Corolla': 405000, 'Camry': 580000, 'RAV4': 570000,
    'Vento': 310000, 'Jetta': 400000, 'Virtus': 350000, 'Tiguan': 550000,
    'Rio': 265000, 'Forte': 360000, 'Sportage': 480000,
    'City': 290000, 'Civic': 440000, 'HR-V': 430000, 'CR-V': 560000,
    'F-150': 700000, 'EcoSport': 380000, 'Escape': 490000,
    'Mazda3': 400000, 'CX-5': 530000, 'CX-30': 460000,
    'Elantra': 385000, 'Tucson': 490000, 'Creta': 390000,
    'Ibiza': 320000, 'Leon': 420000, 'Ateca': 490000
  };

  const base = basePrices[modelName] || 350000;
  const yearAdj = (year - 2020) * 15000;
  const trimAdj = trimName === 'Base' ? 0 : trimName === 'Mid' ? 30000 : 60000;
  return Math.max(150000, base + yearAdj + trimAdj);
}

async function seed() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Insert makes
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

    // Insert models
    const modelIds = {};
    for (const [makeName, models] of Object.entries(seedData.models)) {
      const makeId = makeIds[makeName];
      if (!makeId) continue;
      for (const model of models) {
        const res = await client.query(
          `INSERT INTO models (make_id, name, body_type, segment, popular) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (make_id, name) DO UPDATE SET body_type = EXCLUDED.body_type, popular = EXCLUDED.popular
           RETURNING id`,
          [makeId, model.name, model.body_type, model.segment, model.popular]
        );
        modelIds[`${makeName}/${model.name}`] = res.rows[0].id;
      }
    }
    console.log(`Seeded ${Object.keys(modelIds).length} models`);

    // Insert years (2018–2025 for each model)
    const yearIds = {};
    const currentYear = new Date().getFullYear();
    for (const [key, modelId] of Object.entries(modelIds)) {
      for (let year = 2018; year <= currentYear; year++) {
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

    // Insert trims
    let trimCount = 0;
    for (const [key, yearId] of Object.entries(yearIds)) {
      const parts = key.split('/');
      const modelName = parts[1];
      const year = parseInt(parts[2]);
      const makeName = parts[0];

      const trims = trimsByModel[modelName] || defaultTrims;
      for (const trim of trims) {
        const msrp = getMSRP(makeName, modelName, year, trim.name);
        await client.query(
          `INSERT INTO trims (year_id, name, engine, transmission, fuel_type, msrp_mxn)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (year_id, name) DO NOTHING`,
          [yearId, trim.name, trim.engine, trim.transmission, trim.fuel_type, msrp]
        );
        trimCount++;
      }
    }
    console.log(`Seeded ${trimCount} trims`);

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
