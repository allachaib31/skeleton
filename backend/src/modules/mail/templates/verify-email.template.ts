import { escapeHtmlAttribute } from '../../../common/utils/html';
import { mailText, mailWrapper } from './template.utils';

export const verifyEmailTemplate = (data: { name: string, token: string }, lang: string) => {
  const clientUrl = process.env.CLIENT_URL || process.env.CLIENT_URLS?.split(',')[0] || 'http://localhost:3000';
  const verifyUrl = `${clientUrl}/verify-email?token=${encodeURIComponent(data.token)}`;
  return mailWrapper(lang, `
    <h2>${mailText(lang, 'mail.greeting', { name: data.name })}</h2>
    <p>${mailText(lang, 'mail.verifyEmail.body')}</p>
    <a href="${escapeHtmlAttribute(verifyUrl)}" style="background-color: #008CBA; color: white; padding: 10px 20px; text-decoration: none;">${mailText(lang, 'mail.verifyEmail.button')}</a>
  `);
};
