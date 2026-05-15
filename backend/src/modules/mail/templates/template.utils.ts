import { escapeHtml } from '../../../common/utils/html';
import { getLanguageDirection, translate } from '../../../config/i18n.config';

type MailParams = Record<string, string | number | boolean | null | undefined>;

export const mailText = (lang: string, key: string, params: MailParams = {}): string =>
  escapeHtml(translate(key, lang, params));

export const mailDirection = (lang: string): 'ltr' | 'rtl' => getLanguageDirection(lang);

export const mailWrapper = (lang: string, content: string): string => `
  <div dir="${mailDirection(lang)}" style="font-family: Arial, sans-serif; padding: 20px; text-align: ${mailDirection(lang) === 'rtl' ? 'right' : 'left'};">
    ${content}
  </div>
`;
