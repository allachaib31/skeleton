import en from '../locales/en.json';
import fr from '../locales/fr.json';
import ar from '../locales/ar.json';
import { env } from './env.config';

interface TranslationNode {
  [key: string]: string | TranslationNode;
}

type TranslationParams = Record<string, string | number | boolean | null | undefined>;

const dictionaries: Record<string, TranslationNode> = {
  en,
  fr,
  ar,
};

const interpolate = (value: string, params: TranslationParams): string =>
  value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, name: string) => String(params[name] ?? ''));

export const resolveLanguage = (lang?: string): string => {
  const requested = lang?.toLowerCase().split(',')[0]?.split('-')[0] || env.DEFAULT_LANGUAGE;
  return dictionaries[requested] ? requested : env.DEFAULT_LANGUAGE;
};

export const getLanguageDirection = (lang?: string): 'ltr' | 'rtl' =>
  resolveLanguage(lang) === 'ar' ? 'rtl' : 'ltr';

export const translate = (key: string, lang?: string, params: TranslationParams = {}): string => {
  const language = resolveLanguage(lang);
  const dictionary = dictionaries[language] || dictionaries[env.DEFAULT_LANGUAGE];
  const fallbackDictionary = dictionaries.en || dictionary;

  const keys = key.split('.');
  let value: string | TranslationNode | undefined = dictionary;
  let fallbackValue: string | TranslationNode | undefined = fallbackDictionary;

  for (const k of keys) {
    value = typeof value === 'object' && value !== null ? value[k] : undefined;
    fallbackValue = typeof fallbackValue === 'object' && fallbackValue !== null ? fallbackValue[k] : undefined;
  }

  const translated = typeof value === 'string' ? value : typeof fallbackValue === 'string' ? fallbackValue : key;
  return interpolate(translated, params);
};
