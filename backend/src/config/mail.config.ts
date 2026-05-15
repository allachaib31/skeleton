import nodemailer from 'nodemailer';
import { env } from './env.config';

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendMail = async (options: SendMailOptions, retries = 3): Promise<void> => {
  try {
    await transporter.sendMail({
      from: env.MAIL_FROM,
      ...options,
    });
    console.log(`✅ Email sent to ${options.to}`);
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`⚠️ Failed to send email to ${options.to}. Retrying... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return sendMail(options, retries - 1);
    }
    console.error(`❌ Failed to send email after retries: ${error.message}`);
    throw error;
  }
};
