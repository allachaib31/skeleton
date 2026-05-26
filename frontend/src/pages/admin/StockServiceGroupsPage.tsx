import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Layers2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Switch } from '@/shared/components/ui/Switch';
import { Table } from '@/shared/components/ui/Table';
import { Badge } from '@/shared/components/ui/Badge';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';
import { useCreateStockServiceGroup, useStockServiceGroups, useUpdateStockServiceGroup } from '@/features/stocks/hooks/stock-service-groups.hooks';
import {
  serviceGroupPricingTypes,
  ServiceGroupPricingType,
  StockServiceGroup,
} from '@/features/stocks/types/stock-service-group.types';

const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 300, label: '300' },
];

export default function StockServiceGroupsPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [serviceFilter, setServiceFilter] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [pricingType, setPricingType] = useState<ServiceGroupPricingType>('INCREASE');
  const [value, setValue] = useState('');
  const [negativeValue, setNegativeValue] = useState('');
  const [percentAgent, setPercentAgent] = useState('');
  const [entitlementValue, setEntitlementValue] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StockServiceGroup | null>(null);

  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: groupsResponse, isLoading } = useStockServiceGroups({
    page,
    limit,
    serviceId: serviceFilter || undefined,
  });
  const { mutate: createGroup, isPending } = useCreateStockServiceGroup();
  const { mutate: updateGroup, isPending: isUpdating } = useUpdateStockServiceGroup();

  useEffect(() => {
    setPageTitle(t('stocks.serviceGroups.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.serviceGroups.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const getLocalizedValue = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value[key] || value.en;
  };

  const serviceOptions = useMemo(
    () => [
      { value: '', label: t('stocks.serviceGroups.selectService') },
      ...(servicesResponse?.data || []).map((service) => ({
        value: service._id,
        label: getLocalizedValue(service.name),
      })),
    ],
    [servicesResponse?.data, language, t]
  );

  const filterServiceOptions = useMemo(
    () => [
      { value: '', label: t('stocks.serviceGroups.allServices') },
      ...(servicesResponse?.data || []).map((service) => ({
        value: service._id,
        label: getLocalizedValue(service.name),
      })),
    ],
    [servicesResponse?.data, language, t]
  );

  const pricingTypeOptions = useMemo(
    () =>
      serviceGroupPricingTypes.map((type) => ({
        value: type,
        label: t(`stocks.serviceGroupPricingTypes.${type}`),
      })),
    [t]
  );

  const resetForm = () => {
    setName('');
    setServiceId('');
    setPricingType('INCREASE');
    setValue('');
    setNegativeValue('');
    setPercentAgent('');
    setEntitlementValue('');
    setIsDefault(false);
    setIsDeleted(false);
    setEditingGroup(null);
  };

  const closeModal = () => {
    resetForm();
    setIsOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsOpen(true);
  };

  const getServiceId = (service: StockServiceGroup['serviceId']) => (typeof service === 'string' ? service : service._id);

  const openEditModal = (group: StockServiceGroup) => {
    setName(group.name);
    setServiceId(getServiceId(group.serviceId));
    setPricingType(group.pricingType);
    setValue(String(group.value));
    setNegativeValue(String(group.negativeValue));
    setPercentAgent(String(group.percentAgent));
    setEntitlementValue(String(group.entitlementValue));
    setIsDefault(group.isDefault);
    setIsDeleted(group.isDeleted);
    setEditingGroup(group);
    setIsOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!serviceId) {
      toast.error(t('stocks.serviceGroups.serviceRequired'));
      return;
    }

    const payload = {
        name,
        serviceId,
        pricingType,
        value: Number(value),
        negativeValue: Number(negativeValue),
        percentAgent: Number(percentAgent),
        entitlementValue: Number(entitlementValue),
        isDefault,
        isDeleted,
    };

    if (editingGroup) {
      updateGroup({ id: editingGroup._id, data: payload }, { onSuccess: closeModal });
      return;
    }

    createGroup(payload, { onSuccess: closeModal });
  };

  const softDeleteGroup = (group: StockServiceGroup) => {
    updateGroup({ id: group._id, data: { isDeleted: true, isDefault: false } });
  };

  const getServiceName = (service: StockServiceGroup['serviceId']) => {
    if (typeof service === 'string') return t('stocks.serviceGroups.unknownService');
    return getLocalizedValue(service.name);
  };

  const columns = [
    {
      key: 'name',
      header: t('stocks.serviceGroups.name'),
      render: (group: StockServiceGroup) => <span className="font-bold">{group.name}</span>,
    },
    {
      key: 'service',
      header: t('stocks.serviceGroups.service'),
      render: (group: StockServiceGroup) => getServiceName(group.serviceId),
    },
    {
      key: 'pricingType',
      header: t('stocks.serviceGroups.pricingType'),
      render: (group: StockServiceGroup) => (
        <Badge variant="info">{t(`stocks.serviceGroupPricingTypes.${group.pricingType}`)}</Badge>
      ),
    },
    {
      key: 'value',
      header: t('stocks.serviceGroups.value'),
      render: (group: StockServiceGroup) => group.value,
    },
    {
      key: 'negativeValue',
      header: t('stocks.serviceGroups.negativeValue'),
      render: (group: StockServiceGroup) => group.negativeValue,
    },
    {
      key: 'percentAgent',
      header: t('stocks.serviceGroups.percentAgent'),
      render: (group: StockServiceGroup) => group.percentAgent,
    },
    {
      key: 'entitlementValue',
      header: t('stocks.serviceGroups.entitlementValue'),
      render: (group: StockServiceGroup) => group.entitlementValue,
    },
    {
      key: 'default',
      header: t('stocks.serviceGroups.defaultGroup'),
      render: (group: StockServiceGroup) => (
        <Badge variant={group.isDefault ? 'success' : 'default'}>
          {group.isDefault ? t('common.yes') : t('common.no')}
        </Badge>
      ),
    },
    {
      key: 'deleteStatus',
      header: t('stocks.serviceGroups.deleteStatus'),
      render: (group: StockServiceGroup) => (
        <Badge variant={group.isDeleted ? 'danger' : 'outline'}>
          {group.isDeleted ? t('stocks.serviceGroups.softDeleted') : t('stocks.serviceGroups.active')}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: t('runtime.created'),
      render: (group: StockServiceGroup) => new Date(group.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (group: StockServiceGroup) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 px-0"
            title={t('common.edit')}
            aria-label={t('common.edit')}
            onClick={() => openEditModal(group)}
          >
            <Edit size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 px-0 text-red-500 hover:text-red-600"
            title={t('stocks.serviceGroups.softDelete')}
            aria-label={t('stocks.serviceGroups.softDelete')}
            disabled={group.isDeleted}
            onClick={() => softDeleteGroup(group)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.serviceGroups.title')} description={t('stocks.serviceGroups.description')} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('stocks.serviceGroups.title')}</h1>
          <Layers2 size={24} className="text-primary" />
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus size={18} />}>
          {t('stocks.serviceGroups.create')}
        </Button>
      </div>

      <div className="max-w-sm">
        <Select
          label={t('stocks.serviceGroups.filterByService')}
          value={serviceFilter}
          options={filterServiceOptions}
          onChange={(event) => {
            setServiceFilter(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <Table columns={columns} data={groupsResponse?.data || []} isLoading={isLoading} getRowKey={(group) => group._id} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('stocks.serviceGroups.rowsPerPage')}</span>
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
        <Pagination total={groupsResponse?.meta?.total ?? 0} page={page} limit={limit} onChange={setPage} />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={editingGroup ? t('stocks.serviceGroups.update') : t('stocks.serviceGroups.create')}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Input
              label={t('stocks.serviceGroups.name')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Select
              label={t('stocks.serviceGroups.service')}
              value={serviceId}
              options={serviceOptions}
              onChange={(event) => setServiceId(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Select
              label={t('stocks.serviceGroups.pricingType')}
              value={pricingType}
              options={pricingTypeOptions}
              onChange={(event) => setPricingType(event.target.value as ServiceGroupPricingType)}
            />
            <Input
              type="number"
              min="0"
              step="0.0001"
              label={t('stocks.serviceGroups.value')}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.0001"
              label={t('stocks.serviceGroups.negativeValue')}
              value={negativeValue}
              onChange={(event) => setNegativeValue(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Input
              type="number"
              min="0"
              step="0.0001"
              label={t('stocks.serviceGroups.percentAgent')}
              value={percentAgent}
              onChange={(event) => setPercentAgent(event.target.value)}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.0001"
              label={t('stocks.serviceGroups.entitlementValue')}
              value={entitlementValue}
              onChange={(event) => setEntitlementValue(event.target.value)}
              required
            />
            <div className="flex items-end">
              <Switch
                label={t('stocks.serviceGroups.defaultGroup')}
                checked={isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
              />
            </div>
          </div>

          <Switch
            label={t('stocks.serviceGroups.markDeleted')}
            checked={isDeleted}
            onChange={(event) => setIsDeleted(event.target.checked)}
          />

          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending || isUpdating}>
              {editingGroup ? t('stocks.serviceGroups.update') : t('stocks.serviceGroups.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
