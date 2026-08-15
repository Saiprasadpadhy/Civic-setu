import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Grievance from '../src/models/Grievance.js';
import User from '../src/models/User.js';

dotenv.config();

async function reassign() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);

  const roadsOfficer = await User.findOne({ email: 'officer.roads@test.com' });
  const sanOfficer = await User.findOne({ email: 'officer.sanitation@test.com' });
  const waterOfficer = await User.findOne({ email: 'officer.water@test.com' });

  if (roadsOfficer) {
    const res = await Grievance.updateMany(
      { category: { $in: ['pothole', 'roads', 'streetlight'] } },
      { $set: { assignedOfficerId: roadsOfficer._id, status: 'assigned' } }
    );
    console.log(`Reassigned ${res.modifiedCount} road/pothole grievances to officer.roads@test.com`);
  }

  if (sanOfficer) {
    const res = await Grievance.updateMany(
      { category: { $in: ['garbage', 'drainage', 'sanitation'] } },
      { $set: { assignedOfficerId: sanOfficer._id, status: 'assigned' } }
    );
    console.log(`Reassigned ${res.modifiedCount} sanitation grievances to officer.sanitation@test.com`);
  }

  if (waterOfficer) {
    const res = await Grievance.updateMany(
      { category: { $in: ['water', 'pipeline', 'leakage'] } },
      { $set: { assignedOfficerId: waterOfficer._id, status: 'assigned' } }
    );
    console.log(`Reassigned ${res.modifiedCount} water grievances to officer.water@test.com`);
  }

  await mongoose.disconnect();
  console.log('Reassignment finished!');
}

reassign().catch(console.error);
