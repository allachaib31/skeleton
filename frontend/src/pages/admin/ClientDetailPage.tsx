import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, CreditCard, Layers, Minus, Plus, Scale, Tags } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useAdminClient, useCreateClientMovement, useUpdateClientOpenCredit } from '@/features/clients/hooks/clients.hooks';
import { ClientFinancialMovement, ClientMovementType } from '@/features/clients/types/client.types';
import { useSettingsPaymentGateways } from '@/features/settings/hooks/settings.hooks';

const movementTabs: Array<ClientMovementType | ''> = ['', 'DEPOSIT', 'WITHDRAW'];
type ClientActionType = ClientMovementType | 'CREDIT';

export default function ClientDetailPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterType, setFilterType] = useState<ClientMovementType | ''>('');
  const [movementType, setMovementType] = useState<ClientActionType | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [comment, setComment] = useState('');

  const { data: clientResponse, isLoading } = useAdminClient(id, { page, limit, type: filterType });
  const { data: paymentMethodsResponse } = useSettingsPaymentGateways({ page: 1, limit: 300 });
  const { mutate: createMovement, isPending } = useCreateClientMovement(id);
  const { mutate: updateOpenCredit, isPending: isUpdatingOpenCredit } = useUpdateClientOpenCredit(id);
  const client = clientResponse?.data.client;
  const movements = clientResponse?.data.movements;

  useEffect(() => {
    setPageTitle(client ? client.name : t('clients.details'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('clients.title'), href: '/admin/clients' },
      { label: client ? client.name : t('clients.details') },
    ]);
  }, [client, setPageTitle, setBreadcrumbs, t]);

  const closeModal = () => {
    setMovementType(null);
    setAmount('');
    setPaymentMethodId('');
    setComment('');
  };

  const submitMovement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!movementType) return;
    if (movementType === 'CREDIT') {
      updateOpenCredit(
        { openCredit: -Math.abs(Number(amount)), comment },
        { onSuccess: closeModal }
      );
      return;
    }
    createMovement(
      { type: movementType, amount: Number(amount), paymentMethodId, comment },
      { onSuccess: closeModal }
    );
  };

  const paymentOptions = [
    { value: '', label: t('clients.noPaymentMethod') },
    ...(paymentMethodsResponse?.data || []).map((method) => ({ value: method._id, label: method.name.en })),
  ];

  const stats = [
    { label: t('clients.balance'), value: client?.balance ?? 0 },
    { label: t('clients.openCredit'), value: client?.openCredit ?? 0 },
    { label: t('clients.totalExpenses'), value: client?.totalExpenses ?? 0 },
    { label: t('clients.totalReferralWin'), value: client?.totalReferralWin ?? 0 },
  ];

  const columns = [
    { key: 'type', header: t('clients.movementType'), render: (movement: ClientFinancialMovement) => <Badge variant="outline">{t(`clients.movementTypes.${movement.type}`)}</Badge> },
    { key: 'amount', header: t('clients.amount'), render: (movement: ClientFinancialMovement) => `$${movement.amount.toFixed(2)}` },
    { key: 'before', header: t('clients.balanceBefore'), render: (movement: ClientFinancialMovement) => `$${movement.balanceBefore.toFixed(2)}` },
    { key: 'after', header: t('clients.balanceAfter'), render: (movement: ClientFinancialMovement) => `$${movement.balanceAfter.toFixed(2)}` },
    { key: 'comment', header: t('clients.comment'), render: (movement: ClientFinancialMovement) => movement.comment || '-' },
    { key: 'createdAt', header: t('clients.date'), render: (movement: ClientFinancialMovement) => new Date(movement.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <SEO title={client ? client.name : t('clients.details')} description={t('clients.detailsDescription')} />
      <Link to="/admin/clients" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
        <ArrowLeft size={16} /> {t('clients.backToClients')}
      </Link>

      <div className="flex flex-col gap-5 rounded-lg bg-primary p-6 text-primary-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={client?.avatar} name={client?.name} size="xl" />
          <div>
            <h1 className="text-2xl font-bold">{client?.name || t('clients.details')}</h1>
            <p className="font-medium">{client?.email}</p>
            <p className="text-sm opacity-80">{client?.countryFlag} {client?.countryCode} {client?.phoneNumber}</p>
          </div>
        </div>
        <div className="text-left md:text-right">
          <div className="text-sm font-bold">{t('clients.balance')}</div>
          <div className="text-3xl font-black">USD {(client?.balance ?? 0).toFixed(2)}</div>
          <div className="text-sm opacity-80">{t('clients.invitationCode')}: {client?.invitationCode || '-'}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-secondary p-5 text-center shadow-sm">
            <div className="text-2xl font-black">${stat.value.toFixed(2)}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setMovementType('DEPOSIT')} leftIcon={<Plus size={16} />}>{t('clients.addBalance')}</Button>
        <Button variant="danger" onClick={() => setMovementType('WITHDRAW')} leftIcon={<Minus size={16} />}>{t('clients.withdrawBalance')}</Button>
        <Button variant="secondary" onClick={() => setMovementType('CREDIT')} leftIcon={<Scale size={16} />}>{t('clients.openCredit')}</Button>
        <Link to={`/admin/clients/${id}/levels`}>
          <Button variant="outline" leftIcon={<Layers size={16} />}>{t('clients.levels')}</Button>
        </Link>
        <Link to={`/admin/clients/${id}/special-prices`}>
          <Button variant="outline" leftIcon={<Tags size={16} />}>{t('clients.specialPrices')}</Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('clients.movements')}</h2>
          <Select value={String(limit)} options={[10, 50, 100, 300].map((value) => ({ value, label: String(value) }))} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="w-28" />
        </div>
        <div className="flex flex-wrap gap-2">
          {movementTabs.map((type) => (
            <Button key={type || 'all'} type="button" variant={filterType === type ? 'primary' : 'ghost'} size="sm" onClick={() => { setFilterType(type); setPage(1); }}>
              {type ? t(`clients.movementTypes.${type}`) : t('common.all')}
            </Button>
          ))}
        </div>
        <Table columns={columns} data={movements?.data || []} isLoading={isLoading} getRowKey={(movement) => movement._id} />
        <Pagination total={movements?.meta.total ?? 0} page={page} limit={limit} onChange={setPage} />
      </div>

      <Modal isOpen={Boolean(movementType)} onClose={closeModal} title={movementType ? t(`clients.movementTypes.${movementType}`) : t('clients.movements')}>
        <form onSubmit={submitMovement} className="space-y-4">
          <Input type="number" min="0" step="0.0001" label={movementType === 'CREDIT' ? t('clients.openCreditLimit') : t('clients.amount')} value={amount} onChange={(event) => setAmount(event.target.value)} required />
          {movementType === 'DEPOSIT' && <Select label={t('clients.paymentMethod')} value={paymentMethodId} options={paymentOptions} onChange={(event) => setPaymentMethodId(event.target.value)} />}
          <Textarea label={t('clients.comment')} value={comment} onChange={(event) => setComment(event.target.value)} />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending || isUpdatingOpenCredit} leftIcon={movementType === 'DEPOSIT' ? <Banknote size={16} /> : <CreditCard size={16} />}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
