import { mailText, mailWrapper } from './template.utils';

export const accountLockedTemplate = (data: { name: string, unlockAt: string }, lang: string) => {
  return mailWrapper(lang, `
    <h2>${mailText(lang, 'mail.greeting', { name: data.name })}</h2>
    <p>${mailText(lang, 'mail.accountLocked.body')}</p>
    <p>${mailText(lang, 'mail.accountLocked.unlock', { time: data.unlockAt })}</p>
  `);
};
