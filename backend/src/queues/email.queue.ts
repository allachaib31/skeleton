import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env.config';
import { MailService } from '../modules/mail/mail.service';
import { translate } from '../config/i18n.config';

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
};

const isTest = env.NODE_ENV === 'test';

export const emailQueue = isTest
  ? ({ add: async () => undefined } as unknown as Queue)
  : new Queue('email-queue', { connection });

export const addEmailJob = async (type: string, payload: any, opts: any = {}) => {
  await emailQueue.add(type, payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    ...opts,
  });
};

export const emailWorker = isTest ? ({ on: () => undefined } as unknown as Worker) : new Worker('email-queue', async (job: Job) => {
  const { email, lang, ...data } = job.data;
  const language = lang || 'en';
  const subjectKeys: Record<string, string> = {
    welcome: 'mail.subjects.welcome',
    'verify-email': 'mail.subjects.verify_email',
    'send-verification-email': 'mail.subjects.verify_email',
    'reset-password': 'mail.subjects.reset_password',
    'send-password-reset': 'mail.subjects.reset_password',
    'password-changed': 'mail.subjects.password_changed',
    'login-new-device': 'mail.subjects.login_new_device',
    'account-locked': 'mail.subjects.account_locked',
    'admin-invitation': 'mail.subjects.admin_invitation',
    'security-alert': 'mail.subjects.security_alert',
  };
  const subject = translate(subjectKeys[job.name] || 'mail.subjects.notification', language);

  const html = MailService.getTemplate(job.name, data, language);

  await MailService.sendMail({
    to: email,
    subject,
    html,
  });
}, { connection });

if (!isTest) {
  emailWorker.on('failed', (job, err) => {
    console.error(`Email Job ${job?.id} failed:`, err.message);
  });
}
