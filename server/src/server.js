import http from 'node:http';

import { env } from './config/env.js';
import { prisma } from './db/prisma.js';
import { createApp } from './app.js';
import { createSocketServer } from './sockets/index.js';

const app = createApp();
const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  io.close();
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

httpServer.listen(env.PORT, () => {
  console.log(`API server listening on ${env.SERVER_URL}`);
});
