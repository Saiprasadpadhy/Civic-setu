import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';

let server;

async function start() {
  await connectDB();

  server = app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${env.port} is already in use. Stop the other server process or set a different PORT in .env`
      );
    } else {
      console.error('Server error:', err.message);
    }
    process.exit(1);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  await disconnectDB();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
