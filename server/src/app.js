import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isDev } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sanitizeInputs } from './middleware/sanitize.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isDev) return callback(null, true);
      const allowedOrigins = env.corsOrigin.split(',').map((o) => o.trim());
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInputs);

if (isDev) {
  app.use(morgan('dev'));
}

app.get('/', (_req, res) => {
  res.json({
    name: 'CivicSetu API',
    status: 'running',
    health: '/api/health',
    docs: 'See README.md for API routes',
  });
});

app.use('/api', apiLimiter.middleware(), apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
