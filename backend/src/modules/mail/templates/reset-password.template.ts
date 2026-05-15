import { escapeHtmlAttribute } from '../../../common/utils/html';
import { mailText, mailWrapper } from './template.utils';

export const resetPasswordTemplate = (data: { name: string, token: string }, lang: string) => {
  const clientUrl = process.env.CLIENT_URL || process.env.CLIENT_URLS?.split(',')[0] || 'http://localhost:3000';
  const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(data.token)}`;
  return mailWrapper(lang, `
    <h2>${mailText(lang, 'mail.greeting', { name: data.name })}</h2>
    <p>${mailText(lang, 'mail.resetPassword.body')}</p>
    <a href="${escapeHtmlAttribute(resetUrl)}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none;">${mailText(lang, 'mail.resetPassword.button')}</a>
  `);
};
