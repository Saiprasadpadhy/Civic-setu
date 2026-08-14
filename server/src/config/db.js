import mongoose from 'mongoose';
import { env } from './env.js';
import '../models/index.js';

const connectionOptions = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
};

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(env.mongodbUri, connectionOptions);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('\nMongoDB connection failed.');
    console.error('Check: 1) MONGODB_URI in server/.env  2) Atlas Network Access (IP whitelist)  3) Internet connection');
    console.error(`Details: ${error.message}\n`);
    throw error;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}
