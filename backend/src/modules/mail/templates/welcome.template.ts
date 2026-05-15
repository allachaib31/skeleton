import { escapeHtmlAttribute } from '../../../common/utils/html';
import { mailText, mailWrapper } from './template.utils';

export const welcomeTemplate = (data: { name: string, verifyUrl: string }, lang: string) => {
  return mailWrapper(lang, `
    <h2>${mailText(lang, 'mail.welcome.title', { name: data.name })}</h2>
    <p>${mailText(lang, 'mail.welcome.body')}</p>
    <a href="${escapeHtmlAttribute(data.verifyUrl)}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">${mailText(lang, 'mail.welcome.button')}</a>
  `);
};
