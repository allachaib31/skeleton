import { Helmet } from 'react-helmet-async';
import { env } from '@/config/env.config';
import { useBrandingStore } from '@/features/settings/stores/branding.store';

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
}

export function SEO({ title, description, canonical, image, noindex }: SEOProps) {
  const { appName, faviconUrl, logoUrl } = useBrandingStore();
  const siteTitle = appName || env.VITE_APP_NAME || 'tafa3olcard';
  const fullTitle = `${title} | ${siteTitle}`;
  const siteUrl = env.VITE_APP_URL;
  const defaultImage = logoUrl || `${siteUrl}/og-image.png`;
  const metaDescription = description ?? `${siteTitle} application page`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {faviconUrl && <link rel="icon" href={faviconUrl} />}
      <meta name="description" content={metaDescription} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={canonical || window.location.href} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image || defaultImage} />

      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}
