import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full border-t border-white/10 bg-background py-6">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-8">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} tafa3olcard. {t('runtime.allRightsReserved')}
        </p>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <a href="#" className="hover:text-primary transition-colors">{t('runtime.privacyPolicy')}</a>
          <a href="#" className="hover:text-primary transition-colors">{t('runtime.termsOfService')}</a>
          <a href="#" className="hover:text-primary transition-colors">{t('runtime.contactSupport')}</a>
        </div>
      </div>
    </footer>
  );
}
