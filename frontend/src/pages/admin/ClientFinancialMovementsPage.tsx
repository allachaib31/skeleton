import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import { useAdminClients, useAllClientFinancialMovements } from '@/features/clients/hooks/clients.hooks';
import { AdminClient, ClientFinancialMovement, ClientMovementType } from '@/features/clients/types/client.types';

const movementTypes: Array<ClientMovementType | ''> = ['', 'DEPOSIT', 'WITHDRAW'];

const getClient = (movement: ClientFinancialMovement) => (typeof movement.clientId === 'string' ? undefined : movement.clientId);

export default function ClientFinancialMovementsPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [params, setParams] = useState({ page: 1, limit: 10, clientId: '', type: '' as ClientMovementType | '', dateFrom: '', dateTo: '' });
  const { data: movementsResponse, isLoading } = useAllClientFinancialMovements(params);
  const { data: clientsResponse } = useAdminClients({ page: 1, limit: 300, search: '' });

  useEffect(() => {
    setPageTitle(t('clients.financialMovements'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('clients.manage'), href: '/admin/clients' },
      { label: t('clients.financialMovements') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const clientOptions = useMemo(
    () => [
      { value: '', label: t('clients.allClients') },
      ...(clientsResponse?.data || []).map((client: AdminClient) => ({ value: client._id, label: `${client.name} (${client.email})` })),
    ],
    [clientsResponse?.data, t]
  );

  const columns = [
    {
      key: 'client',
      header: t('clients.client'),
      render: (movement: ClientFinancialMovement) => {
        const client = getClient(movement);
        return client ? `${client.countryFlag || ''} ${client.name} (${client.email})` : '-';
      },
    },
    { key: 'type', header: t('clients.movementType'), render: (movement: ClientFinancialMovement) => <Badge variant="outline">{t(`clients.movementTypes.${movement.type}`)}</Badge> },
    { key: 'amount', header: t('clients.amount'), render: (movement: ClientFinancialMovement) => `$${movement.amount.toFixed(2)}` },
    { key: 'before', header: t('clients.balanceBefore'), render: (movement: ClientFinancialMovement) => `$${movement.balanceBefore.toFixed(2)}` },
    { key: 'after', header: t('clients.balanceAfter'), render: (movement: ClientFinancialMovement) => `$${movement.balanceAfter.toFixed(2)}` },
    { key: 'comment', header: t('clients.comment'), render: (movement: ClientFinancialMovement) => movement.comment || '-' },
    { key: 'createdAt', header: t('clients.date'), render: (movement: ClientFinancialMovement) => new Date(movement.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('clients.financialMovements')} description={t('clients.financialMovementsDescription')} />
      <div>
        <h1 className="text-2xl font-bold">{t('clients.financialMovements')}</h1>
        <p className="text-sm text-slate-500">{t('clients.financialMovementsDescription')}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Select value={params.clientId} options={clientOptions} onChange={(event) => setParams((current) => ({ ...current, clientId: event.target.value, page: 1 }))} />
        <Select
          value={params.type}
          options={movementTypes.map((type) => ({ value: type, label: type ? t(`clients.movementTypes.${type}`) : t('common.all') }))}
          onChange={(event) => setParams((current) => ({ ...current, type: event.target.value as ClientMovementType | '', page: 1 }))}
        />
        <Input type="date" value={params.dateFrom} onChange={(event) => setParams((current) => ({ ...current, dateFrom: event.target.value, page: 1 }))} aria-label={t('clients.dateFrom')} />
        <Input type="date" value={params.dateTo} onChange={(event) => setParams((current) => ({ ...current, dateTo: event.target.value, page: 1 }))} aria-label={t('clients.dateTo')} />
        <Select value={String(params.limit)} options={[10, 50, 100, 300].map((value) => ({ value, label: String(value) }))} onChange={(event) => setParams((current) => ({ ...current, limit: Number(event.target.value), page: 1 }))} />
      </div>

      <Table columns={columns} data={movementsResponse?.data || []} isLoading={isLoading} emptyMessage={t('clients.noFinancialMovements')} getRowKey={(movement) => movement._id} />
      <Pagination total={movementsResponse?.meta?.total ?? 0} page={params.page} limit={params.limit} onChange={(page) => setParams((current) => ({ ...current, page }))} />
    </div>
  );
}
