import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Coins, Edit, ImageIcon } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Input } from '@/shared/components/ui/Input';
import { Switch } from '@/shared/components/ui/Switch';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Table } from '@/shared/components/ui/Table';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { FileUpload } from '@/shared/components/forms/FileUpload';
import { toast } from 'sonner';
import {
  useCreateSettingsCurrency,
  useSettingsCurrencies,
  useUpdateSettingsCurrency,
} from '@/features/settings/hooks/settings.hooks';
import { SettingsCurrency } from '@/features/settings/types/settings.types';

const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 300, label: '300' },
];

export default function SettingsCurrenciesPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<SettingsCurrency | null>(null);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [price, setPrice] = useState('');
  const [priceBuy, setPriceBuy] = useState('');
  const [isDollar, setIsDollar] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);
  const [icon, setIcon] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const { data: currenciesResponse, isLoading } = useSettingsCurrencies({ page, limit });
  const { mutate: createCurrency, isPending } = useCreateSettingsCurrency();
  const { mutate: updateCurrency, isPending: isUpdating } = useUpdateSettingsCurrency();

  useEffect(() => {
    setPageTitle(t('adminSettings.currencies.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('adminSettings.title') },
      { label: t('adminSettings.currencies.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const resetForm = () => {
    setName('');
    setShortName('');
    setPrice('');
    setPriceBuy('');
    setIsDollar(false);
    setIsVisible(true);
    setIsDeleted(false);
    setIcon(null);
    setUploadKey((key) => key + 1);
  };

  const closeModal = () => {
    resetForm();
    setEditingCurrency(null);
    setIsOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingCurrency(null);
    setIsOpen(true);
  };

  const openEditModal = (currency: SettingsCurrency) => {
    setName(currency.name);
    setShortName(currency.shortName);
    setPrice(String(currency.price));
    setPriceBuy(String(currency.priceBuy));
    setIsDollar(currency.isDollar);
    setIsVisible(currency.isVisible);
    setIsDeleted(currency.isDeleted);
    setIcon(null);
    setUploadKey((key) => key + 1);
    setEditingCurrency(currency);
    setIsOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCurrency && !icon) {
      toast.error(t('adminSettings.currencies.iconRequired'));
      return;
    }

    const payload = {
      name,
      shortName,
      price: Number(price),
      priceBuy: Number(priceBuy),
      isDollar,
      isVisible,
      isDeleted,
      icon,
    };

    if (editingCurrency) {
      updateCurrency({ id: editingCurrency._id, data: payload }, { onSuccess: closeModal });
      return;
    }

    createCurrency({ ...payload, icon: icon! }, { onSuccess: closeModal });
  };

  const columns = [
    {
      key: 'currency',
      header: t('adminSettings.currencies.currency'),
      render: (currency: SettingsCurrency) => (
        <div className="flex items-center gap-3">
          {currency.icon?.secureUrl ? (
            <img src={currency.icon.secureUrl} alt={currency.name} className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-background/50">
              <ImageIcon size={18} className="text-slate-400" />
            </div>
          )}
          <div>
            <div className="font-bold">{currency.name}</div>
            <div className="text-xs text-slate-400">{currency.shortName}</div>
          </div>
        </div>
      ),
    },
    { key: 'price', header: t('adminSettings.currencies.price'), render: (currency: SettingsCurrency) => currency.price },
    { key: 'priceBuy', header: t('adminSettings.currencies.priceBuy'), render: (currency: SettingsCurrency) => currency.priceBuy },
    {
      key: 'isDollar',
      header: t('adminSettings.currencies.dollar'),
      render: (currency: SettingsCurrency) => <Badge variant={currency.isDollar ? 'success' : 'outline'}>{currency.isDollar ? t('runtime.yes') : t('runtime.no')}</Badge>,
    },
    {
      key: 'visibility',
      header: t('adminSettings.visibility'),
      render: (currency: SettingsCurrency) => <Badge variant={currency.isVisible ? 'success' : 'default'}>{currency.isVisible ? t('adminSettings.visible') : t('adminSettings.hidden')}</Badge>,
    },
    {
      key: 'deleteStatus',
      header: t('adminSettings.deleteStatus'),
      render: (currency: SettingsCurrency) => <Badge variant={currency.isDeleted ? 'danger' : 'outline'}>{currency.isDeleted ? t('adminSettings.softDeleted') : t('adminSettings.active')}</Badge>,
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (currency: SettingsCurrency) => (
        <Button variant="ghost" size="sm" onClick={() => openEditModal(currency)} leftIcon={<Edit size={16} />}>
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('adminSettings.currencies.title')} description={t('adminSettings.currencies.description')} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('adminSettings.currencies.title')}</h1>
          <Coins size={24} className="text-primary" />
        </div>
        <Button onClick={openCreateModal}>{t('adminSettings.currencies.create')}</Button>
      </div>

      <Table columns={columns} data={currenciesResponse?.data || []} isLoading={isLoading} />

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
        <Pagination total={currenciesResponse?.meta?.total ?? 0} page={page} limit={limit} onChange={setPage} />
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} title={editingCurrency ? t('adminSettings.currencies.update') : t('adminSettings.currencies.create')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('adminSettings.currencies.name')} value={name} onChange={(event) => setName(event.target.value)} required />
            <Input label={t('adminSettings.currencies.shortName')} value={shortName} onChange={(event) => setShortName(event.target.value)} required />
            <Input label={t('adminSettings.currencies.price')} type="number" min="0" step="0.0001" value={price} onChange={(event) => setPrice(event.target.value)} required />
            <Input label={t('adminSettings.currencies.priceBuy')} type="number" min="0" step="0.0001" value={priceBuy} onChange={(event) => setPriceBuy(event.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Switch label={t('adminSettings.currencies.isDollar')} checked={isDollar} onChange={(event) => setIsDollar(event.target.checked)} />
            <Switch label={t('adminSettings.show')} checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} />
            <Switch label={t('adminSettings.markDeleted')} checked={isDeleted} onChange={(event) => setIsDeleted(event.target.checked)} />
          </div>
          {editingCurrency?.icon?.secureUrl && !icon && (
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-background/40 p-3">
              <img src={editingCurrency.icon.secureUrl} alt={editingCurrency.name} className="h-12 w-12 rounded-md object-cover" />
              <span className="text-sm text-slate-400">{t('adminSettings.currencies.keepCurrentIcon')}</span>
            </div>
          )}
          <FileUpload key={uploadKey} accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024} onFile={setIcon} onClear={() => setIcon(null)} />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending || isUpdating}>
              {editingCurrency ? t('adminSettings.currencies.update') : t('adminSettings.currencies.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
