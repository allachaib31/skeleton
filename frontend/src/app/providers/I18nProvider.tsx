import { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '@/config/i18n';

interface I18nProviderProps {
  children: ReactNode;
}

const rtlLanguages = new Set(['ar', 'fa', 'he', 'ur']);

const getDirection = (language: string): 'ltr' | 'rtl' => {
  const baseLanguage = language.split('-')[0];
  return rtlLanguages.has(baseLanguage) ? 'rtl' : 'ltr';
};

export function I18nProvider({ children }: I18nProviderProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lng = i18n.language;
    document.documentElement.lang = lng;
    document.body.dir = getDirection(lng);
  }, [i18n.language]);

  return <>{children}</>;
}

export const useLanguage = () => {
  const { i18n } = useTranslation();
  return {
    language: i18n.language,
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
    isRtl: getDirection(i18n.language) === 'rtl',
  };
};
