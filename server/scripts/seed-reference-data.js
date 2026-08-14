/**
 * Seed reference data for CivicSetu Phase 4 testing.
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
    categories: ['garbage', 'drainage', 'sanitation'],
    defaultSlaHours: 72,
    contactEmail: 'sanitation@civicsetu.test',
  },
  {
    code: 'WATER',
    name: 'Water Supply Department',
    categories: ['water', 'pipeline', 'leakage'],
    defaultSlaHours: 48,
    contactEmail: 'water@civicsetu.test',
  },
  {
    code: 'ROADS',
    name: 'Roads Department',
    categories: ['roads', 'pothole', 'streetlight'],
    defaultSlaHours: 96,
    contactEmail: 'roads@civicsetu.test',
  },
];

const wards = [
  {
    code: 'W-01',
    name: 'Ward 1 - Saheed Nagar',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8245, 20.2961] },
    population: 25000,
  },
  {
    code: 'W-02',
    name: 'Ward 2 - Nayapalli',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8345, 20.3061] },
    population: 22000,
  },
  {
    code: 'W-03',
    name: 'Ward 3 - Patia Tech Zone',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8445, 20.3161] },
    population: 21000,
  },
];

async function upsertDepartments() {
  for (const department of departments) {
    await Department.findOneAndUpdate({ code: department.code }, department, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    console.log(`Department ready: ${department.code}`);
  }
}

async function upsertWards() {
  for (const ward of wards) {
    await Ward.findOneAndUpdate(
      { code: ward.code },
      { $set: ward, $unset: { boundary: '' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Ward ready: ${ward.code}`);
  }
}

async function seedBudgetProjects() {
  const admin = await User.findOne({ role: 'admin' }) || await User.findOne();
  if (!admin) return;

  const w1 = await Ward.findOne({ code: 'W-01' });
  const w2 = await Ward.findOne({ code: 'W-02' });
  const w3 = await Ward.findOne({ code: 'W-03' });
  const roads = await Department.findOne({ code: 'ROADS' });
  const water = await Department.findOne({ code: 'WATER' });
  const sanit = await Department.findOne({ code: 'SANITATION' });

  const sampleProjects = [
    {
      title: 'Solar Smart Streetlights Corridor',
      description: 'Install 120 energy-efficient solar LED streetlights with motion sensors along main college avenue to enhance pedestrian safety at night.',
      wardId: w1?._id,
      departmentId: roads?._id,
      category: 'infrastructure',
      estimatedCost: 850000,
      voteCount: 42,
      createdById: admin._id,
      status: 'active',
      isPublished: true,
      votingStartsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      votingEndsAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Community Rainwater Harvesting & Filtration Tank',
      description: 'Construction of a centralized high-capacity stormwater recharge facility and potable water kiosk to prevent waterlogging and address summer shortages.',
      wardId: w2?._id,
      departmentId: water?._id,
      category: 'water',
      estimatedCost: 1200000,
      voteCount: 68,
      createdById: admin._id,
      status: 'active',
      isPublished: true,
      votingStartsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      votingEndsAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Automated Segregated Solid Waste Processing Center',
      description: 'Ward-level organic waste composting and decentralized recycling drop-off hub to eliminate neighborhood open dumping.',
      wardId: w3?._id,
      departmentId: sanit?._id,
      category: 'sanitation',
      estimatedCost: 950000,
      voteCount: 31,
      createdById: admin._id,
      status: 'active',
      isPublished: true,
      votingStartsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      votingEndsAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const proj of sampleProjects) {
    if (proj.wardId) {
      await BudgetProject.findOneAndUpdate(
        { title: proj.title },
        proj,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Budget Project ready: ${proj.title}`);
    }
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  await upsertDepartments();
  await upsertWards();
  await seedBudgetProjects();
  await mongoose.disconnect();
  console.log('Reference and budget data seeding complete.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
