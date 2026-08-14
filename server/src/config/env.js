import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const aiMockMode =
  process.env.AI_MOCK_MODE === 'true' ||
  process.env.GEMINI_API_KEY === 'mock' ||
  process.env.NODE_ENV === 'test' ||
  (!process.env.GEMINI_API_KEY && process.env.NODE_ENV !== 'production');

export const env = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    mockMode: aiMockMode,
  },
};

export const isDev = env.nodeEnv === 'development';
