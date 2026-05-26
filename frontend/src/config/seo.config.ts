import { env } from './env.config';

export const defaultSEO = {
  titleTemplate: '%s | tafa3olcard',
  defaultTitle: 'tafa3olcard',
  description: 'tafa3olcard product and service sales platform.',
  openGraph: {
    type: 'website',
    url: env.VITE_APP_URL,
    siteName: 'tafa3olcard',
    images: [
      {
        url: `${env.VITE_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'tafa3olcard',
      },
    ],
  },
  twitter: {
    handle: '@tafa3olcard',
    site: '@tafa3olcard',
    cardType: 'summary_large_image',
  },
};
