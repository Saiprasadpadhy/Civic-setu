/**
 * Seed comprehensive reference data & public works projects for Bhubaneswar wards.
 * Run: node scripts/seed-reference-data.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Department from '../src/models/Department.js';
import Ward from '../src/models/Ward.js';
import User from '../src/models/User.js';
import BudgetProject from '../src/models/BudgetProject.js';

dotenv.config();

const departments = [
  {
    code: 'SANITATION',
    name: 'Sanitation Department',
    categories: ['garbage', 'drainage', 'sanitation', 'waste'],
    defaultSlaHours: 72,
    contactEmail: 'sanitation@civicsetu.test',
  },
  {
    code: 'WATER',
    name: 'Water Supply Department',
    categories: ['water', 'pipeline', 'leakage', 'contamination'],
    defaultSlaHours: 48,
    contactEmail: 'water@civicsetu.test',
  },
  {
    code: 'ROADS',
    name: 'Roads Department',
    categories: ['roads', 'pothole', 'streetlight', 'footpath', 'traffic'],
    defaultSlaHours: 96,
    contactEmail: 'roads@civicsetu.test',
  },
];

const wards = [
  {
    code: 'W-01',
    name: 'Ward 1 - Saheed Nagar (BMC Central)',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8428, 20.2882] },
    population: 28500,
  },
  {
    code: 'W-02',
    name: 'Ward 2 - Nayapalli & IRC Village',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8078, 20.3021] },
    population: 32000,
  },
  {
    code: 'W-03',
    name: 'Ward 3 - Patia Tech Corridor (KIIT/Infocity)',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8178, 20.3541] },
    population: 38000,
  },
  {
    code: 'W-04',
    name: 'Ward 4 - Khandagiri & Udayagiri Heritage',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.7865, 20.2589] },
    population: 26000,
  },
  {
    code: 'W-05',
    name: 'Ward 5 - Chandrasekharpur & Damana',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8194, 20.3278] },
    population: 35000,
  },
  {
    code: 'W-06',
    name: 'Ward 6 - Old Town (Lingaraj Heritage Circuit)',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8344, 20.2394] },
    population: 31000,
  },
  {
    code: 'W-07',
    name: 'Ward 7 - Jaydev Vihar & Ekamra Kanan',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8198, 20.2985] },
    population: 29500,
  },
  {
    code: 'W-08',
    name: 'Ward 8 - Rasulgarh & Cuttack Road Hub',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8645, 20.2891] },
    population: 34000,
  },
  {
    code: 'W-09',
    name: 'Ward 9 - Master Canteen & Bapuji Nagar',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8398, 20.2662] },
    population: 27000,
  },
  {
    code: 'W-10',
    name: 'Ward 10 - Kalinga Nagar & Ghatikia Smart Enclave',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.7621, 20.2745] },
    population: 24000,
  },
];

async function upsertDepartments() {
  for (const department of departments) {
    await Department.findOneAndUpdate({ code: department.code }, department, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    console.log(`✓ Department ready: ${department.code}`);
  }
}

async function upsertWards() {
  for (const ward of wards) {
    await Ward.findOneAndUpdate(
      { code: ward.code },
      { $set: ward, $unset: { boundary: '' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✓ Ward ready: ${ward.code} - ${ward.name}`);
  }
}

async function seedBudgetProjects() {
  const admin = (await User.findOne({ role: 'admin' })) || (await User.findOne());
  if (!admin) {
    console.log('No admin user found, skipping budget projects.');
    return;
  }

  const wardMap = {};
  const allWards = await Ward.find({});
  for (const w of allWards) {
    wardMap[w.code] = w._id;
  }

  const roads = await Department.findOne({ code: 'ROADS' });
  const water = await Department.findOne({ code: 'WATER' });
  const sanit = await Department.findOne({ code: 'SANITATION' });

  const now = Date.now();
  const votingStarts = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const votingEnds = new Date(now + 30 * 24 * 60 * 60 * 1000);

  const sampleProjects = [
    // Ward 1 (Saheed Nagar)
    {
      title: 'Solar Smart Streetlights Corridor on Maharshi College Road',
      description: 'Install 120 energy-efficient solar LED streetlights with motion sensors and emergency call buttons along the main avenue to enhance pedestrian safety.',
      wardId: wardMap['W-01'],
      departmentId: roads?._id,
      category: 'infrastructure',
      estimatedCost: 850000,
      voteCount: 42,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
    {
      title: 'Saheed Nagar Commercial Market Underground Drainage Upgrade',
      description: 'Replace aging concrete drain channels with high-flow HDPE underground conduits to prevent monsoon water accumulation around market square.',
      wardId: wardMap['W-01'],
      departmentId: sanit?._id,
      category: 'sanitation',
      estimatedCost: 1400000,
      voteCount: 29,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },

    // Ward 2 (Nayapalli)
    {
      title: 'Nayapalli Rainwater Harvesting & Groundwater Recharge Well',
      description: 'Construction of a centralized high-capacity stormwater recharge facility and community drinking water kiosk to address summer shortages.',
      wardId: wardMap['W-02'],
      departmentId: water?._id,
      category: 'water',
      estimatedCost: 1200000,
      voteCount: 68,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
    {
      title: 'IRC Village High-School Crossway Pedestrian Footbridge',
      description: 'Build an elevated pedestrian walkway with ramps and anti-skid surfaces to protect students crossing the busy thoroughfare.',
      wardId: wardMap['W-02'],
      departmentId: roads?._id,
      category: 'infrastructure',
      estimatedCost: 720000,
      voteCount: 54,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },

    // Ward 3 (Patia)
    {
      title: 'Patia Automated Solid Waste Compactor & Decentralized Recycling Hub',
      description: 'Ward-level organic waste composting and decentralized recycling drop-off hub with IoT fullness sensors to eliminate open dumps.',
      wardId: wardMap['W-03'],
      departmentId: sanit?._id,
      category: 'sanitation',
      estimatedCost: 950000,
      voteCount: 76,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
    {
      title: 'Infocity Smart Water Supply Pressure Booster Station',
      description: 'Install intelligent automated pressure booster pumps to ensure 24x7 uniform potable water delivery to high-density tech residential towers.',
      wardId: wardMap['W-03'],
      departmentId: water?._id,
      category: 'water',
      estimatedCost: 1650000,
      voteCount: 61,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },

    // Ward 4 (Khandagiri)
    {
      title: 'Khandagiri Heritage Corridor Tourist Walkway & Illumination',
      description: 'Develop dedicated cobblestone tourist pavements, heritage informational kiosks, and warm LED pathway lighting around ancient rock-cut monuments.',
      wardId: wardMap['W-04'],
      departmentId: roads?._id,
      category: 'infrastructure',
      estimatedCost: 1100000,
      voteCount: 83,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
    {
      title: 'Eco-Friendly Bio-Digester Public Sanitation Facility',
      description: 'Modern 10-seater accessible public restroom complex with zero-discharge biological waste digestion system near Khandagiri foothill plaza.',
      wardId: wardMap['W-04'],
      departmentId: sanit?._id,
      category: 'sanitation',
      estimatedCost: 800000,
      voteCount: 47,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },

    // Ward 5 (Chandrasekharpur)
    {
      title: 'Damana Stormwater Canal Desilting & Reinforced Wall Embankment',
      description: 'Deepen and concrete-line 1.2km of secondary canal to permanently resolve waterlogging during heavy cyclonic downpours.',
      wardId: wardMap['W-05'],
      departmentId: sanit?._id,
      category: 'sanitation',
      estimatedCost: 1350000,
      voteCount: 39,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
    {
      title: 'District Center Community RO Water ATM Installation',
      description: 'Setup subsidized smart-card operated automated water dispensing kiosk providing 20L purified drinking water per family daily.',
      wardId: wardMap['W-05'],
      departmentId: water?._id,
      category: 'water',
      estimatedCost: 680000,
      voteCount: 58,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },

    // Ward 6 (Old Town)
    {
      title: 'Bindu Sagar Heritage Lake Rejuvenation & Aeration Floating Fountains',
      description: 'Install solar-powered floating oxygenators and sub-surface filtration to maintain sacred lake water quality and prevent algae accumulation.',
      wardId: wardMap['W-06'],
      departmentId: water?._id,
      category: 'water',
      estimatedCost: 1900000,
      voteCount: 94,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
    {
      title: 'Lingaraj Heritage Temple Circuit Cobblestone Pathway & Cable Undergrounding',
      description: 'Pave main pilgrimage route with heritage-grade red sandstone cobblestones and move dangling utility cables into underground ducts.',
      wardId: wardMap['W-06'],
      departmentId: roads?._id,
      category: 'infrastructure',
      estimatedCost: 980000,
      voteCount: 71,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },

    // Ward 7 (Jaydev Vihar)
    {
      title: 'Ekamra Kanan Perimeter Green Jogging Track & Solar Poles',
      description: 'Create a 1.8km rubberized synthetic jogging circuit with native plant shading and dusk-to-dawn intelligent solar luminaires.',
      wardId: wardMap['W-07'],
      departmentId: roads?._id,
      category: 'infrastructure',
      estimatedCost: 1050000,
      voteCount: 64,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
    {
      title: 'Jaydev Vihar High-Drain Automated Trash Bar Screens',
      description: 'Install solar motorized mechanical rakes at main culvert intakes to trap floating plastic waste before it reaches natural wetlands.',
      wardId: wardMap['W-07'],
      departmentId: sanit?._id,
      category: 'sanitation',
      estimatedCost: 780000,
      voteCount: 49,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },

    // Ward 8 (Rasulgarh)
    {
      title: 'Rasulgarh Junction Multi-Directional High-Mast LED Lighting',
      description: 'Erect three 30-meter high-mast lighting towers at busy NH bypass cloverleaf to eliminate night collision blackspots.',
      wardId: wardMap['W-08'],
      departmentId: roads?._id,
      category: 'infrastructure',
      estimatedCost: 890000,
      voteCount: 52,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
    {
      title: 'Rasulgarh Mixed Residential-Commercial Water Pipeline Replacement',
      description: 'Replace vintage cast-iron pipes with ductile iron class K9 piping to stop recurring leakage and water contamination.',
      wardId: wardMap['W-08'],
      departmentId: water?._id,
      category: 'water',
      estimatedCost: 1520000,
      voteCount: 36,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },

    // Ward 9 (Master Canteen)
    {
      title: 'Smart Hydraulic Underground Waste Bins at Station Square',
      description: 'Install sensor-equipped hydraulic underground compactor bins that prevent open odor and automatically alert collection vans when 80% full.',
      wardId: wardMap['W-09'],
      departmentId: sanit?._id,
      category: 'sanitation',
      estimatedCost: 1180000,
      voteCount: 77,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
    {
      title: 'Bapuji Nagar Commercial Avenue Asphalting & Tactile Pedestrian Pavers',
      description: 'Heavy-duty micro-surfacing of the main shopping lane along with tactile hazard warning paving for visually impaired citizens.',
      wardId: wardMap['W-09'],
      departmentId: roads?._id,
      category: 'infrastructure',
      estimatedCost: 1020000,
      voteCount: 62,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },

    // Ward 10 (Kalinga Nagar)
    {
      title: 'Kalinga Nagar Elevated Overhead Water Reservoir & Pumping Sump',
      description: 'Construct 5-lakh-liter capacity RCC elevated service reservoir to guarantee pressurized clean water supply to newly developed residential plots.',
      wardId: wardMap['W-10'],
      departmentId: water?._id,
      category: 'water',
      estimatedCost: 1800000,
      voteCount: 45,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
    {
      title: 'Ghatikia Smart Streetlight Expansion & Dark Spot Elimination',
      description: 'Install 80 new centralized control and monitoring (CCMS) LED street poles in developing sector lanes.',
      wardId: wardMap['W-10'],
      departmentId: roads?._id,
      category: 'infrastructure',
      estimatedCost: 750000,
      voteCount: 38,
      createdById: admin._id,
      status: 'voting_open',
      votingStartsAt: votingStarts,
      votingEndsAt: votingEnds,
    },
  ];

  for (const proj of sampleProjects) {
    if (proj.wardId) {
      await BudgetProject.findOneAndUpdate({ title: proj.title }, proj, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
      console.log(`✓ Budget Project ready: ${proj.title}`);
    }
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  await upsertDepartments();
  await upsertWards();
  await seedBudgetProjects();
  await mongoose.disconnect();
  console.log('🎉 Bhubaneswar Wards & Public Works reference data successfully seeded!');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
