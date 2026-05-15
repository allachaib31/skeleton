import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Language } from '@/shared/types/common.types';
import i18n from '@/config/i18n';
import { getLanguageBundle } from '@/features/i18n/api/languages.api';

interface LanguageState {
  language: Language;
  direction: 'ltr' | 'rtl';
}

interface LanguageActions {
  setLanguage: (lang: Language) => Promise<void>;
}

const rtlLanguages = new Set(['ar', 'fa', 'he', 'ur']);

const getDirection = (language: string): 'ltr' | 'rtl' => {
  const baseLanguage = language.split('-')[0];
  return rtlLanguages.has(baseLanguage) ? 'rtl' : 'ltr';
};

export const useLanguageStore = create<LanguageState & LanguageActions>()(
  devtools(
    persist(
      (set) => ({
        language: (i18n.language as Language) || 'en',
        direction: getDirection(i18n.language),

        setLanguage: async (language) => {
          if (!i18n.hasResourceBundle(language, 'translation')) {
            const response = await getLanguageBundle(language);
            i18n.addResourceBundle(language, 'translation', response.data, true, true);
          }

          const direction = getDirection(language);
          i18n.changeLanguage(language);
          document.documentElement.lang = language;
          document.body.dir = direction;
          set({ language, direction });
        },
      }),
      { name: 'language-storage' }
    ),
    { name: 'language-store' }
  )
);
