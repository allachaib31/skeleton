import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, ImageIcon, Layers3, Plus, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import { FileUpload } from '@/shared/components/forms/FileUpload';
import { RichTextEditorField } from '@/shared/components/forms/RichTextEditorField';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';
import { StockProductGroup } from '@/features/stocks/types/stock-product-group.types';
import { StockProduct } from '@/features/stocks/types/stock-product.types';
import { useCreateStockProductGroup, useStockProductGroups } from '@/features/stocks/hooks/stock-product-groups.hooks';
import { useBulkUpdateStockProducts, useStockProducts } from '@/features/stocks/hooks/stock-products.hooks';

const emptyLocalizedText: LocalizedText = { en: '', fr: '', ar: '' };
const supportedLanguages = ['en', 'fr', 'ar'] as const;
const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 300, label: '300' },
];

export default function StockProductGroupsPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState<LocalizedText>(emptyLocalizedText);
  const [description, setDescription] = useState<LocalizedText>(emptyLocalizedText);
  const [image, setImage] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imageUploadKey, setImageUploadKey] = useState(0);
  const [coverUploadKey, setCoverUploadKey] = useState(0);
  const [openedGroup, setOpenedGroup] = useState<StockProductGroup | null>(null);
  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(10);
  const [search, setSearch] = useState('');

  const { data: groupsResponse, isLoading } = useStockProductGroups({ page, limit, search });
  const { data: groupProductsResponse, isLoading: isGroupProductsLoading } = useStockProducts(
    { page: productsPage, limit: productsLimit, groupId: openedGroup?._id },
    { enabled: Boolean(openedGroup) }
  );
  const { mutate: createGroup, isPending } = useCreateStockProductGroup();
  const { mutate: bulkUpdateProducts, isPending: isRemovingProduct } = useBulkUpdateStockProducts();

  useEffect(() => {
    setPageTitle(t('stocks.productGroups.title'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.productGroups.title') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const getLocalizedValue = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value[key] || value.en;
  };

  const resetForm = () => {
    setName({ ...emptyLocalizedText });
    setDescription({ ...emptyLocalizedText });
    setImage(null);
    setCoverImage(null);
    setImageUploadKey((key) => key + 1);
    setCoverUploadKey((key) => key + 1);
  };

  const closeModal = () => {
    resetForm();
    setIsOpen(false);
  };

  const updateLocalizedField = (
    setter: (value: LocalizedText) => void,
    currentValue: LocalizedText,
    code: keyof LocalizedText,
    value: string
  ) => {
    setter({ ...currentValue, [code]: value });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!image) {
      toast.error(t('stocks.productGroups.imageRequired'));
      return;
    }
    if (!coverImage) {
      toast.error(t('stocks.productGroups.coverImageRequired'));
      return;
    }

    createGroup({ name, description, image, coverImage }, { onSuccess: closeModal });
  };

  const openGroupProducts = (group: StockProductGroup) => {
    setOpenedGroup(group);
    setProductsPage(1);
  };

  const removeProductFromGroup = (product: StockProduct) => {
    bulkUpdateProducts({ ids: [product._id], groupId: '' });
  };

  const columns = [
    {
      key: 'group',
      header: t('stocks.productGroups.group'),
      render: (group: StockProductGroup) => (
        <div className="flex items-center gap-3">
          {group.image?.secureUrl ? (
            <img src={group.image.secureUrl} alt={getLocalizedValue(group.name)} className="h-12 w-12 rounded-md object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-background/50">
              <ImageIcon size={18} className="text-slate-400" />
            </div>
          )}
          <div>
            <div className="font-bold">{getLocalizedValue(group.name)}</div>
            <div className="max-w-md truncate text-xs text-slate-400">{stripHtml(getLocalizedValue(group.description))}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'coverImage',
      header: t('stocks.productGroups.coverImage'),
      render: (group: StockProductGroup) => (
        <img src={group.coverImage.secureUrl} alt={getLocalizedValue(group.name)} className="h-14 w-28 rounded-md object-cover" />
      ),
    },
    {
      key: 'createdAt',
      header: t('runtime.created'),
      render: (group: StockProductGroup) => new Date(group.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (group: StockProductGroup) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0"
          title={t('stocks.productGroups.open')}
          aria-label={t('stocks.productGroups.open')}
          onClick={() => openGroupProducts(group)}
        >
          <Eye size={16} />
        </Button>
      ),
    },
  ];

  const productColumns = [
    {
      key: 'product',
      header: t('stocks.products.product'),
      render: (product: StockProduct) => (
        <div className="flex items-center gap-3">
          {product.image?.secureUrl ? (
            <img src={product.image.secureUrl} alt={getLocalizedValue(product.name)} className="h-11 w-11 rounded-md object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-background/50">
              <ImageIcon size={16} className="text-slate-400" />
            </div>
          )}
          <div>
            <div className="font-bold">{getLocalizedValue(product.name)}</div>
            <div className="max-w-sm truncate text-xs text-slate-400">{stripHtml(getLocalizedValue(product.description))}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('stocks.products.status'),
      render: (product: StockProduct) => (
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {product.isVisible ? t('stocks.products.visible') : t('stocks.products.hidden')}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {product.isDeleted ? t('stocks.products.softDeleted') : t('stocks.products.active')}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (product: StockProduct) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0 text-red-500 hover:text-red-600"
          title={t('stocks.productGroups.removeProduct')}
          aria-label={t('stocks.productGroups.removeProduct')}
          isLoading={isRemovingProduct}
          onClick={() => removeProductFromGroup(product)}
        >
          <Unlink size={16} />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.productGroups.title')} description={t('stocks.productGroups.description')} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('stocks.productGroups.title')}</h1>
          <Layers3 size={24} className="text-primary" />
        </div>
        <Button onClick={() => setIsOpen(true)} leftIcon={<Plus size={18} />}>
          {t('stocks.productGroups.create')}
        </Button>
      </div>

      <div className="rounded-lg border border-slate-800 bg-background/40 p-4">
        <Input
          label={t('common.search')}
          value={search}
          placeholder={t('stocks.productGroups.searchPlaceholder')}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <Table columns={columns} data={groupsResponse?.data || []} isLoading={isLoading} getRowKey={(group) => group._id} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{t('stocks.productGroups.rowsPerPage')}</span>
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

      <Modal isOpen={isOpen} onClose={closeModal} title={t('stocks.productGroups.create')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {supportedLanguages.map((code) => (
              <Input
                key={code}
                label={t('stocks.productGroups.nameByLanguage', { language: t(`stocks.languages.${code}`) })}
                value={name[code]}
                onChange={(event) => updateLocalizedField(setName, name, code, event.target.value)}
                required
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {supportedLanguages.map((code) => (
              <RichTextEditorField
                key={code}
                label={t('stocks.productGroups.descriptionByLanguage', { language: t(`stocks.languages.${code}`) })}
                value={description[code]}
                onChange={(value) => updateLocalizedField(setDescription, description, code, value)}
                required
                toolbarLabels={{
                  bold: t('common.richText.bold'),
                  italic: t('common.richText.italic'),
                  underline: t('common.richText.underline'),
                  heading: t('common.richText.heading'),
                  bulletList: t('common.richText.bulletList'),
                  orderedList: t('common.richText.orderedList'),
                  undo: t('common.richText.undo'),
                  redo: t('common.richText.redo'),
                }}
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <h2 className="font-bold">{t('stocks.productGroups.image')}</h2>
              <FileUpload key={imageUploadKey} accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024} onFile={setImage} onClear={() => setImage(null)} />
            </div>
            <div className="space-y-2">
              <h2 className="font-bold">{t('stocks.productGroups.coverImage')}</h2>
              <FileUpload key={coverUploadKey} accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024} onFile={setCoverImage} onClear={() => setCoverImage(null)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending}>{t('stocks.productGroups.create')}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(openedGroup)}
        onClose={() => setOpenedGroup(null)}
        title={openedGroup ? t('stocks.productGroups.relatedProducts', { group: getLocalizedValue(openedGroup.name) }) : ''}
        size="xl"
      >
        <div className="space-y-4">
          <Table
            columns={productColumns}
            data={groupProductsResponse?.data || []}
            isLoading={isGroupProductsLoading}
            getRowKey={(product) => product._id}
            emptyMessage={t('stocks.productGroups.noProducts')}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">{t('stocks.productGroups.rowsPerPage')}</span>
              <Select
                value={String(productsLimit)}
                options={pageSizeOptions}
                onChange={(event) => {
                  setProductsLimit(Number(event.target.value));
                  setProductsPage(1);
                }}
                className="w-28"
              />
            </div>
            <Pagination total={groupProductsResponse?.meta?.total ?? 0} page={productsPage} limit={productsLimit} onChange={setProductsPage} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
