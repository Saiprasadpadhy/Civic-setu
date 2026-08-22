import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function clearComplaints() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Grievance = mongoose.model('Grievance', new mongoose.Schema({}, { strict: false }));
  const History = mongoose.model('GrievanceStatusHistory', new mongoose.Schema({}, { strict: false }));
  const Evidence = mongoose.model('ResolutionEvidence', new mongoose.Schema({}, { strict: false }));
  const Vote = mongoose.model('GrievanceVote', new mongoose.Schema({}, { strict: false }));
  const AiLog = mongoose.model('AiInferenceLog', new mongoose.Schema({}, { strict: false }));

  // Find user or delete all complaints
  const deletedGrievances = await Grievance.deleteMany({});
  const deletedHistory = await History.deleteMany({});
  const deletedEvidence = await Evidence.deleteMany({});
  const deletedVotes = await Vote.deleteMany({});
  const deletedAiLogs = await AiLog.deleteMany({});

  console.log(`Cleared ${deletedGrievances.deletedCount} grievances.`);
  console.log(`Cleared ${deletedHistory.deletedCount} history records.`);
  console.log(`Cleared ${deletedEvidence.deletedCount} evidence records.`);
  console.log(`Cleared ${deletedVotes.deletedCount} vote records.`);
  console.log(`Cleared ${deletedAiLogs.deletedCount} AI inference logs.`);

  await mongoose.disconnect();
  console.log('Done!');
}

clearComplaints().catch(console.error);
