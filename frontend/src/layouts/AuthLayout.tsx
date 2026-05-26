import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/ui/Card';
import { useLanguageStore } from '@/app/stores/language.store';
import { Button } from '@/shared/components/ui/Button';

export default function AuthLayout() {
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const { pathname } = useLocation();

  if (pathname === '/login' || pathname === '/register') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="mb-8 flex flex-col items-center">
        <Link to="/" className="text-3xl font-bold text-primary mb-2">
          {t('app.name')}
        </Link>
        <p className="text-slate-500 text-sm">{t('runtime.welcomeBackShort')}</p>
      </div>

      <Card className="w-full max-w-md" padding="lg">
        <Outlet />
      </Card>

      <div className="mt-8 flex gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className={language === 'en' ? 'text-primary' : ''} 
          onClick={() => setLanguage('en')}
        >
          EN
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={language === 'fr' ? 'text-primary' : ''} 
          onClick={() => setLanguage('fr')}
        >
          FR
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={language === 'ar' ? 'text-primary' : ''} 
          onClick={() => setLanguage('ar')}
        >
          العربية
        </Button>
      </div>
    </div>
  );
}
