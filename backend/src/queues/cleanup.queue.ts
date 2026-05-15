import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env.config';
import { RefreshToken } from '../modules/auth/refresh-token.model';
import { User } from '../modules/users/user.model';
import { cloudinary } from '../config/cloudinary.config';
import { AuditLog } from '../modules/audit/audit-log.model';
import { addEmailJob } from './email.queue';

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
};

const isTest = env.NODE_ENV === 'test';

export const cleanupQueue = isTest
  ? ({ add: async () => undefined } as unknown as Queue)
  : new Queue('cleanup-queue', { connection });

export const cleanupWorker = isTest ? ({ on: () => undefined } as unknown as Worker) : new Worker('cleanup-queue', async (job: Job) => {
  switch (job.name) {
    case 'cleanup-expired-tokens':
      await RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
      break;
    
    case 'cleanup-unverified-users':
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await User.deleteMany({ isEmailVerified: false, createdAt: { $lt: yesterday } });
      break;

    case 'delete-cloudinary-file':
      const { url, publicId } = job.data;
      let pid = publicId;
      if (!pid && url) {
        const parts = url.split('/');
        const file = parts[parts.length - 1];
        const folder = parts[parts.length - 2];
        pid = `${folder}/${file.split('.')[0]}`;
      }
      if (pid) {
        await cloudinary.uploader.destroy(pid);
      }
      break;

    case 'generate-report':
      console.log('Generating report...');
      break;

    case 'security-alert':
      console.warn('SECURITY ALERT:', job.data);
      await AuditLog.create({
        action: 'SECURITY_ALERT',
        entity: 'System',
        after: job.data
      });
      await addEmailJob('security-alert', { 
        email: process.env.ADMIN_EMAIL || 'admin@admin.com', 
        name: 'Admin', 
        alertType: job.data.type, 
        details: job.data.details 
      });
      break;
  }
}, { connection });

if (!isTest) {
  cleanupWorker.on('failed', (job, err) => {
    console.error(`Cleanup Job ${job?.name} failed:`, err.message);
  });
}

export const scheduleRecurringJobs = async () => {
  if (isTest) return;

  await cleanupQueue.add('cleanup-expired-tokens', {}, {
    repeat: { pattern: '0 0 * * *' } 
  });

  await cleanupQueue.add('cleanup-unverified-users', {}, {
    repeat: { pattern: '0 1 * * *' } 
  });
};
