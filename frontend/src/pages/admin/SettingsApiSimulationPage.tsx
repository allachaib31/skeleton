import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Select } from '@/shared/components/ui/Select';
import SettingsGiftCardProvidersSimulationPage from './SettingsGiftCardProvidersSimulationPage';
import SettingsGiftCardProviders2SimulationPage from './SettingsGiftCardProviders2SimulationPage';
import SettingsSocialMediaServiceProvidersSimulationPage from './SettingsSocialMediaServiceProvidersSimulationPage';
import SettingsTemporaryNumberCodingSitesSimulationPage from './SettingsTemporaryNumberCodingSitesSimulationPage';

type SupportedApiSimulationGroup = 'TEMPORARY_NUMBER_CODING_SITES' | 'SOCIAL_MEDIA_SERVICE_PROVIDERS' | 'GIFT_CARD_PROVIDERS' | 'GIFT_CARD_PROVIDERS_2';

export default function SettingsApiSimulationPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [group, setGroup] = useState<SupportedApiSimulationGroup>('GIFT_CARD_PROVIDERS');

  useEffect(() => {
    setPageTitle(t('adminSettings.apiSimulation.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('adminSettings.title') },
      { label: t('adminSettings.apiSimulation.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  return (
    <div className="space-y-6">
      <SEO title={t('adminSettings.apiSimulation.title')} description={t('adminSettings.apiSimulation.description')} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('adminSettings.apiSimulation.title')}</h1>
          <FlaskConical size={24} className="text-primary" />
        </div>
        <Select
          className="sm:w-80"
          label={t('adminSettings.apiSimulation.group')}
          value={group}
          options={[
            { value: 'TEMPORARY_NUMBER_CODING_SITES', label: t('adminSettings.apiGroups.TEMPORARY_NUMBER_CODING_SITES') },
            { value: 'SOCIAL_MEDIA_SERVICE_PROVIDERS', label: t('adminSettings.apiGroups.SOCIAL_MEDIA_SERVICE_PROVIDERS') },
            { value: 'GIFT_CARD_PROVIDERS', label: t('adminSettings.apiGroups.GIFT_CARD_PROVIDERS') },
            { value: 'GIFT_CARD_PROVIDERS_2', label: t('adminSettings.apiGroups.GIFT_CARD_PROVIDERS_2') },
          ]}
          onChange={(event) => setGroup(event.target.value as SupportedApiSimulationGroup)}
        />
      </div>

      {group === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' ? (
        <SettingsSocialMediaServiceProvidersSimulationPage />
      ) : group === 'TEMPORARY_NUMBER_CODING_SITES' ? (
        <SettingsTemporaryNumberCodingSitesSimulationPage />
      ) : group === 'GIFT_CARD_PROVIDERS' ? (
        <SettingsGiftCardProvidersSimulationPage embedded />
      ) : (
        <SettingsGiftCardProviders2SimulationPage embedded />
      )}
    </div>
  );
}
