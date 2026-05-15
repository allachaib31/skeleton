import nodemailer from 'nodemailer';
import { translate } from '../../config/i18n.config';
import { welcomeTemplate } from './templates/welcome.template';
import { verifyEmailTemplate } from './templates/verify-email.template';
import { resetPasswordTemplate } from './templates/reset-password.template';
import { passwordChangedTemplate } from './templates/password-changed.template';
import { loginNewDeviceTemplate } from './templates/login-new-device.template';
import { accountLockedTemplate } from './templates/account-locked.template';
import { securityAlertTemplate } from './templates/security-alert.template';
import { adminInvitationTemplate } from './templates/admin-invitation.template';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class MailService {
  static getTemplate(type: string, data: any, lang: string = 'en'): string {
    switch (type) {
      case 'welcome': return welcomeTemplate(data, lang);
      case 'verify-email': 
      case 'send-verification-email': return verifyEmailTemplate(data, lang);
      case 'reset-password': 
      case 'send-password-reset': return resetPasswordTemplate(data, lang);
      case 'password-changed': return passwordChangedTemplate(data, lang);
      case 'login-new-device': return loginNewDeviceTemplate(data, lang);
      case 'account-locked': return accountLockedTemplate(data, lang);
      case 'security-alert': return securityAlertTemplate(data, lang);
      case 'admin-invitation': return adminInvitationTemplate(data, lang);
      default: return `<p>${translate('mail.subjects.notification', lang)}</p>`;
    }
  }

  static async sendMail({ to, subject, html }: { to: string, subject: string, html: string }) {
    if (!process.env.SMTP_USER) {
      console.log('Mail payload (SMTP not configured):', { to, subject });
      return;
    }
    
    return await transporter.sendMail({
      from: process.env.MAIL_FROM || '"App Support" <no-reply@example.com>',
      to,
      subject,
      html,
    });
  }
}
