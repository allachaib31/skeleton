import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Plus, Search, Trash2, Users } from 'lucide-react';
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
import { FileUpload } from '@/shared/components/forms/FileUpload';
import { countries, getCountryByIso, getCountryName } from '@/shared/constants/countries';
import { useAdminClients, useCreateAdminClient, useSoftDeleteAdminClient, useUpdateAdminClient } from '@/features/clients/hooks/clients.hooks';
import { AdminClient, ClientStatus } from '@/features/clients/types/client.types';
import { useLanguageStore } from '@/app/stores/language.store';

const statusOptions: ClientStatus[] = ['active', 'inactive', 'banned', 'pending_verification'];

export default function ClientsPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' });
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AdminClient | null>(null);
  const [form, setForm] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    countryCode: '+213',
    countryIso: 'DZ',
    countryFlag: '🇩🇿',
    status: 'active' as ClientStatus,
    password: '',
    referralClientId: '',
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const { data: clientsResponse, isLoading } = useAdminClients(params);
  const { data: referralResponse } = useAdminClients({ page: 1, limit: 300, search: '' });
  const { mutate: createClient, isPending } = useCreateAdminClient();
  const { mutate: updateClient, isPending: isUpdating } = useUpdateAdminClient();
  const { mutate: softDeleteClient, isPending: isDeleting } = useSoftDeleteAdminClient();

  useEffect(() => {
    setPageTitle(t('clients.title'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('clients.title') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const referralOptions = useMemo(
    () => [
      { value: '', label: t('clients.noReferral') },
      ...(referralResponse?.data || []).map((client) => ({ value: client._id, label: `${client.name} (${client.email})` })),
    ],
    [referralResponse?.data, t]
  );

  const countryOptions = useMemo(
    () => countries.map((country) => ({
      value: country.iso,
      label: `${country.flag} ${getCountryName(country.iso, language)} (${country.callingCode})`,
    })),
    [language]
  );

  const resetForm = () => {
    setForm({
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      countryCode: '+213',
      countryIso: 'DZ',
      countryFlag: '🇩🇿',
      status: 'active',
      password: '',
      referralClientId: '',
    });
    setAvatar(null);
    setUploadKey((key) => key + 1);
  };

  const closeModal = () => {
    resetForm();
    setEditingClient(null);
    setIsOpen(false);
  };

  const updateForm = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const openEditModal = (client: AdminClient) => {
    setEditingClient(client);
    setForm({
      email: client.email,
      username: client.username || '',
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      phoneNumber: client.phoneNumber || '',
      countryCode: client.countryCode || '+213',
      countryIso: client.countryIso || 'DZ',
      countryFlag: client.countryFlag || '🇩🇿',
      status: client.status,
      password: '',
      referralClientId: client.referralClientId?._id || '',
    });
    setAvatar(null);
    setUploadKey((key) => key + 1);
    setIsOpen(true);
  };

  const updateCountry = (countryIso: string) => {
    const country = getCountryByIso(countryIso);
    if (!country) return;
    setForm((current) => ({
      ...current,
      countryIso: country.iso,
      countryCode: country.callingCode,
      countryFlag: country.flag,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingClient) {
      updateClient({ id: editingClient._id, data: { ...form, avatar, password: form.password || undefined } }, { onSuccess: closeModal });
      return;
    }
    createClient({ ...form, avatar }, { onSuccess: closeModal });
  };

  const columns = [
    {
      key: 'client',
      header: t('clients.client'),
      render: (client: AdminClient) => (
        <div className="flex items-center gap-3">
          <Avatar src={client.avatar} name={client.name} size="sm" />
          <div>
            <div className="font-bold text-sm">{client.name}</div>
            <div className="text-xs text-slate-500">{client.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'username', header: t('clients.username'), render: (client: AdminClient) => client.username || '-' },
    { key: 'phone', header: t('clients.phone'), render: (client: AdminClient) => `${client.countryFlag || ''} ${client.countryCode || ''} ${client.phoneNumber || ''}` },
    { key: 'balance', header: t('clients.balance'), render: (client: AdminClient) => `$${(client.balance || 0).toFixed(2)}` },
    { key: 'openCredit', header: t('clients.openCredit'), render: (client: AdminClient) => `$${(client.openCredit || 0).toFixed(2)}` },
    { key: 'invitationCode', header: t('clients.invitationCode'), render: (client: AdminClient) => client.invitationCode || '-' },
    { key: 'status', header: t('runtime.status'), render: (client: AdminClient) => <Badge variant={client.status === 'active' ? 'success' : 'outline'}>{t(`clients.statuses.${client.status}`)}</Badge> },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (client: AdminClient) => (
        <div className="flex items-center gap-2">
          <Link to={`/admin/clients/${client._id}`}>
            <Button variant="ghost" size="sm"><Eye size={16} /></Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => openEditModal(client)}><Edit size={16} /></Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => softDeleteClient(client._id)} disabled={isDeleting}><Trash2 size={16} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('clients.title')} description={t('clients.description')} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={24} />
          <h1 className="text-2xl font-bold">{t('clients.title')}</h1>
        </div>
        <Button onClick={() => { resetForm(); setIsOpen(true); }} leftIcon={<Plus size={18} />}>{t('clients.create')}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Input placeholder={t('clients.search')} leftIcon={<Search size={18} />} value={params.search} onChange={(event) => setParams({ ...params, search: event.target.value, page: 1 })} />
        </div>
        <Select
          value={params.status}
          options={[{ value: '', label: t('clients.allStatuses') }, ...statusOptions.map((status) => ({ value: status, label: t(`clients.statuses.${status}`) }))]}
          onChange={(event) => setParams({ ...params, status: event.target.value, page: 1 })}
        />
        <Select
          value={String(params.limit)}
          options={[10, 50, 100, 300].map((value) => ({ value, label: String(value) }))}
          onChange={(event) => setParams({ ...params, limit: Number(event.target.value), page: 1 })}
        />
      </div>

      <Table columns={columns} data={clientsResponse?.data || []} isLoading={isLoading} getRowKey={(client) => client._id} />
      <Pagination total={clientsResponse?.meta?.total ?? 0} page={params.page} limit={params.limit} onChange={(page) => setParams({ ...params, page })} />

      <Modal isOpen={isOpen} onClose={closeModal} title={editingClient ? t('clients.update') : t('clients.create')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input type="email" label={t('clients.email')} value={form.email} onChange={(event) => updateForm('email', event.target.value)} required />
            <Input label={t('clients.username')} value={form.username} onChange={(event) => updateForm('username', event.target.value)} required />
            <Input label={t('clients.firstName')} value={form.firstName} onChange={(event) => updateForm('firstName', event.target.value)} required />
            <Input label={t('clients.lastName')} value={form.lastName} onChange={(event) => updateForm('lastName', event.target.value)} required />
            <Select label={t('clients.countryCode')} value={form.countryIso} options={countryOptions} onChange={(event) => updateCountry(event.target.value)} />
            <Input label={t('clients.phoneNumber')} value={form.phoneNumber} onChange={(event) => updateForm('phoneNumber', event.target.value)} required />
            <Select label={t('runtime.status')} value={form.status} options={statusOptions.map((status) => ({ value: status, label: t(`clients.statuses.${status}`) }))} onChange={(event) => updateForm('status', event.target.value)} />
            <Input type="password" label={t('clients.password')} value={form.password} onChange={(event) => updateForm('password', event.target.value)} required={!editingClient} />
            <div className="md:col-span-2">
              <Select label={t('clients.referralClient')} value={form.referralClientId} options={referralOptions} onChange={(event) => updateForm('referralClientId', event.target.value)} />
            </div>
          </div>
          <FileUpload key={uploadKey} accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024} onFile={setAvatar} onClear={() => setAvatar(null)} />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending || isUpdating}>{editingClient ? t('clients.update') : t('clients.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
