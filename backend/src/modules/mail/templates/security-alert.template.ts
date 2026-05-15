import { mailText, mailWrapper } from './template.utils';

export const securityAlertTemplate = (data: { name: string, alertType: string, details: any }, lang: string) => {
  return mailWrapper(lang, `
    <div style="color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 16px;">
      <h2>${mailText(lang, 'mail.securityAlert.title')}: ${mailText(lang, 'mail.securityAlert.details', { details: data.alertType })}</h2>
      <p>${mailText(lang, 'mail.securityAlert.admin', { name: data.name })}</p>
      <p>${mailText(lang, 'mail.securityAlert.details', { details: JSON.stringify(data.details) })}</p>
    </div>
  `);
};
