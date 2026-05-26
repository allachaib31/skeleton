import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, KeyRound, RefreshCw } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Switch } from '@/shared/components/ui/Switch';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Table } from '@/shared/components/ui/Table';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import {
  useCreateSettingsApi,
  useSettingsApis,
  useSettingsCurrencies,
  useSyncAllSettingsApis,
  useSyncSettingsApi,
  useUpdateSettingsApi,
} from '@/features/settings/hooks/settings.hooks';
import { ApiGroup, apiGroups, ApiSyncSchedule, apiSyncSchedules, SettingsApi } from '@/features/settings/types/settings.types';
import { toast } from 'sonner';

const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 300, label: '300' },
];

export default function SettingsApisPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<SettingsApi | null>(null);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [token, setToken] = useState('');
  const [group, setGroup] = useState<ApiGroup>('TEMPORARY_NUMBER_CODING_SITES');
  const [currencyId, setCurrencyId] = useState('');
  const [syncSchedule, setSyncSchedule] = useState<ApiSyncSchedule>('*/1 * * * *');
  const [isVisible, setIsVisible] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  const { data: apisResponse, isLoading } = useSettingsApis({ page, limit });
  const { data: currenciesResponse } = useSettingsCurrencies({ page: 1, limit: 300 });
  const { mutate: createApi, isPending } = useCreateSettingsApi();
  const { mutate: updateApi, isPending: isUpdating } = useUpdateSettingsApi();
  const { mutate: syncApi, isPending: isSyncingOne } = useSyncSettingsApi();
  const { mutate: syncAllApis, isPending: isSyncingAll } = useSyncAllSettingsApis();

  useEffect(() => {
    setPageTitle(t('adminSettings.apis.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('adminSettings.title') },
      { label: t('adminSettings.apis.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const currencyOptions = useMemo(
    () =>
      (currenciesResponse?.data || []).map((currency) => ({
        value: currency._id,
        label: `${currency.name} (${currency.shortName})`,
      })),
    [currenciesResponse?.data]
  );

  const resetForm = () => {
    setName('');
    setLink('');
    setToken('');
    setGroup('TEMPORARY_NUMBER_CODING_SITES');
    setCurrencyId('');
    setSyncSchedule('*/1 * * * *');
    setIsVisible(true);
    setIsDeleted(false);
  };

  const closeModal = () => {
    resetForm();
    setEditingApi(null);
    setIsOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingApi(null);
    setIsOpen(true);
  };

  const openEditModal = (api: SettingsApi) => {
    setName(api.name);
    setLink(api.link);
    setToken('');
    setGroup(api.group);
    setCurrencyId(typeof api.currencyId === 'string' ? api.currencyId : api.currencyId._id);
    setSyncSchedule(api.syncSchedule);
    setIsVisible(api.isVisible);
    setIsDeleted(api.isDeleted);
    setEditingApi(api);
    setIsOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currencyId) {
      toast.error(t('adminSettings.apis.currencyRequired'));
      return;
    }

    if (!editingApi && !token) {
      toast.error(t('adminSettings.apis.tokenRequired'));
      return;
    }

    const payload = {
      name,
      link,
      group,
      currencyId,
      syncSchedule,
      isVisible,
      isDeleted,
      ...(token ? { token } : {}),
    };

    if (editingApi) {
      updateApi({ id: editingApi._id, data: payload }, { onSuccess: closeModal });
      return;
    }

    createApi({ ...payload, token }, { onSuccess: closeModal });
  };

  const getCurrencyLabel = (api: SettingsApi) => {
    if (typeof api.currencyId === 'string') return t('adminSettings.apis.unknownCurrency');
    return `${api.currencyId.name} (${api.currencyId.shortName})`;
  };

  const getBalanceLabel = (api: SettingsApi) => {
    if (typeof api.balance !== 'number') return t('adminSettings.apis.balanceUnknown');
    return `${api.balance.toFixed(4)} ${api.balanceCurrency || ''}`.trim();
  };

  const columns = [
    { key: 'name', header: t('adminSettings.apis.name'), render: (api: SettingsApi) => <span className="font-bold">{api.name}</span> },
    { key: 'link', header: t('adminSettings.apis.link'), render: (api: SettingsApi) => <span className="max-w-xs truncate text-xs">{api.link}</span> },
    { key: 'group', header: t('adminSettings.apis.group'), render: (api: SettingsApi) => <Badge variant="info">{t(`adminSettings.apiGroups.${api.group}`)}</Badge> },
    { key: 'currency', header: t('adminSettings.apis.currency'), render: (api: SettingsApi) => getCurrencyLabel(api) },
    { key: 'balance', header: t('adminSettings.apis.balance'), render: (api: SettingsApi) => getBalanceLabel(api) },
    {
      key: 'syncStatus',
      header: t('adminSettings.apis.syncStatus'),
      render: (api: SettingsApi) => <Badge variant={api.syncStatus === 'ERROR' ? 'danger' : api.syncStatus === 'SUCCESS' ? 'success' : 'outline'}>{t(`adminSettings.apiSyncStatuses.${api.syncStatus || 'IDLE'}`)}</Badge>,
    },
    { key: 'time', header: t('adminSettings.apis.time'), render: (api: SettingsApi) => t(`adminSettings.apiSchedules.${api.syncSchedule}`) },
    { key: 'token', header: t('adminSettings.apis.token'), render: (api: SettingsApi) => <span className="font-mono text-xs">{api.token}</span> },
    {
      key: 'visibility',
      header: t('adminSettings.visibility'),
      render: (api: SettingsApi) => <Badge variant={api.isVisible ? 'success' : 'default'}>{api.isVisible ? t('adminSettings.visible') : t('adminSettings.hidden')}</Badge>,
    },
    {
      key: 'deleteStatus',
      header: t('adminSettings.deleteStatus'),
      render: (api: SettingsApi) => <Badge variant={api.isDeleted ? 'danger' : 'outline'}>{api.isDeleted ? t('adminSettings.softDeleted') : t('adminSettings.active')}</Badge>,
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (api: SettingsApi) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => syncApi(api._id)}
            isLoading={isSyncingOne}
            title={t('adminSettings.apis.forceSync')}
            aria-label={t('adminSettings.apis.forceSync')}
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(api)}
            title={t('common.edit')}
            aria-label={t('common.edit')}
          >
            <Edit size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('adminSettings.apis.title')} description={t('adminSettings.apis.description')} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('adminSettings.apis.title')}</h1>
          <KeyRound size={24} className="text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => syncAllApis()} isLoading={isSyncingAll} leftIcon={<RefreshCw size={16} />}>
            {t('adminSettings.apis.forceSyncAll')}
          </Button>
          <Button onClick={openCreateModal}>{t('adminSettings.apis.create')}</Button>
        </div>
      </div>

      <Table columns={columns} data={apisResponse?.data || []} isLoading={isLoading} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('adminSettings.rowsPerPage')}</span>
          <Select
            value={String(limit)}
            options={pageSizeOptions}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="w-28"
          />
        </div>
        <Pagination total={apisResponse?.meta?.total ?? 0} page={page} limit={limit} onChange={setPage} />
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} title={editingApi ? t('adminSettings.apis.update') : t('adminSettings.apis.create')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label={t('adminSettings.apis.name')} value={name} onChange={(event) => setName(event.target.value)} required />
          <Input label={t('adminSettings.apis.link')} type="url" value={link} onChange={(event) => setLink(event.target.value)} required />
          <Input
            label={t('adminSettings.apis.token')}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={editingApi ? t('adminSettings.apis.keepToken') : undefined}
            required={!editingApi}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t('adminSettings.apis.group')}
              value={group}
              options={apiGroups.map((item) => ({ value: item, label: t(`adminSettings.apiGroups.${item}`) }))}
              onChange={(event) => setGroup(event.target.value as ApiGroup)}
            />
            <Select
              label={t('adminSettings.apis.currency')}
              value={currencyId}
              options={[{ value: '', label: t('adminSettings.apis.selectCurrency') }, ...currencyOptions]}
              onChange={(event) => setCurrencyId(event.target.value)}
              required
            />
            <Select
              label={t('adminSettings.apis.time')}
              value={syncSchedule}
              options={apiSyncSchedules.map((item) => ({ value: item, label: t(`adminSettings.apiSchedules.${item}`) }))}
              onChange={(event) => setSyncSchedule(event.target.value as ApiSyncSchedule)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Switch label={t('adminSettings.show')} checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} />
            <Switch label={t('adminSettings.markDeleted')} checked={isDeleted} onChange={(event) => setIsDeleted(event.target.checked)} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending || isUpdating}>
              {editingApi ? t('adminSettings.apis.update') : t('adminSettings.apis.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
