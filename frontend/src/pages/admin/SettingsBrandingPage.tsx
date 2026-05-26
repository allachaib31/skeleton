import { FormEvent, useEffect, useState } from 'react';
import { Image, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { FileUpload } from '@/shared/components/forms/FileUpload';
import { useSettingsApp, useUpdateSettingsApp } from '@/features/settings/hooks/settings.hooks';

export default function SettingsBrandingPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { data: settingsResponse, isLoading } = useSettingsApp();
  const { mutate: updateSettings, isPending } = useUpdateSettingsApp();
  const settings = settingsResponse?.data;
  const [appName, setAppName] = useState('tafa3olcard');
  const [logo, setLogo] = useState<File | null>(null);
  const [favicon, setFavicon] = useState<File | null>(null);
  const [logoUploadKey, setLogoUploadKey] = useState(0);
  const [faviconUploadKey, setFaviconUploadKey] = useState(0);

  useEffect(() => {
    setPageTitle(t('adminSettings.branding.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('adminSettings.title') },
      { label: t('adminSettings.branding.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  useEffect(() => {
    if (!settings) return;
    setAppName(settings.appName || 'tafa3olcard');
    setLogo(null);
    setFavicon(null);
    setLogoUploadKey((key) => key + 1);
    setFaviconUploadKey((key) => key + 1);
  }, [settings]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSettings({ appName, logo, favicon });
  };

  if (isLoading) {
    return <div className="rounded-xl border border-white/10 bg-secondary p-6 text-sm text-slate-400">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <SEO title={t('adminSettings.branding.title')} description={t('adminSettings.branding.description')} />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('adminSettings.branding.title')}</h1>
        <Image size={24} className="text-primary" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-white/10 bg-secondary p-6">
        <Input
          label={t('adminSettings.branding.appName')}
          value={appName}
          onChange={(event) => setAppName(event.target.value)}
          required
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-bold">{t('adminSettings.branding.logo')}</h2>
            {settings?.logo?.secureUrl && !logo && (
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-background/40 p-3">
                <img src={settings.logo.secureUrl} alt={t('adminSettings.branding.logo')} className="h-12 max-w-40 rounded-md object-contain" />
                <span className="text-sm text-slate-400">{t('adminSettings.branding.keepCurrentLogo')}</span>
              </div>
            )}
            <FileUpload key={logoUploadKey} accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024} onFile={setLogo} onClear={() => setLogo(null)} />
          </div>

          <div className="space-y-3">
            <h2 className="font-bold">{t('adminSettings.branding.favicon')}</h2>
            {settings?.favicon?.secureUrl && !favicon && (
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-background/40 p-3">
                <img src={settings.favicon.secureUrl} alt={t('adminSettings.branding.favicon')} className="h-10 w-10 rounded-md object-contain" />
                <span className="text-sm text-slate-400">{t('adminSettings.branding.keepCurrentFavicon')}</span>
              </div>
            )}
            <FileUpload key={faviconUploadKey} accept="image/jpeg,image/png,image/webp" maxSize={1024 * 1024} onFile={setFavicon} onClear={() => setFavicon(null)} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isPending} leftIcon={<Save size={16} />}>{t('common.save')}</Button>
        </div>
      </form>
    </div>
  );
}
