import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';
import { SEO } from '@/shared/components/seo/SEO';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 space-y-8">
      <SEO title="404 - Not Found" description={t('runtime.notFoundDescription')} noindex />
      
      <div className="relative">
        <h1 className="text-[12rem] font-black text-slate-100 dark:text-slate-800 leading-none">404</h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl">🕵️‍♂️</span>
        </div>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <h2 className="text-3xl font-bold">{t('runtime.notFoundTitle')}</h2>
        <p className="text-slate-500">
          {t('runtime.notFoundDescription')}
        </p>
      </div>

      <Link to="/">
        <Button size="lg" leftIcon={<Home size={20} />}>
          {t('runtime.returnHome')}
        </Button>
      </Link>
    </div>
  );
}
