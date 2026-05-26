import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { Select } from '@/shared/components/ui/Select';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { useSettingsApis, useSimulateSocialMediaServiceProviderApi } from '@/features/settings/hooks/settings.hooks';
import { SocialMediaServiceProviderAction, socialMediaServiceProviderActions } from '@/features/settings/types/settings.types';
import { toast } from 'sonner';

const parsePayload = (value: string) => {
  if (!value.trim()) return {};
  return JSON.parse(value) as Record<string, unknown>;
};

const actionPayloadExamples: Record<SocialMediaServiceProviderAction, string> = {
  SERVICES: '{}',
  ADD_ORDER: '{\n  "service": "1",\n  "link": "https://example.com/post",\n  "quantity": "100",\n  "params": {}\n}',
  ORDER_STATUS: '{\n  "order": "23501"\n}',
  MULTIPLE_ORDER_STATUS: '{\n  "orders": ["1", "10", "100"]\n}',
  CREATE_REFILL: '{\n  "order": "23501"\n}',
  MULTIPLE_REFILL: '{\n  "orders": ["1", "2", "3"]\n}',
  REFILL_STATUS: '{\n  "refill": "1"\n}',
  MULTIPLE_REFILL_STATUS: '{\n  "refills": ["1", "2", "3"]\n}',
  CREATE_CANCEL: '{\n  "orders": ["1", "2"]\n}',
  BALANCE: '{}',
};

export default function SettingsSocialMediaServiceProvidersSimulationPage() {
  const { t } = useTranslation();
  const [apiId, setApiId] = useState('');
  const [action, setAction] = useState<SocialMediaServiceProviderAction>('SERVICES');
  const [payload, setPayload] = useState(actionPayloadExamples.SERVICES);
  const { data: apisResponse } = useSettingsApis({ page: 1, limit: 300 });
  const { mutate: simulate, data: simulationResponse, isPending } = useSimulateSocialMediaServiceProviderApi();

  const apiOptions = useMemo(() => {
    const apis = (apisResponse?.data || []).filter(
      (api) => api.group === 'SOCIAL_MEDIA_SERVICE_PROVIDERS' && api.isVisible && !api.isDeleted
    );
    return [
      { value: '', label: t('adminSettings.socialMediaServiceProvidersSimulation.selectApi') },
      ...apis.map((api) => ({ value: api._id, label: api.name })),
    ];
  }, [apisResponse?.data, t]);

  const changeAction = (nextAction: SocialMediaServiceProviderAction) => {
    setAction(nextAction);
    setPayload(actionPayloadExamples[nextAction]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiId) {
      toast.error(t('adminSettings.socialMediaServiceProvidersSimulation.apiRequired'));
      return;
    }
    try {
      simulate({ apiId, action, ...parsePayload(payload) });
    } catch {
      toast.error(t('adminSettings.socialMediaServiceProvidersSimulation.invalidJson'));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-4">
        <Select label={t('adminSettings.socialMediaServiceProvidersSimulation.api')} value={apiId} options={apiOptions} onChange={(event) => setApiId(event.target.value)} required />
        <Select
          label={t('adminSettings.socialMediaServiceProvidersSimulation.action')}
          value={action}
          options={socialMediaServiceProviderActions.map((item) => ({ value: item, label: t(`adminSettings.socialMediaServiceProvidersSimulation.actions.${item}`) }))}
          onChange={(event) => changeAction(event.target.value as SocialMediaServiceProviderAction)}
        />
        <div className="xl:col-span-2 rounded-md border border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-800">
          {t(`adminSettings.socialMediaServiceProvidersSimulation.actionDescriptions.${action}`)}
        </div>
        <div className="flex items-end">
          <Button type="submit" isLoading={isPending} leftIcon={<Play size={16} />}>
            {t('adminSettings.socialMediaServiceProvidersSimulation.simulate')}
          </Button>
        </div>
        <Textarea className="xl:col-span-4 font-mono" rows={12} label={t('adminSettings.socialMediaServiceProvidersSimulation.payload')} value={payload} onChange={(event) => setPayload(event.target.value)} />
      </form>

      {action === 'ADD_ORDER' && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-200">
          {t('adminSettings.socialMediaServiceProvidersSimulation.orderWarning')}
        </div>
      )}

      {simulationResponse?.data && (
        <div className="space-y-3">
          <Badge variant="info">{t(`adminSettings.socialMediaServiceProvidersSimulation.actions.${simulationResponse.data.action}`)}</Badge>
          <pre className="max-h-[520px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-xs text-slate-50 dark:border-slate-800">
            {JSON.stringify(simulationResponse.data.response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
