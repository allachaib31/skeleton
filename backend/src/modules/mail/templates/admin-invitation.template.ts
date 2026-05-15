import { escapeHtml, escapeHtmlAttribute } from '../../../common/utils/html';
import { mailText, mailWrapper } from './template.utils';

export const adminInvitationTemplate = (data: { name: string, inviteUrl: string, role: string }, lang: string) => {
  return mailWrapper(lang, `
    <h2>${mailText(lang, 'mail.greeting', { name: data.name })}</h2>
    <p>${mailText(lang, 'mail.adminInvitation.body')} <strong>${escapeHtml(data.role)}</strong></p>
    <a href="${escapeHtmlAttribute(data.inviteUrl)}" style="background-color: #555555; color: white; padding: 10px 20px; text-decoration: none;">${mailText(lang, 'mail.adminInvitation.button')}</a>
  `);
};
