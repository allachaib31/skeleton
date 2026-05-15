import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { env } from './config/env.config';
import { connectDatabase } from './config/database.config';
import { redis } from './config/redis.config';
import mongoose from 'mongoose';

import { initQueues } from './queues';

import { initSocket } from './sockets/socket.server';
import { logger } from './common/utils/logger';
import { seedRolesAndPermissions } from './database/seeders/roles.seeder';

// Initialize workers
initQueues().catch(err => logger.error('Worker Init Error', err));

const server = createServer(app);

// Initialize Socket.io
initSocket(server);

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    await seedRolesAndPermissions();
    
    // Ensure Redis is active
    if (redis.status !== 'ready') {
      logger.info('⏳ Waiting for Redis connection...');
    }

    server.listen(env.PORT, () => {
      logger.info(`🚀 Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.info('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('👋 Signal received. Shutting down gracefully...');
  server.close(async () => {
    logger.info('🛑 HTTP server closed.');
    try {
      await mongoose.disconnect();
      logger.info('📴 MongoDB disconnected.');
      
      redis.disconnect();
      logger.info('📴 Redis disconnected.');
      
      process.exit(0);
    } catch (err) {
      logger.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('⚠️ Force closing server after 10s timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
