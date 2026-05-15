import { mailText, mailWrapper } from './template.utils';

export const loginNewDeviceTemplate = (data: { name: string, device: string, ip: string, time: string }, lang: string) => {
  return mailWrapper(lang, `
    <h2>${mailText(lang, 'mail.loginNewDevice.title')}</h2>
    <p>${mailText(lang, 'mail.loginNewDevice.body')}</p>
    <ul>
      <li>${mailText(lang, 'mail.loginNewDevice.device', { device: data.device })}</li>
      <li>${mailText(lang, 'mail.loginNewDevice.ip', { ip: data.ip })}</li>
      <li>${mailText(lang, 'mail.loginNewDevice.time', { time: data.time })}</li>
    </ul>
  `);
};
