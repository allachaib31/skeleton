import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { Card } from '@/shared/components/ui/Card';
import { Rocket, Heart, Code, Coffee } from 'lucide-react';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
      <SEO title={t('runtime.aboutSeoTitle')} description={t('runtime.aboutMission')} />

      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t('runtime.ourMission')}</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {t('runtime.aboutMission')}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card padding="lg" className="space-y-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl w-fit">
            <Heart size={24} />
          </div>
          <h3 className="text-xl font-bold">{t('runtime.openSource')}</h3>
          <p className="text-slate-500 text-sm">
            {t('runtime.openSourceDescription')}
          </p>
        </Card>

        <Card padding="lg" className="space-y-4">
          <div className="p-3 bg-accent/10 text-accent rounded-xl w-fit">
            <Code size={24} />
          </div>
          <h3 className="text-xl font-bold">{t('runtime.cuttingEdge')}</h3>
          <p className="text-slate-500 text-sm">
            {t('runtime.cuttingEdgeDescription')}
          </p>
        </Card>
      </div>

      <section className="space-y-6 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Rocket className="text-primary" />
          <h2 className="text-2xl font-bold">{t('runtime.coreTeam')}</h2>
        </div>
        <p className="text-slate-500 leading-relaxed">
          {t('runtime.coreTeamDescription')}
        </p>
        <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-medium">
          <Coffee size={18} className="text-amber-600" />
          {t('runtime.builtWithPassion')}
        </div>
      </section>
    </div>
  );
}
