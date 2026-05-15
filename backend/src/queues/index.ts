import { emailQueue, emailWorker } from './email.queue';
import { cleanupQueue, cleanupWorker, scheduleRecurringJobs } from './cleanup.queue';

export const queues = {
  emailQueue,
  cleanupQueue
};

export const workers = {
  emailWorker,
  cleanupWorker
};

export const initQueues = async () => {
  await scheduleRecurringJobs();
  console.log('✅ Queues & Workers initialized');
};
