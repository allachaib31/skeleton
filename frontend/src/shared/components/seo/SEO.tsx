import { Helmet } from 'react-helmet-async';
import { env } from '@/config/env.config';

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
}

export function SEO({ title, description, canonical, image, noindex }: SEOProps) {
  const siteTitle = 'Antigravity Skeleton';
  const fullTitle = `${title} | ${siteTitle}`;
  const siteUrl = env.VITE_APP_URL;
  const defaultImage = `${siteUrl}/og-image.png`;
  const metaDescription = description ?? 'Antigravity Skeleton application page';

  return (
    <Helmet>
      <title>{fullTitle}</title>
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
