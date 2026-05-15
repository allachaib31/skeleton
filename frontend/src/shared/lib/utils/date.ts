import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { enUS, fr, arSA } from 'date-fns/locale';

const locales: Record<string, any> = {
  en: enUS,
  fr: fr,
  ar: arSA,
};

export const formatDate = (date: string | Date, localeCode: string = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'PPP', { locale: locales[localeCode] || enUS });
};

export const formatRelative = (date: string | Date, localeCode: string = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { 
    addSuffix: true,
    locale: locales[localeCode] || enUS 
  });
};

export const isExpired = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return isAfter(new Date(), d);
};
