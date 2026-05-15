import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';
import { SEO } from '@/shared/components/seo/SEO';
import { RefreshCw, Home, ServerCrash } from 'lucide-react';

export default function ServerErrorPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 space-y-8">
      <SEO title="500 - Server Error" description={t('runtime.serverErrorDescription')} noindex />
      
      <div className="p-8 bg-amber-50 dark:bg-amber-950/20 rounded-full text-amber-500 ring-8 ring-amber-50 dark:ring-amber-950/10 animate-bounce">
        <ServerCrash size={80} />
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <h1 className="text-4xl font-extrabold">{t('runtime.serverErrorTitle')}</h1>
        <p className="text-slate-500">
          {t('runtime.serverErrorDescription')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" onClick={() => window.location.reload()} leftIcon={<RefreshCw size={20} />}>
          {t('runtime.tryAgain')}
        </Button>
        <Button variant="outline" size="lg" onClick={() => window.location.href = '/'} leftIcon={<Home size={20} />}>
          {t('runtime.returnHome')}
        </Button>
      </div>
    </div>
  );
}
