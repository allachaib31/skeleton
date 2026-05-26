import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Play } from 'lucide-react';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Select } from '@/shared/components/ui/Select';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useSettingsApis, useSimulateTemporaryNumberCodingSitesApi } from '@/features/settings/hooks/settings.hooks';
import { TemporaryNumberCodingSiteAction, temporaryNumberCodingSiteActions } from '@/features/settings/types/settings.types';

const parsePayload = (value: string) => {
  if (!value.trim()) return {};
  return JSON.parse(value) as Record<string, unknown>;
};

const actionPayloadExamples: Record<TemporaryNumberCodingSiteAction, string> = {
  GET_BALANCE: '{}',
  GET_NUMBER: '{\n  "service": "tg",\n  "country": "0",\n  "maxPrice": "1.00"\n}',
  GET_NUMBER_V2: '{\n  "service": "tg",\n  "country": "0",\n  "maxPrice": "1.00"\n}',
  SET_STATUS: '{\n  "activationId": "123456",\n  "status": "6"\n}',
  GET_STATUS: '{\n  "activationId": "123456"\n}',
  GET_STATUS_V2: '{\n  "activationId": "123456"\n}',
  GET_PRICES: '{\n  "service": "tg",\n  "country": "0"\n}',
  GET_PRICES_V2: '{\n  "service": "tg",\n  "country": "0"\n}',
  GET_PRICES_V3: '{\n  "service": "tg",\n  "country": "0"\n}',
  GET_ACTIVE_ACTIVATIONS: '{}',
};

export default function SettingsTemporaryNumberCodingSitesSimulationPage() {
  const { t } = useTranslation();
  const [apiId, setApiId] = useState('');
  const [action, setAction] = useState<TemporaryNumberCodingSiteAction>('GET_BALANCE');
  const [payload, setPayload] = useState(actionPayloadExamples.GET_BALANCE);
  const { data: apisResponse } = useSettingsApis({ page: 1, limit: 300 });
  const { mutate: simulate, data: simulationResponse, isPending } = useSimulateTemporaryNumberCodingSitesApi();

  const apiOptions = useMemo(() => {
    const apis = (apisResponse?.data || []).filter(
      (api) => api.group === 'TEMPORARY_NUMBER_CODING_SITES' && api.isVisible && !api.isDeleted
    );
    return [
      { value: '', label: t('adminSettings.temporaryNumberCodingSitesSimulation.selectApi') },
      ...apis.map((api) => ({ value: api._id, label: api.name })),
    ];
  }, [apisResponse?.data, t]);

  const changeAction = (nextAction: TemporaryNumberCodingSiteAction) => {
    setAction(nextAction);
    setPayload(actionPayloadExamples[nextAction]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiId) {
      toast.error(t('adminSettings.temporaryNumberCodingSitesSimulation.apiRequired'));
      return;
    }
    try {
      simulate({ apiId, action, ...parsePayload(payload) });
    } catch {
      toast.error(t('adminSettings.temporaryNumberCodingSitesSimulation.invalidJson'));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-4">
        <Select label={t('adminSettings.temporaryNumberCodingSitesSimulation.api')} value={apiId} options={apiOptions} onChange={(event) => setApiId(event.target.value)} required />
        <Select
          label={t('adminSettings.temporaryNumberCodingSitesSimulation.action')}
          value={action}
          options={temporaryNumberCodingSiteActions.map((item) => ({ value: item, label: t(`adminSettings.temporaryNumberCodingSitesSimulation.actions.${item}`) }))}
          onChange={(event) => changeAction(event.target.value as TemporaryNumberCodingSiteAction)}
        />
        <div className="xl:col-span-2 rounded-md border border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-800">
          {t(`adminSettings.temporaryNumberCodingSitesSimulation.actionDescriptions.${action}`)}
        </div>
        <div className="flex items-end">
          <Button type="submit" isLoading={isPending} leftIcon={<Play size={16} />}>
            {t('adminSettings.temporaryNumberCodingSitesSimulation.simulate')}
          </Button>
        </div>
        <Textarea className="xl:col-span-4 font-mono" rows={12} label={t('adminSettings.temporaryNumberCodingSitesSimulation.payload')} value={payload} onChange={(event) => setPayload(event.target.value)} />
      </form>

      {['GET_NUMBER', 'GET_NUMBER_V2'].includes(action) && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-200">
          {t('adminSettings.temporaryNumberCodingSitesSimulation.numberWarning')}
        </div>
      )}

      {simulationResponse?.data && (
        <div className="space-y-3">
          <Badge variant="info">{t(`adminSettings.temporaryNumberCodingSitesSimulation.actions.${simulationResponse.data.action}`)}</Badge>
          <pre className="max-h-[520px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-xs text-slate-50 dark:border-slate-800">
            {JSON.stringify(simulationResponse.data.response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
