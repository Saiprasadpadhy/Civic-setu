import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Department from '../src/models/Department.js';
import Ward from '../src/models/Ward.js';
import Grievance from '../src/models/Grievance.js';
import { hashPassword } from '../src/utils/bcrypt.js';
import { runIntelligencePipeline } from '../src/services/aiIntelligence.service.js';

dotenv.config();

const DEFAULT_PASSWORD = 'Test@123';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  // 1. Fetch reference departments
  const roadsDept = await Department.findOne({ code: 'ROADS' });
  const sanDept = await Department.findOne({ code: 'SANITATION' });
  const waterDept = await Department.findOne({ code: 'WATER' });
  const w1 = await Ward.findOne({ code: 'W-01' }) || await Ward.findOne();

  const officerConfigs = [
    {
      name: 'Roads & Streetlight Officer',
      email: 'officer.roads@test.com',
      role: 'officer',
      departmentId: roadsDept?._id,
      wardId: w1?._id,
    },
    {
      name: 'Sanitation & Drainage Officer',
      email: 'officer.sanitation@test.com',
      role: 'officer',
      departmentId: sanDept?._id,
      wardId: w1?._id,
    },
    {
      name: 'Water Supply Officer',
      email: 'officer.water@test.com',
      role: 'officer',
      departmentId: waterDept?._id,
      wardId: w1?._id,
    },
    {
      name: 'General Officer (Roads)',
      email: 'officer@test.com',
      role: 'officer',
      departmentId: roadsDept?._id,
      wardId: w1?._id,
    },
    {
      name: 'Municipal Admin Chief',
      email: 'admin@test.com',
      role: 'admin',
      wardId: w1?._id,
    },
    {
      name: 'Demo Citizen Aarav',
      email: 'citizen@test.com',
      role: 'citizen',
      wardId: w1?._id,
    },
  ];

  for (const u of officerConfigs) {
    await User.findOneAndUpdate(
      { email: u.email },
      {
        $set: {
          name: u.name,
          email: u.email,
          passwordHash: passwordHash,
          role: u.role,
          departmentId: u.departmentId || null,
          wardId: u.wardId || null,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`User ready: ${u.email} (${u.role}${u.departmentId ? ' - ' + u.name : ''})`);
  }

  // 2. Reprocess any failed or pending AI grievances using Mock Mode
  const pendingGrievances = await Grievance.find({ aiStatus: { $in: ['failed', 'pending', 'processing'] } });
  console.log(`Found ${pendingGrievances.length} grievances with pending/failed AI status. Reprocessing...`);

  for (const g of pendingGrievances) {
    try {
      await runIntelligencePipeline(g);
      console.log(`Reprocessed AI for grievance: ${g.ticketId} -> ${g.category} (AI Status: ${g.aiStatus})`);
    } catch (err) {
      console.error(`Error reprocessing grievance ${g.ticketId}:`, err.message);
    }
  }

  await mongoose.disconnect();
  console.log('Seeding and AI reprocessing complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
