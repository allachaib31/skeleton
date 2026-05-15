import { env } from './env.config';

export const defaultSEO = {
  titleTemplate: '%s | AppName',
  defaultTitle: 'AppName - Secure SaaS Infrastructure',
  description: 'Enterprise-grade React + Vite + TypeScript skeleton with built-in authentication, RBAC, and real-time features.',
  openGraph: {
    type: 'website',
    url: env.VITE_APP_URL,
    siteName: 'AppName',
    images: [
      {
        url: `${env.VITE_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'AppName',
      },
    ],
  },
  twitter: {
    handle: '@appname',
    site: '@appname',
    cardType: 'summary_large_image',
  },
};
