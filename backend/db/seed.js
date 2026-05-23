require('dotenv').config();
const db = require('./connection');

// Each model can define yearStart / yearEnd; defaults: 2015 – 2026
const YEAR_DEFAULT_START = 2015;
const YEAR_DEFAULT_END   = 2026;

const seedData = {
  makes: [
    { name: 'Audi',          country: 'Germany',     popular: false },
    { name: 'BMW',           country: 'Germany',     popular: false },
    { name: 'Chevrolet',     country: 'USA',         popular: true  },
    { name: 'Ford',          country: 'USA',         popular: true  },
    { name: 'GMC',           country: 'USA',         popular: false },
    { name: 'Honda',         country: 'Japan',       popular: true  },
    { name: 'Hyundai',       country: 'South Korea', popular: true  },
    { name: 'Jeep',          country: 'USA',         popular: false },
    { name: 'Kia',           country: 'South Korea', popular: true  },
    { name: 'Mazda',         country: 'Japan',       popular: true  },
    { name: 'Mercedes-Benz', country: 'Germany',     popular: false },
    { name: 'Mitsubishi',    country: 'Japan',       popular: false },
    { name: 'Nissan',        country: 'Japan',       popular: true  },
    { name: 'Peugeot',       country: 'France',      popular: false },
    { name: 'RAM',           country: 'USA',         popular: false },
    { name: 'Renault',       country: 'France',      popular: false },
    { name: 'SEAT',          country: 'Spain',       popular: true  },
    { name: 'Suzuki',        country: 'Japan',       popular: false },
    { name: 'Toyota',        country: 'Japan',       popular: true  },
    { name: 'Volkswagen',    country: 'Germany',     popular: true  }
  ],

  models: {
    'Nissan': [
      { name: 'Versa',     body_type: 'Sedan',   segment: 'Subcompact',      popular: true  },
      { name: 'Kicks',     body_type: 'SUV',     segment: 'Subcompact SUV',  popular: true  },
      { name: 'Sentra',    body_type: 'Sedan',   segment: 'Compact',         popular: true  },
      { name: 'X-Trail',   body_type: 'SUV',     segment: 'Compact SUV',     popular: true  },
      { name: 'NP300',     body_type: 'Pickup',  segment: 'Pickup',          popular: true  },
      { name: 'Altima',    body_type: 'Sedan',   segment: 'Midsize',         popular: false },
      { name: 'Frontier',  body_type: 'Pickup',  segment: 'Midsize Pickup',  popular: false },
      { name: 'Pathfinder',body_type: 'SUV',     segment: 'Midsize SUV',     popular: false }
    ],
    'Chevrolet': [
      { name: 'Spark',     body_type: 'Hatchback',segment: 'Minicompact',    popular: true  },
      { name: 'Aveo',      body_type: 'Sedan',   segment: 'Subcompact',      popular: true  },
      { name: 'Cavalier',  body_type: 'Sedan',   segment: 'Compact',         popular: true,  yearStart: 2018 },
      { name: 'Tracker',   body_type: 'SUV',     segment: 'Subcompact SUV',  popular: true,  yearStart: 2020 },
      { name: 'Trax',      body_type: 'SUV',     segment: 'Subcompact SUV',  popular: true  },
      { name: 'Equinox',   body_type: 'SUV',     segment: 'Compact SUV',     popular: true  },
      { name: 'Silverado', body_type: 'Pickup',  segment: 'Full-size Pickup',popular: true  },
      { name: 'Blazer',    body_type: 'SUV',     segment: 'Midsize SUV',     popular: false, yearStart: 2019 },
      { name: 'Tahoe',     body_type: 'SUV',     segment: 'Full-size SUV',   popular: false }
    ],
    'Toyota': [
      { name: 'Yaris',       body_type: 'Sedan',  segment: 'Subcompact',     popular: true  },
      { name: 'Corolla',     body_type: 'Sedan',  segment: 'Compact',        popular: true  },
      { name: 'Camry',       body_type: 'Sedan',  segment: 'Midsize',        popular: true  },
      { name: 'RAV4',        body_type: 'SUV',    segment: 'Compact SUV',    popular: true  },
      { name: 'Hilux',       body_type: 'Pickup', segment: 'Midsize Pickup', popular: true  },
      { name: 'Tacoma',      body_type: 'Pickup', segment: 'Midsize Pickup', popular: false },
      { name: 'Fortuner',    body_type: 'SUV',    segment: 'Midsize SUV',    popular: false },
      { name: 'Land Cruiser',body_type: 'SUV',    segment: 'Full-size SUV',  popular: false }
    ],
    'Volkswagen': [
      { name: 'Vento',    body_type: 'Sedan',    segment: 'Compact',        popular: true  },
      { name: 'Jetta',    body_type: 'Sedan',    segment: 'Compact',        popular: true  },
      { name: 'Virtus',   body_type: 'Sedan',    segment: 'Compact',        popular: true,  yearStart: 2020 },
      { name: 'T-Cross',  body_type: 'SUV',      segment: 'Subcompact SUV', popular: true,  yearStart: 2020 },
      { name: 'Tiguan',   body_type: 'SUV',      segment: 'Compact SUV',    popular: true  },
      { name: 'Polo',     body_type: 'Hatchback', segment: 'Subcompact',    popular: false },
      { name: 'Taos',     body_type: 'SUV',      segment: 'Compact SUV',    popular: false, yearStart: 2021 },
      { name: 'Touareg',  body_type: 'SUV',      segment: 'Midsize SUV',    popular: false }
    ],
    'Kia': [
      { name: 'Rio',      body_type: 'Sedan',    segment: 'Subcompact',     popular: true  },
      { name: 'Forte',    body_type: 'Sedan',    segment: 'Compact',        popular: true  },
      { name: 'Sportage', body_type: 'SUV',      segment: 'Compact SUV',    popular: true  },
      { name: 'Seltos',   body_type: 'SUV',      segment: 'Subcompact SUV', popular: true,  yearStart: 2020 },
      { name: 'Sorento',  body_type: 'SUV',      segment: 'Midsize SUV',    popular: false },
      { name: 'Picanto',  body_type: 'Hatchback', segment: 'Minicompact',   popular: false }
    ],
    'Honda': [
      { name: 'City',   body_type: 'Sedan', segment: 'Subcompact',   popular: true  },
      { name: 'Civic',  body_type: 'Sedan', segment: 'Compact',      popular: true  },
      { name: 'HR-V',   body_type: 'SUV',  segment: 'Subcompact SUV',popular: true  },
      { name: 'CR-V',   body_type: 'SUV',  segment: 'Compact SUV',   popular: true  },
      { name: 'Accord', body_type: 'Sedan', segment: 'Midsize',      popular: false },
      { name: 'Pilot',  body_type: 'SUV',  segment: 'Midsize SUV',   popular: false }
    ],
    'Ford': [
      { name: 'F-150',    body_type: 'Pickup', segment: 'Full-size Pickup', popular: true  },
      { name: 'EcoSport', body_type: 'SUV',   segment: 'Subcompact SUV',   popular: true,  yearEnd: 2022 },
      { name: 'Escape',   body_type: 'SUV',   segment: 'Compact SUV',      popular: true  },
      { name: 'Explorer', body_type: 'SUV',   segment: 'Midsize SUV',      popular: true  },
      { name: 'Bronco',   body_type: 'SUV',   segment: 'Compact SUV',      popular: false, yearStart: 2021 },
      { name: 'Ranger',   body_type: 'Pickup', segment: 'Midsize Pickup',  popular: false, yearStart: 2019 },
      { name: 'Maverick', body_type: 'Pickup', segment: 'Compact Pickup',  popular: false, yearStart: 2022 }
    ],
    'Mazda': [
      { name: 'Mazda2', body_type: 'Sedan', segment: 'Subcompact',    popular: true  },
      { name: 'Mazda3', body_type: 'Sedan', segment: 'Compact',       popular: true  },
      { name: 'CX-30',  body_type: 'SUV',  segment: 'Subcompact SUV', popular: true,  yearStart: 2020 },
      { name: 'CX-5',   body_type: 'SUV',  segment: 'Compact SUV',   popular: true  },
      { name: 'Mazda6', body_type: 'Sedan', segment: 'Midsize',       popular: false },
      { name: 'CX-9',   body_type: 'SUV',  segment: 'Midsize SUV',   popular: false }
    ],
    'Hyundai': [
      { name: 'Grand i10', body_type: 'Sedan', segment: 'Subcompact',    popular: true  },
      { name: 'Elantra',   body_type: 'Sedan', segment: 'Compact',       popular: true  },
      { name: 'Creta',     body_type: 'SUV',   segment: 'Subcompact SUV',popular: true,  yearStart: 2017 },
      { name: 'Tucson',    body_type: 'SUV',   segment: 'Compact SUV',   popular: true  },
      { name: 'Santa Fe',  body_type: 'SUV',   segment: 'Midsize SUV',   popular: false }
    ],
    'SEAT': [
      { name: 'Ibiza',   body_type: 'Hatchback', segment: 'Subcompact',  popular: true  },
      { name: 'Leon',    body_type: 'Hatchback', segment: 'Compact',     popular: true  },
      { name: 'Ateca',   body_type: 'SUV',       segment: 'Compact SUV', popular: true  },
      { name: 'Tarraco', body_type: 'SUV',       segment: 'Midsize SUV', popular: false, yearStart: 2019 }
    ]
  }
};

// ─── Trims per model ─────────────────────────────────────────────────────────

const trimsByModel = {
  // Nissan
  'Versa': [
    { name: 'Sense',    engine: '1.6L 4-cil 109hp', transmission: 'Manual 5 vel',  fuel_type: 'Gasolina' },
    { name: 'Advance',  engine: '1.6L 4-cil 109hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Exclusive',engine: '1.6L 4-cil 109hp', transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],
  'Kicks': [
    { name: 'Sense',    engine: '1.6L 4-cil 122hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Advance',  engine: '1.6L 4-cil 122hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Exclusive',engine: '1.6L 4-cil 122hp', transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],
  'Sentra': [
    { name: 'Sense',    engine: '2.0L 4-cil 149hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Advance',  engine: '2.0L 4-cil 149hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Exclusive',engine: '2.0L 4-cil 149hp', transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],
  'X-Trail': [
    { name: 'Sense',    engine: '2.5L 4-cil 170hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Advance',  engine: '2.5L 4-cil 170hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Exclusive',engine: '2.5L 4-cil 170hp', transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],
  'NP300': [
    { name: 'S MT',     engine: '2.5L 4-cil 152hp', transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'SL AT',    engine: '2.5L 4-cil 152hp', transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'Pro-4X',   engine: '2.5L 4-cil 152hp', transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],
  'Altima': [
    { name: 'Sense',    engine: '2.5L 4-cil 188hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Advance',  engine: '2.5L 4-cil 188hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Exclusive',engine: '2.5L 4-cil 188hp', transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],
  'Frontier': [
    { name: 'S MT',     engine: '2.5L 4-cil 152hp', transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'SL AT',    engine: '2.5L 4-cil 152hp', transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'Pro-4X AT',engine: '4.0L V6 261hp',    transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],
  'Pathfinder': [
    { name: 'Sense',    engine: '3.5L V6 284hp',    transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Advance',  engine: '3.5L V6 284hp',    transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Exclusive',engine: '3.5L V6 284hp',    transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],

  // Chevrolet
  'Spark': [
    { name: 'LT MT',    engine: '1.4L 4-cil 98hp',  transmission: 'Manual 5 vel',  fuel_type: 'Gasolina' },
    { name: 'LT AT',    engine: '1.4L 4-cil 98hp',  transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'Premier',  engine: '1.4L 4-cil 98hp',  transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],
  'Aveo': [
    { name: 'LS MT',    engine: '1.5L 4-cil 106hp', transmission: 'Manual 5 vel',  fuel_type: 'Gasolina' },
    { name: 'LT AT',    engine: '1.5L 4-cil 106hp', transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'Premier',  engine: '1.5L 4-cil 106hp', transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],
  'Cavalier': [
    { name: 'LS MT',    engine: '1.5L Turbo 172hp', transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'LT AT',    engine: '1.5L Turbo 172hp', transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'Premier',  engine: '1.5L Turbo 172hp', transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],
  'Tracker': [
    { name: 'LS CVT',   engine: '1.2L Turbo 133hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'LT CVT',   engine: '1.2L Turbo 133hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'RS CVT',   engine: '1.2L Turbo 133hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Premier CVT',engine:'1.2L Turbo 133hp', transmission: 'CVT',          fuel_type: 'Gasolina' }
  ],
  'Trax': [
    { name: 'LS MT',    engine: '1.4L Turbo 138hp', transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'LT AT',    engine: '1.4L Turbo 138hp', transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'Premier',  engine: '1.4L Turbo 138hp', transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],
  'Equinox': [
    { name: 'LS AT',    engine: '1.5L Turbo 170hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'LT AT',    engine: '1.5L Turbo 170hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Premier',  engine: '2.0L Turbo 252hp', transmission: 'Automático 9 vel',fuel_type:'Gasolina' }
  ],
  'Silverado': [
    { name: 'LT AT',    engine: '5.3L V8 355hp',    transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'LTZ AT',   engine: '5.3L V8 355hp',    transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'High Country',engine:'6.2L V8 420hp',  transmission: 'Automático 10 vel',fuel_type:'Gasolina'}
  ],
  'Blazer': [
    { name: 'LT AT',    engine: '2.5L 4-cil 193hp', transmission: 'Automático 9 vel',fuel_type:'Gasolina' },
    { name: 'Premier',  engine: '3.6L V6 308hp',    transmission: 'Automático 9 vel',fuel_type:'Gasolina' },
    { name: 'RS',       engine: '2.0L Turbo 228hp', transmission: 'Automático 9 vel',fuel_type:'Gasolina' }
  ],
  'Tahoe': [
    { name: 'LT AT',    engine: '5.3L V8 355hp',    transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Premier',  engine: '5.3L V8 355hp',    transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'High Country',engine:'6.2L V8 420hp',  transmission: 'Automático 10 vel',fuel_type:'Gasolina'}
  ],

  // Toyota
  'Yaris': [
    { name: 'S MT',     engine: '1.5L 4-cil 107hp', transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'S AT',     engine: '1.5L 4-cil 107hp', transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'XLE AT',   engine: '1.5L 4-cil 107hp', transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],
  'Corolla': [
    { name: 'Base',     engine: '1.8L 4-cil 140hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'LE',       engine: '1.8L 4-cil 140hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'SE',       engine: '2.0L 4-cil 169hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'XSE',      engine: '2.0L 4-cil 169hp', transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],
  'Camry': [
    { name: 'LE AT',    engine: '2.5L 4-cil 203hp', transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'SE AT',    engine: '2.5L 4-cil 203hp', transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'XSE V6',  engine: '3.5L V6 301hp',    transmission: 'Automático 8 vel',fuel_type:'Gasolina' }
  ],
  'RAV4': [
    { name: 'LE AT',    engine: '2.5L 4-cil 203hp', transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'XLE AT',   engine: '2.5L 4-cil 203hp', transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'XLE Premium',engine:'2.5L 4-cil 203hp',transmission: 'Automático 8 vel',fuel_type:'Gasolina' }
  ],
  'Hilux': [
    { name: 'SR MT',    engine: '2.7L 4-cil 166hp', transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'SRV AT',   engine: '2.7L 4-cil 166hp', transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'GR Sport', engine: '2.8L TD 204hp',    transmission: 'Automático 6 vel',fuel_type:'Diésel'  }
  ],
  'Tacoma': [
    { name: 'SR MT',    engine: '2.7L 4-cil 159hp', transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'TRD Sport',engine: '3.5L V6 278hp',    transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'TRD Pro',  engine: '3.5L V6 278hp',    transmission: 'Automático 6 vel',fuel_type:'Gasolina' }
  ],
  'Fortuner': [
    { name: 'Base AT',  engine: '2.7L 4-cil 166hp', transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'TRD Sport',engine: '2.8L TD 201hp',    transmission: 'Automático 6 vel',fuel_type:'Diésel'  },
    { name: 'Legender', engine: '2.8L TD 201hp',    transmission: 'Automático 6 vel',fuel_type:'Diésel'  }
  ],
  'Land Cruiser': [
    { name: '200 GXR',  engine: '4.6L V8 309hp',    transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: '300 VX',   engine: '3.3L V6 Hybrid',   transmission: 'Automático',    fuel_type: 'Híbrido' },
    { name: '300 GR-S', engine: '3.3L V6 Hybrid',   transmission: 'Automático',    fuel_type: 'Híbrido' }
  ],

  // Volkswagen
  'Vento': [
    { name: 'Trendline MT',engine:'1.6L 4-cil 101hp',transmission:'Manual 5 vel',  fuel_type:'Gasolina'  },
    { name: 'Comfortline', engine:'1.6L 4-cil 101hp',transmission:'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Highline',    engine:'1.6L 4-cil 101hp',transmission:'Automático 6 vel',fuel_type:'Gasolina' }
  ],
  'Jetta': [
    { name: 'Trendline',  engine: '1.4L Turbo 150hp',transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'Highline',   engine: '1.4L Turbo 150hp',transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'GLI',        engine: '2.0L Turbo 228hp',transmission: 'Automático 7 vel',fuel_type:'Gasolina' }
  ],
  'Virtus': [
    { name: 'Trendline',  engine: '1.6L 4-cil 104hp',transmission: 'Manual 5 vel',  fuel_type: 'Gasolina' },
    { name: 'Comfortline',engine: '1.6L 4-cil 104hp',transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'Highline',   engine: '1.6L 4-cil 104hp',transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],
  'T-Cross': [
    { name: 'Trendline',  engine: '1.0L Turbo 115hp',transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Comfortline',engine: '1.0L Turbo 115hp',transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Highline',   engine: '1.5L Turbo 150hp',transmission: 'Automático 7 vel',fuel_type:'Gasolina' }
  ],
  'Tiguan': [
    { name: 'Trendline',  engine: '1.4L Turbo 150hp',transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'Comfortline',engine: '2.0L Turbo 220hp',transmission: 'Automático 7 vel',fuel_type:'Gasolina' },
    { name: 'Highline',   engine: '2.0L Turbo 220hp',transmission: 'Automático 7 vel',fuel_type:'Gasolina' },
    { name: 'R-Line',     engine: '2.0L Turbo 220hp',transmission: 'Automático 7 vel',fuel_type:'Gasolina' }
  ],
  'Polo': [
    { name: 'Trendline',  engine: '1.6L 4-cil 101hp',transmission: 'Manual 5 vel',  fuel_type: 'Gasolina' },
    { name: 'Comfortline',engine: '1.6L 4-cil 101hp',transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'Highline',   engine: '1.6L 4-cil 101hp',transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],
  'Taos': [
    { name: 'Trendline',  engine: '1.4L Turbo 150hp',transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Comfortline',engine: '1.4L Turbo 150hp',transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Highline',   engine: '1.4L Turbo 150hp',transmission: 'Automático 7 vel',fuel_type:'Gasolina' }
  ],
  'Touareg': [
    { name: 'Elegance',   engine: '3.0L V6 TSI 340hp',transmission:'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'R-Line',     engine: '3.0L V6 TSI 340hp',transmission:'Automático 8 vel',fuel_type:'Gasolina' }
  ],

  // Kia
  'Rio': [
    { name: 'L MT',     engine: '1.6L 4-cil 120hp', transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'LX AT',    engine: '1.6L 4-cil 120hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'EX AT',    engine: '1.6L 4-cil 120hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' }
  ],
  'Forte': [
    { name: 'L MT',     engine: '2.0L 4-cil 147hp', transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'EX AT',    engine: '2.0L 4-cil 147hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'EX+ AT',   engine: '1.6L Turbo 201hp', transmission: 'Automático 7 vel',fuel_type:'Gasolina' }
  ],
  'Sportage': [
    { name: 'LX AT',    engine: '2.0L 4-cil 155hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'EX AT',    engine: '2.0L 4-cil 155hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'SX AT',    engine: '2.4L 4-cil 181hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' }
  ],
  'Seltos': [
    { name: 'LX AT',    engine: '2.0L 4-cil 149hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'EX AT',    engine: '2.0L 4-cil 149hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'EX+ AT',   engine: '1.6L Turbo 175hp', transmission: 'Automático 7 vel',fuel_type:'Gasolina' }
  ],
  'Sorento': [
    { name: 'LX AT',    engine: '2.5L 4-cil 191hp', transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'EX AT',    engine: '2.5L 4-cil 191hp', transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'SX AT',    engine: '2.5L Turbo 281hp', transmission: 'Automático 8 vel',fuel_type:'Gasolina' }
  ],
  'Picanto': [
    { name: 'LX MT',    engine: '1.2L 4-cil 84hp',  transmission: 'Manual 5 vel',  fuel_type: 'Gasolina' },
    { name: 'EX AT',    engine: '1.2L 4-cil 84hp',  transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],

  // Honda
  'City': [
    { name: 'Uniq CVT', engine: '1.5L 4-cil 120hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Sport CVT',engine: '1.5L 4-cil 120hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'EX CVT',   engine: '1.5L 4-cil 120hp', transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],
  'Civic': [
    { name: 'Uniq CVT', engine: '1.5L Turbo 174hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Sport CVT',engine: '1.5L Turbo 174hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Touring CVT',engine:'1.5L Turbo 174hp',transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],
  'HR-V': [
    { name: 'Uniq CVT', engine: '1.8L 4-cil 141hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Sport CVT',engine: '1.8L 4-cil 141hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'EX CVT',   engine: '1.8L 4-cil 141hp', transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],
  'CR-V': [
    { name: 'Uniq CVT', engine: '1.5L Turbo 190hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Sport CVT',engine: '1.5L Turbo 190hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'Touring CVT',engine:'1.5L Turbo 190hp',transmission: 'CVT',           fuel_type: 'Gasolina' }
  ],
  'Accord': [
    { name: 'Sport',    engine: '1.5L Turbo 192hp', transmission: 'CVT',           fuel_type: 'Gasolina' },
    { name: 'EX-L',     engine: '2.0L Turbo 252hp', transmission: 'Automático 10 vel',fuel_type:'Gasolina' },
    { name: 'Touring',  engine: '2.0L Turbo 252hp', transmission: 'Automático 10 vel',fuel_type:'Gasolina' }
  ],
  'Pilot': [
    { name: 'LX AT',    engine: '3.5L V6 280hp',    transmission: 'Automático 9 vel',fuel_type:'Gasolina' },
    { name: 'EX-L AT',  engine: '3.5L V6 280hp',    transmission: 'Automático 9 vel',fuel_type:'Gasolina' },
    { name: 'Black Edition',engine:'3.5L V6 280hp',  transmission: 'Automático 9 vel',fuel_type:'Gasolina' }
  ],

  // Ford — F-150 uses the exact trims requested by user
  'F-150': [
    { name: 'Base TA',     engine: '3.3L V6 290hp',    transmission: 'Automático 10 vel', fuel_type: 'Gasolina' },
    { name: 'XLT TA',     engine: '2.7L V6 EcoBoost 325hp', transmission: 'Automático 10 vel', fuel_type: 'Gasolina' },
    { name: 'Limited TA', engine: '3.5L V6 EcoBoost 400hp', transmission: 'Automático 10 vel', fuel_type: 'Gasolina' },
    { name: 'Platinum TA',engine: '3.5L V6 EcoBoost 400hp', transmission: 'Automático 10 vel', fuel_type: 'Gasolina' },
    { name: 'ST TA',      engine: '5.0L V8 400hp',    transmission: 'Automático 10 vel', fuel_type: 'Gasolina' }
  ],
  'EcoSport': [
    { name: 'S MT',     engine: '1.0L Turbo 123hp', transmission: 'Manual 6 vel',  fuel_type: 'Gasolina' },
    { name: 'SE AT',    engine: '2.0L 4-cil 166hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Titanium', engine: '2.0L 4-cil 166hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' }
  ],
  'Escape': [
    { name: 'S AT',     engine: '1.5L EcoBoost 181hp',transmission:'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'SE AT',    engine: '1.5L EcoBoost 181hp',transmission:'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'Titanium', engine: '2.0L EcoBoost 250hp',transmission:'Automático 8 vel',fuel_type:'Gasolina' }
  ],
  'Explorer': [
    { name: 'Base AT',  engine: '2.3L EcoBoost 300hp',transmission:'Automático 10 vel',fuel_type:'Gasolina' },
    { name: 'XLT AT',   engine: '2.3L EcoBoost 300hp',transmission:'Automático 10 vel',fuel_type:'Gasolina' },
    { name: 'Platinum', engine: '3.0L EcoBoost 400hp',transmission:'Automático 10 vel',fuel_type:'Gasolina' }
  ],
  'Bronco': [
    { name: 'Base MT',  engine: '2.3L EcoBoost 300hp',transmission:'Manual 7 vel',  fuel_type:'Gasolina'  },
    { name: 'Big Bend', engine: '2.3L EcoBoost 300hp',transmission:'Automático 10 vel',fuel_type:'Gasolina'},
    { name: 'Wildtrak', engine: '2.7L EcoBoost 330hp',transmission:'Automático 10 vel',fuel_type:'Gasolina'}
  ],
  'Ranger': [
    { name: 'XL MT',    engine: '2.3L EcoBoost 270hp',transmission:'Manual 6 vel',  fuel_type:'Gasolina'  },
    { name: 'XLT AT',   engine: '2.3L EcoBoost 270hp',transmission:'Automático 10 vel',fuel_type:'Gasolina'},
    { name: 'Tremor',   engine: '2.3L EcoBoost 270hp',transmission:'Automático 10 vel',fuel_type:'Gasolina'}
  ],
  'Maverick': [
    { name: 'XL Hybrid',engine: '2.5L Híbrido 191hp',transmission: 'CVT',           fuel_type: 'Híbrido' },
    { name: 'XLT AT',   engine: '2.0L EcoBoost 250hp',transmission:'Automático',    fuel_type: 'Gasolina' },
    { name: 'Lariat AT',engine: '2.0L EcoBoost 250hp',transmission:'Automático',    fuel_type: 'Gasolina' }
  ],

  // Mazda
  'Mazda2': [
    { name: 'i Sport MT',  engine: '1.5L 4-cil 114hp', transmission: 'Manual 6 vel',   fuel_type: 'Gasolina' },
    { name: 'i Sport AT',  engine: '1.5L 4-cil 114hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'i Grand Touring',engine:'1.5L 4-cil 114hp',transmission:'Automático 6 vel',fuel_type:'Gasolina'}
  ],
  'Mazda3': [
    { name: 'i Sport MT',  engine: '2.0L 4-cil 155hp', transmission: 'Manual 6 vel',   fuel_type: 'Gasolina' },
    { name: 'i Sport AT',  engine: '2.0L 4-cil 155hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'i Grand Touring',engine:'2.5L 4-cil 191hp',transmission:'Automático 6 vel',fuel_type:'Gasolina'}
  ],
  'CX-30': [
    { name: 'i Sport AT',  engine: '2.0L 4-cil 155hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'i Grand Touring',engine:'2.0L 4-cil 155hp',transmission:'Automático 6 vel',fuel_type:'Gasolina'},
    { name: 's Grand Touring',engine:'2.5L Turbo 227hp',transmission:'Automático 6 vel',fuel_type:'Gasolina'}
  ],
  'CX-5': [
    { name: 'i Sport AT',  engine: '2.0L 4-cil 155hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'i Grand Touring',engine:'2.5L 4-cil 187hp',transmission:'Automático 6 vel',fuel_type:'Gasolina'},
    { name: 's Grand Touring',engine:'2.5L Turbo 227hp',transmission:'Automático 6 vel',fuel_type:'Gasolina'}
  ],
  'Mazda6': [
    { name: 'i Sport AT',  engine: '2.5L 4-cil 187hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'i Grand Touring',engine:'2.5L 4-cil 187hp',transmission:'Automático 6 vel',fuel_type:'Gasolina'},
    { name: 's Grand Touring',engine:'2.5L Turbo 227hp',transmission:'Automático 6 vel',fuel_type:'Gasolina'}
  ],
  'CX-9': [
    { name: 'i Sport AT',  engine: '2.5L Turbo 227hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'i Touring AT',engine: '2.5L Turbo 227hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 's Grand Touring',engine:'2.5L Turbo 250hp',transmission:'Automático 6 vel',fuel_type:'Gasolina'}
  ],

  // Hyundai
  'Grand i10': [
    { name: 'GL MT',    engine: '1.2L 4-cil 87hp',  transmission: 'Manual 5 vel',  fuel_type: 'Gasolina' },
    { name: 'GL AT',    engine: '1.2L 4-cil 87hp',  transmission: 'Automático',    fuel_type: 'Gasolina' },
    { name: 'GLS AT',   engine: '1.2L 4-cil 87hp',  transmission: 'Automático',    fuel_type: 'Gasolina' }
  ],
  'Elantra': [
    { name: 'GLS AT',   engine: '2.0L 4-cil 152hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Limited',  engine: '1.6L Turbo 201hp', transmission: 'Automático 7 vel',fuel_type:'Gasolina' },
    { name: 'N Line',   engine: '1.6L Turbo 201hp', transmission: 'Automático 7 vel',fuel_type:'Gasolina' }
  ],
  'Creta': [
    { name: 'GLS AT',   engine: '1.6L 4-cil 123hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Limited',  engine: '1.6L 4-cil 123hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'GLS Premium',engine:'1.6L 4-cil 123hp',transmission:'Automático 6 vel', fuel_type:'Gasolina'}
  ],
  'Tucson': [
    { name: 'GLS AT',   engine: '2.0L 4-cil 155hp', transmission: 'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'Limited',  engine: '1.6L Turbo 178hp', transmission: 'Automático 7 vel',fuel_type:'Gasolina' },
    { name: 'GLS Premium',engine:'2.0L 4-cil 155hp',transmission:'Automático 6 vel', fuel_type:'Gasolina'}
  ],
  'Santa Fe': [
    { name: 'GLS AT',   engine: '2.0L Turbo 234hp', transmission: 'Automático 8 vel',fuel_type:'Gasolina' },
    { name: 'Limited',  engine: '2.0L Turbo 234hp', transmission: 'Automático 8 vel',fuel_type:'Gasolina' }
  ],

  // SEAT
  'Ibiza': [
    { name: 'Reference MT',engine:'1.0L Turbo 95hp', transmission:'Manual 5 vel',   fuel_type:'Gasolina'  },
    { name: 'Style AT',    engine:'1.0L Turbo 95hp', transmission:'Automático',     fuel_type:'Gasolina'  },
    { name: 'FR AT',       engine:'1.5L Turbo 150hp',transmission:'Automático 7 vel',fuel_type:'Gasolina' }
  ],
  'Leon': [
    { name: 'Style MT',    engine:'1.5L Turbo 150hp',transmission:'Manual 6 vel',   fuel_type:'Gasolina'  },
    { name: 'Style AT',    engine:'1.5L Turbo 150hp',transmission:'Automático 7 vel',fuel_type:'Gasolina' },
    { name: 'FR AT',       engine:'2.0L Turbo 190hp',transmission:'Automático 7 vel',fuel_type:'Gasolina' }
  ],
  'Ateca': [
    { name: 'Style AT',    engine:'1.4L Turbo 150hp',transmission:'Automático 6 vel',fuel_type:'Gasolina' },
    { name: 'FR AT',       engine:'2.0L Turbo 190hp',transmission:'Automático 7 vel',fuel_type:'Gasolina' },
    { name: 'Xcellence',   engine:'2.0L Turbo 190hp',transmission:'Automático 7 vel',fuel_type:'Gasolina' }
  ],
  'Tarraco': [
    { name: 'Style AT',    engine:'1.5L Turbo 150hp',transmission:'Automático 7 vel',fuel_type:'Gasolina' },
    { name: 'FR AT',       engine:'2.0L Turbo 190hp',transmission:'Automático 7 vel',fuel_type:'Gasolina' },
    { name: 'Xcellence',   engine:'2.0L Turbo 190hp',transmission:'Automático 7 vel',fuel_type:'Gasolina' }
  ]
};

// ─── MSRP lookup ─────────────────────────────────────────────────────────────

// Reference base prices (approx. 2022 model year, base trim)
const BASE_PRICES_2022 = {
  // Nissan
  'Versa': 245000, 'Kicks': 370000, 'Sentra': 350000, 'X-Trail': 520000,
  'NP300': 380000, 'Altima': 530000, 'Frontier': 480000, 'Pathfinder': 720000,
  // Chevrolet
  'Spark': 215000, 'Aveo': 265000, 'Cavalier': 320000, 'Tracker': 355000,
  'Trax': 390000, 'Equinox': 490000, 'Silverado': 790000, 'Blazer': 580000, 'Tahoe': 1050000,
  // Toyota
  'Yaris': 265000, 'Corolla': 410000, 'Camry': 590000, 'RAV4': 620000,
  'Hilux': 470000, 'Tacoma': 560000, 'Fortuner': 680000, 'Land Cruiser': 1500000,
  // Volkswagen
  'Vento': 295000, 'Jetta': 400000, 'Virtus': 340000, 'T-Cross': 410000,
  'Tiguan': 550000, 'Polo': 290000, 'Taos': 500000, 'Touareg': 1050000,
  // Kia
  'Rio': 265000, 'Forte': 355000, 'Sportage': 490000, 'Seltos': 410000,
  'Sorento': 610000, 'Picanto': 230000,
  // Honda
  'City': 285000, 'Civic': 450000, 'HR-V': 430000, 'CR-V': 580000,
  'Accord': 620000, 'Pilot': 710000,
  // Ford
  'F-150': 750000, 'EcoSport': 385000, 'Escape': 490000, 'Explorer': 790000,
  'Bronco': 750000, 'Ranger': 540000, 'Maverick': 440000,
  // Mazda
  'Mazda2': 270000, 'Mazda3': 405000, 'CX-30': 450000, 'CX-5': 530000,
  'Mazda6': 540000, 'CX-9': 730000,
  // Hyundai
  'Grand i10': 235000, 'Elantra': 380000, 'Creta': 385000,
  'Tucson': 490000, 'Santa Fe': 650000,
  // SEAT
  'Ibiza': 320000, 'Leon': 430000, 'Ateca': 500000, 'Tarraco': 640000
};

// Trim-level multipliers (relative to base trim of that model)
const TRIM_MULTIPLIERS = {
  // F-150 specific trims
  'Base TA':     { 'F-150': 1.00 },
  'XLT TA':      { 'F-150': 1.20 },
  'Limited TA':  { 'F-150': 1.87 },
  'Platinum TA': { 'F-150': 1.60 },
  'ST TA':       { 'F-150': 1.27 },
  // Tracker
  'LS CVT':      { 'Tracker': 1.00 },
  'LT CVT':      { 'Tracker': 1.11 },
  'RS CVT':      { 'Tracker': 1.22 },
  'Premier CVT': { 'Tracker': 1.34 }
};

// Generic trim-position multipliers for everything else
const GENERIC_POSITION_MULT = [1.00, 1.10, 1.22, 1.35];

function getMSRP(makeName, modelName, year, trimName, trimIndex = 0) {
  const base2022 = BASE_PRICES_2022[modelName] || 350000;
  const yearAdj  = (year - 2022) * Math.round(base2022 * 0.03); // ~3% per year
  const baseYear = base2022 + yearAdj;

  // Check for model-specific trim multiplier
  const modelSpecific = TRIM_MULTIPLIERS[trimName]?.[modelName];
  if (modelSpecific != null) {
    return Math.round(Math.max(150000, baseYear * modelSpecific));
  }

  // Fall back to generic position-based multiplier
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
    for (const [key, yearId] of Object.entries(yearIds)) {
      const parts     = key.split('/');
      const makeName  = parts[0];
      const modelName = parts[1];
      const year      = parseInt(parts[2]);

      const defaultTrims = [
        { name: 'Base',  engine: '1.6L 4-cil', transmission: 'Manual',     fuel_type: 'Gasolina' },
        { name: 'Mid',   engine: '1.6L 4-cil', transmission: 'Automático', fuel_type: 'Gasolina' },
        { name: 'Top',   engine: '2.0L 4-cil', transmission: 'Automático', fuel_type: 'Gasolina' }
      ];
      const trims = trimsByModel[modelName] || defaultTrims;

      // Delete trims not in the current list so stale entries from old seeds are removed
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
