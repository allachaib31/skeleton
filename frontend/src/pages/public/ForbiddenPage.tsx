import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';
import { SEO } from '@/shared/components/seo/SEO';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 space-y-8">
      <SEO title="403 - Forbidden" description={t('runtime.forbiddenDescription')} noindex />
      
      <div className="p-8 bg-red-50 dark:bg-red-950/20 rounded-full text-red-500 ring-8 ring-red-50 dark:ring-red-950/10">
        <ShieldAlert size={80} />
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <h1 className="text-4xl font-extrabold">{t('runtime.forbiddenTitle')}</h1>
        <p className="text-slate-500">
          {t('runtime.forbiddenDescription')}
        </p>
      </div>

      <Link to="/">
        <Button variant="outline" size="lg" leftIcon={<ArrowLeft size={20} />}>
          {t('runtime.goBackHome')}
        </Button>
      </Link>
    </div>
  );
}
