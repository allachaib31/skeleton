import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { JsonLd } from '@/shared/components/seo/JsonLd';
import { Button } from '@/shared/components/ui/Button';
import { Shield, Zap, Globe, ArrowRight, Layout, Database, Terminal } from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();
  const features = [
    {
      title: t('home.features.security.title'),
      desc: t('home.features.security.description'),
      icon: <Shield className="w-10 h-10 text-primary" />,
    },
    {
      title: t('home.features.realtime.title'),
      desc: t('home.features.realtime.description'),
      icon: <Zap className="w-10 h-10 text-yellow-500" />,
    },
    {
      title: t('home.features.global.title'),
      desc: t('home.features.global.description'),
      icon: <Globe className="w-10 h-10 text-blue-500" />,
    },
  ];

  return (
    <div className="flex flex-col gap-20 py-10">
      <SEO 
        title={t('home.seoTitle')}
        description={t('home.seoDescription')}
      />
      <JsonLd 
        type="WebSite"
        data={{
          name: 'AppName',
          url: window.location.origin,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${window.location.origin}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full text-xs font-bold uppercase tracking-widest border border-primary/10">
          <Activity size={14} /> {t('home.badge')}
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          {t('home.titlePrefix')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">{t('home.titleAccent')}</span> {t('home.titleSuffix')}
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {t('home.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/register">
            <Button size="lg" className="px-8 h-14 text-lg" rightIcon={<ArrowRight size={20} />}>
              {t('home.getStarted')}
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="px-8 h-14 text-lg">
              {t('home.viewDemo')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {features.map((f, i) => (
          <div key={i} className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all hover:-translate-y-2">
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl inline-block">
              {f.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{f.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 border-y border-slate-100 dark:border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('home.techTitle')}</h2>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-50 dark:invert">
          <div className="flex items-center gap-2 font-bold text-xl"><Layout /> React</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Zap /> Vite</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Shield /> TypeScript</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Database /> Zustand</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Terminal /> Tailwind</div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-primary rounded-[3rem] p-16 text-white space-y-8 mx-4">
        <h2 className="text-4xl font-bold">{t('home.ctaTitle')}</h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto">
          {t('home.ctaDescription')}
        </p>
        <Link to="/register">
          <Button size="lg" className="bg-white text-primary hover:bg-slate-50 px-10 h-14 text-lg">
            {t('auth.createAccount')}
          </Button>
        </Link>
      </section>
    </div>
  );
}

import { Activity } from 'lucide-react';
