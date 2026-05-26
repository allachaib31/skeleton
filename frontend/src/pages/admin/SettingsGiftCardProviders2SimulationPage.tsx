import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Play } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Select } from '@/shared/components/ui/Select';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { useSettingsApis, useSimulateGiftCardProviders2Api } from '@/features/settings/hooks/settings.hooks';
import { GiftCardProviders2Action, giftCardProviders2Actions } from '@/features/settings/types/settings.types';
import { toast } from 'sonner';

const parsePayload = (value: string) => {
  if (!value.trim()) return {};
  return JSON.parse(value) as Record<string, unknown>;
};

const actionPayloadExamples: Record<GiftCardProviders2Action, string> = {
  BALANCE: '{}',
  INSTITUTIONS: '{}',
  SUBMIT_BILL: '{\n  "bill": {\n    "institutionId": "8",\n    "transactionId": "123456",\n    "subscriberName": "S***Y****",\n    "dueDate": "2013-05-12",\n    "installationNumber": "5458301526",\n    "institutionCode": "",\n    "billNumber": "12345665",\n    "billAmount": "110.15"\n  }\n}',
  CHECK_BILL: '{\n  "transactionId": "123456"\n}',
  BULK_CHECK_BILL: '{\n  "transactionIds": ["123456", "123457"]\n}',
  AIRTIME_TOPUP: '{\n  "airtime": {\n    "operator": "turkcell",\n    "type": "3gcep",\n    "amount": "5",\n    "phoneNumber": "5458301526",\n    "transactionId": "123456"\n  }\n}',
  CHECK_AIRTIME: '{\n  "transactionId": "123456"\n}',
  PIN_PRODUCTS: '{}',
  SUBMIT_PIN: '{\n  "pin": {\n    "gameId": "1",\n    "denomination": "123",\n    "reference": "123456",\n    "customerPhone": "51234567890",\n    "playerInfo": "987456"\n  }\n}',
  CHECK_PIN: '{\n  "transactionId": "123456"\n}',
};

interface SettingsGiftCardProviders2SimulationPageProps {
  embedded?: boolean;
}

export default function SettingsGiftCardProviders2SimulationPage({ embedded = false }: SettingsGiftCardProviders2SimulationPageProps) {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [apiId, setApiId] = useState('');
  const [action, setAction] = useState<GiftCardProviders2Action>('BALANCE');
  const [payload, setPayload] = useState(actionPayloadExamples.BALANCE);
  const { data: apisResponse } = useSettingsApis({ page: 1, limit: 300 });
  const { mutate: simulate, data: simulationResponse, isPending } = useSimulateGiftCardProviders2Api();

  useEffect(() => {
    if (embedded) return;
    setPageTitle(t('adminSettings.giftCardProviders2Simulation.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('adminSettings.title') },
      { label: t('adminSettings.giftCardProviders2Simulation.title') },
    ]);
  }, [embedded, setPageTitle, setBreadcrumbs, t]);

  const apiOptions = useMemo(() => {
    const apis = (apisResponse?.data || []).filter(
      (api) => api.group === 'GIFT_CARD_PROVIDERS_2' && api.isVisible && !api.isDeleted
    );
    return [
      { value: '', label: t('adminSettings.giftCardProviders2Simulation.selectApi') },
      ...apis.map((api) => ({ value: api._id, label: api.name })),
    ];
  }, [apisResponse?.data, t]);

  const changeAction = (nextAction: GiftCardProviders2Action) => {
    setAction(nextAction);
    setPayload(actionPayloadExamples[nextAction]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiId) {
      toast.error(t('adminSettings.giftCardProviders2Simulation.apiRequired'));
      return;
    }
    try {
      simulate({ apiId, action, ...parsePayload(payload) });
    } catch {
      toast.error(t('adminSettings.giftCardProviders2Simulation.invalidJson'));
    }
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <>
          <SEO title={t('adminSettings.giftCardProviders2Simulation.title')} description={t('adminSettings.giftCardProviders2Simulation.description')} />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{t('adminSettings.giftCardProviders2Simulation.title')}</h1>
            <Gift size={24} className="text-primary" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-4">
        <Select label={t('adminSettings.giftCardProviders2Simulation.api')} value={apiId} options={apiOptions} onChange={(event) => setApiId(event.target.value)} required />
        <Select
          label={t('adminSettings.giftCardProviders2Simulation.action')}
          value={action}
          options={giftCardProviders2Actions.map((item) => ({ value: item, label: t(`adminSettings.giftCardProviders2Simulation.actions.${item}`) }))}
          onChange={(event) => changeAction(event.target.value as GiftCardProviders2Action)}
        />
        <div className="xl:col-span-2 rounded-md border border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-800">
          {t(`adminSettings.giftCardProviders2Simulation.actionDescriptions.${action}`)}
        </div>
        <div className="flex items-end">
          <Button type="submit" isLoading={isPending} leftIcon={<Play size={16} />}>
            {t('adminSettings.giftCardProviders2Simulation.simulate')}
          </Button>
        </div>
        <Textarea className="xl:col-span-4 font-mono" rows={12} label={t('adminSettings.giftCardProviders2Simulation.payload')} value={payload} onChange={(event) => setPayload(event.target.value)} />
      </form>

      {['SUBMIT_BILL', 'AIRTIME_TOPUP', 'SUBMIT_PIN'].includes(action) && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-200">
          {t('adminSettings.giftCardProviders2Simulation.transactionWarning')}
        </div>
      )}

      {simulationResponse?.data && (
        <div className="space-y-3">
          <Badge variant="info">{t(`adminSettings.giftCardProviders2Simulation.actions.${simulationResponse.data.action}`)}</Badge>
          <pre className="max-h-[520px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-xs text-slate-50 dark:border-slate-800">
            {JSON.stringify(simulationResponse.data.response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
