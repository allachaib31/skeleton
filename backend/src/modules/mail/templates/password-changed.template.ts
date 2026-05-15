import { mailText, mailWrapper } from './template.utils';

export const passwordChangedTemplate = (data: { name: string, changedAt: string, ip: string }, lang: string) => {
  const changedAt = data.changedAt || new Date().toISOString();
  const ip = data.ip || mailText(lang, 'mail.passwordChanged.unknown');
  return mailWrapper(lang, `
    <h2>${mailText(lang, 'mail.greeting', { name: data.name })}</h2>
    <p>${mailText(lang, 'mail.passwordChanged.body')}</p>
    <p>${mailText(lang, 'mail.passwordChanged.time', { time: changedAt })}</p>
    <p>${mailText(lang, 'mail.passwordChanged.ip', { ip })}</p>
    <p>${mailText(lang, 'mail.passwordChanged.warning')}</p>
  `);
};
