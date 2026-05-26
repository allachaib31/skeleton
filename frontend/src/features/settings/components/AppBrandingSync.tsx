import { useEffect } from 'react';
import { env } from '@/config/env.config';
import { useSettingsApp } from '../hooks/settings.hooks';
import { useBrandingStore } from '../stores/branding.store';

export function AppBrandingSync() {
  const { data: settingsResponse } = useSettingsApp();
  const setBranding = useBrandingStore((state) => state.setBranding);
  const settings = settingsResponse?.data;

  useEffect(() => {
    const appName = settings?.appName || env.VITE_APP_NAME || 'tafa3olcard';
    const faviconUrl = settings?.favicon?.secureUrl;
    setBranding({
      appName,
      logoUrl: settings?.logo?.secureUrl,
      faviconUrl,
    });
    document.title = appName;

    if (!faviconUrl) return;
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.href = faviconUrl;
  }, [setBranding, settings?.appName, settings?.favicon?.secureUrl, settings?.logo?.secureUrl]);

  return null;
}
