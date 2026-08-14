/**
 * One-time seed for officer/admin auth testing.
 * Run: node scripts/seed-test-users.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Department from '../src/models/Department.js';
import { hashPassword } from '../src/utils/bcrypt.js';

dotenv.config();

const TEST_PASSWORD = 'Test@123';

async function upsertDepartment() {
  let department = await Department.findOne({ code: 'SANITATION' });
  if (!department) {
    department = await Department.create({
      code: 'SANITATION',
      name: 'Sanitation Department',
      categories: ['garbage', 'drainage'],
      defaultSlaHours: 72,
      contactEmail: 'sanitation@civicsetu.test',
    });
    console.log('Created department:', department.code);
  }
  return department;
}

async function upsertUser({ name, email, role, departmentId = null }) {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`User already exists: ${email} (${existing.role})`);
    return existing;
  }

  const passwordHash = await hashPassword(TEST_PASSWORD);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    departmentId,
  });
  console.log(`Created ${role}: ${email}`);
  return user;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const department = await upsertDepartment();

  await upsertUser({
    name: 'Test Officer',
    email: 'officer@test.com',
    role: 'officer',
    departmentId: department._id,
  });

  await upsertUser({
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin',
  });

  await mongoose.disconnect();
  console.log('Test users ready.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
