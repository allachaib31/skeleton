import { useTranslation } from 'react-i18next';
import ShopLandingPage from '@/features/shop/pages/LandingPage';
import { SEO } from '@/shared/components/seo/SEO';
import { JsonLd } from '@/shared/components/seo/JsonLd';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t('home.seoTitle')}
        description={t('home.seoDescription')}
      />
      <JsonLd
        type="WebSite"
        data={{
          name: 'tafa3olcard',
          url: window.location.origin,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${window.location.origin}/shop/dashboard?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <ShopLandingPage />
    </>
  );
}
