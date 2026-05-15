import mongoose from 'mongoose';
import { env } from './env.config';
import { logger } from '../common/utils/logger';

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;

export const connectDatabase = async (): Promise<void> => {
  let retries = 0;

  const connect = async () => {
    try {
      await mongoose.connect(env.MONGO_URI);
      logger.info('✅ Successfully connected to MongoDB');
    } catch (error: any) {
      logger.error(`❌ Failed to connect to MongoDB: ${error.message}`);
      retries += 1;
      if (retries <= MAX_RETRIES) {
        logger.info(`⏳ Retrying connection in ${RETRY_INTERVAL / 1000}s... (Attempt ${retries}/${MAX_RETRIES})`);
        setTimeout(connect, RETRY_INTERVAL);
      } else {
        logger.error('❌ MongoDB connection failed after maximum retries. Exiting.');
        process.exit(1);
      }
    }
  };

  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ MongoDB disconnected!');
  });

  await connect();
};
