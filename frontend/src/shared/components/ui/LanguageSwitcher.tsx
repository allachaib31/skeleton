import { useLanguageStore } from '@/app/stores/language.store';
import { useLanguages } from '@/features/i18n/hooks/languages.hooks';
import { Dropdown } from './Dropdown';
import { Button } from './Button';
import { Globe, Check } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, direction, setLanguage } = useLanguageStore();
  const { data: languagesResponse } = useLanguages();

  const options = languagesResponse?.data ?? [
    { code: 'en', name: 'English', direction: 'ltr' as const, isDefault: true, isCustom: false },
    { code: 'fr', name: 'Français', direction: 'ltr' as const, isDefault: false, isCustom: false },
    { code: 'ar', name: 'العربية', direction: 'rtl' as const, isDefault: false, isCustom: false },
  ];

  return (
    <Dropdown
      align={direction === 'rtl' ? 'left' : 'right'}
      contentClassName="w-[calc(100vw-2rem)] max-w-xs sm:w-56"
      trigger={
        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-10 px-3">
          <Globe size={18} />
          <span className="text-xs font-bold uppercase">{language}</span>
        </Button>
      }
      items={options.map(opt => ({
        label: (
          <div className="flex min-w-0 w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-xs font-bold uppercase text-slate-400">{opt.code}</span>
              <span className="min-w-0 break-words text-start [overflow-wrap:anywhere]">{opt.name}</span>
            </div>
            {language === opt.code && <Check size={14} className="shrink-0 text-primary" />}
          </div>
        ),
        onClick: () => void setLanguage(opt.code),
      }))}
    />
  );
}
