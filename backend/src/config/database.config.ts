import mongoose from 'mongoose';
import { env } from './env.config';
import { logger } from '../common/utils/logger';

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;

export const connectDatabase = async (): Promise<void> => {
  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ MongoDB disconnected!');
  });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(env.MONGO_URI);
      logger.info('✅ Successfully connected to MongoDB');
      return;
    } catch (error) {
      logger.error(`❌ Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);

      if (attempt >= MAX_RETRIES) {
        break;
      }

      logger.info(`⏳ Retrying connection in ${RETRY_INTERVAL / 1000}s... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }
  }

  logger.error('❌ MongoDB connection failed after maximum retries. Exiting.');
  process.exit(1);
};
