import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FileUp, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import { Textarea } from '@/shared/components/ui/Textarea';
import {
  useBulkUpdateStockWarehouseItems,
  useCreateStockWarehouseItem,
  useImportStockWarehouseItems,
  useStockWarehouseItems,
  useStockWarehouses,
  useUpdateStockWarehouseItem,
} from '@/features/stocks/hooks/stock-warehouses.hooks';
import { StockWarehouseItem, stockWarehouseItemStatuses, StockWarehouseItemStatus } from '@/features/stocks/types/stock-warehouse.types';

export default function StockWarehouseItemsPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', warehouseId: '', status: '' as StockWarehouseItemStatus | '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isItemOpen, setItemOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [code, setCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [pin, setPin] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState('');

  const { data: itemsResponse, isLoading } = useStockWarehouseItems(params);
  const { data: warehousesResponse } = useStockWarehouses({ page: 1, limit: 300 });
  const { mutate: createItem, isPending: isCreating } = useCreateStockWarehouseItem();
  const { mutate: importItems, isPending: isImporting } = useImportStockWarehouseItems();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateStockWarehouseItem();
  const { mutate: bulkUpdate, isPending: isBulkUpdating } = useBulkUpdateStockWarehouseItems();
  const items = itemsResponse?.data || [];

  useEffect(() => {
    setPageTitle(t('stocks.warehouses.itemsTitle'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('stocks.title') }, { label: t('stocks.warehouses.itemsTitle') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const warehouseOptions = useMemo(
    () => [
      { value: '', label: t('stocks.warehouses.allWarehouses') },
      ...(warehousesResponse?.data || []).map((warehouse) => ({ value: warehouse._id, label: warehouse.name })),
    ],
    [warehousesResponse?.data, t]
  );

  const resetForm = () => {
    setWarehouseId('');
    setCode('');
    setSerialNumber('');
    setPin('');
    setCostPrice('');
    setExpiresAt('');
    setNotes('');
    setLines('');
  };

  const submitItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createItem(
      { warehouseId, code, serialNumber, pin, costPrice: costPrice ? Number(costPrice) : undefined, expiresAt, notes },
      { onSuccess: () => { resetForm(); setItemOpen(false); } }
    );
  };

  const submitImport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    importItems(
      { warehouseId, lines, costPrice: costPrice ? Number(costPrice) : undefined, expiresAt, notes },
      { onSuccess: () => { resetForm(); setImportOpen(false); } }
    );
  };

  const toggleSelected = (itemId: string) => {
    setSelectedIds((current) => (current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]));
  };
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item._id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds((current) => current.filter((id) => !items.some((item) => item._id === id)));
    else setSelectedIds((current) => Array.from(new Set([...current, ...items.map((item) => item._id)])));
  };

  const bulkSet = (data: { status?: StockWarehouseItemStatus; isDeleted?: boolean }) => {
    bulkUpdate({ ids: selectedIds, ...data }, { onSuccess: () => setSelectedIds([]) });
  };

  const columns = [
    {
      key: 'select',
      header: <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t('stocks.warehouses.selectAllItems')} className="h-4 w-4 rounded border-slate-300" />,
      render: (item: StockWarehouseItem) => <input type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => toggleSelected(item._id)} aria-label={t('stocks.warehouses.selectItem')} className="h-4 w-4 rounded border-slate-300" />,
    },
    { key: 'warehouse', header: t('stocks.warehouses.title'), render: (item: StockWarehouseItem) => (typeof item.warehouseId === 'string' ? '-' : item.warehouseId.name) },
    { key: 'code', header: t('stocks.warehouses.code'), render: (item: StockWarehouseItem) => <span className="font-mono">{item.code}</span> },
    { key: 'serialNumber', header: t('stocks.warehouses.serialNumber'), render: (item: StockWarehouseItem) => item.serialNumber || '-' },
    { key: 'pin', header: t('stocks.warehouses.pin'), render: (item: StockWarehouseItem) => item.pin || '-' },
    { key: 'status', header: t('stocks.warehouses.status'), render: (item: StockWarehouseItem) => <Badge variant="outline">{t(`stocks.warehouseItemStatuses.${item.status}`)}</Badge> },
    { key: 'costPrice', header: t('stocks.products.costPrice'), render: (item: StockWarehouseItem) => item.costPrice },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (item: StockWarehouseItem) => (
        <div className="flex gap-2">
          <Select value={item.status} options={stockWarehouseItemStatuses.map((status) => ({ value: status, label: t(`stocks.warehouseItemStatuses.${status}`) }))} onChange={(event) => updateItem({ id: item._id, data: { status: event.target.value as StockWarehouseItemStatus } })} className="w-36" />
          <Button type="button" size="sm" variant="ghost" onClick={() => updateItem({ id: item._id, data: { isDeleted: true } })} disabled={isUpdating} aria-label={t('common.delete')} title={t('common.delete')}><Trash2 size={16} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.warehouses.itemsTitle')} description={t('stocks.warehouses.itemsDescription')} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('stocks.warehouses.itemsTitle')}</h1>
          <p className="text-sm text-slate-500">{t('stocks.warehouses.itemsDescription')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button type="button" variant="outline" onClick={() => bulkSet({ status: 'DISABLED' })} isLoading={isBulkUpdating}>{t('stocks.warehouses.disableSelected')}</Button>
              <Button type="button" variant="danger" onClick={() => bulkSet({ isDeleted: true })} isLoading={isBulkUpdating}>{t('stocks.warehouses.deleteSelected')}</Button>
            </>
          )}
          <Button type="button" variant="outline" onClick={() => setImportOpen(true)} leftIcon={<FileUp size={16} />}>{t('stocks.warehouses.importItems')}</Button>
          <Button type="button" onClick={() => setItemOpen(true)} leftIcon={<Plus size={16} />}>{t('stocks.warehouses.addItem')}</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Input value={params.search} onChange={(event) => setParams((current) => ({ ...current, search: event.target.value, page: 1 }))} placeholder={t('common.search')} />
        <Select value={params.warehouseId} options={warehouseOptions} onChange={(event) => setParams((current) => ({ ...current, warehouseId: event.target.value, page: 1 }))} />
        <Select value={params.status} options={[{ value: '', label: t('common.all') }, ...stockWarehouseItemStatuses.map((status) => ({ value: status, label: t(`stocks.warehouseItemStatuses.${status}`) }))]} onChange={(event) => setParams((current) => ({ ...current, status: event.target.value as StockWarehouseItemStatus | '', page: 1 }))} />
        <Select value={String(params.limit)} options={[10, 50, 100, 300].map((item) => ({ value: item, label: String(item) }))} onChange={(event) => setParams((current) => ({ ...current, limit: Number(event.target.value), page: 1 }))} />
      </div>

      <Table columns={columns} data={items} isLoading={isLoading} emptyMessage={t('stocks.warehouses.itemsEmpty')} getRowKey={(item) => item._id} />
      <Pagination total={itemsResponse?.meta?.total ?? 0} page={params.page} limit={params.limit} onChange={(page) => setParams((current) => ({ ...current, page }))} />

      <Modal isOpen={isItemOpen} onClose={() => { resetForm(); setItemOpen(false); }} title={t('stocks.warehouses.addItem')} size="lg">
        <form onSubmit={submitItem} className="space-y-4">
          <Select label={t('stocks.warehouses.title')} value={warehouseId} options={warehouseOptions} onChange={(event) => setWarehouseId(event.target.value)} required />
          <Input label={t('stocks.warehouses.code')} value={code} onChange={(event) => setCode(event.target.value)} required />
          <Input label={t('stocks.warehouses.serialNumber')} value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} />
          <Input label={t('stocks.warehouses.pin')} value={pin} onChange={(event) => setPin(event.target.value)} />
          <Input label={t('stocks.products.costPrice')} type="number" min="0" step="0.0001" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} />
          <Input label={t('stocks.warehouses.expiresAt')} type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          <Textarea label={t('stocks.warehouses.notes')} value={notes} onChange={(event) => setNotes(event.target.value)} />
          <div className="flex justify-end"><Button type="submit" isLoading={isCreating}>{t('common.save')}</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isImportOpen} onClose={() => { resetForm(); setImportOpen(false); }} title={t('stocks.warehouses.importItems')} size="lg">
        <form onSubmit={submitImport} className="space-y-4">
          <Select label={t('stocks.warehouses.title')} value={warehouseId} options={warehouseOptions} onChange={(event) => setWarehouseId(event.target.value)} required />
          <Textarea label={t('stocks.warehouses.lines')} value={lines} onChange={(event) => setLines(event.target.value)} required rows={10} />
          <Input label={t('stocks.products.costPrice')} type="number" min="0" step="0.0001" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} />
          <Input label={t('stocks.warehouses.expiresAt')} type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          <Textarea label={t('stocks.warehouses.notes')} value={notes} onChange={(event) => setNotes(event.target.value)} />
          <div className="flex justify-end"><Button type="submit" isLoading={isImporting}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
