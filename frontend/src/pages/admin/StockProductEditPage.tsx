import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, GripVertical, PackageCheck, PlugZap, RefreshCw, Trash2 } from 'lucide-react';
import { SEO } from '@/shared/components/seo/SEO';
import { useUIStore } from '@/app/stores/ui.store';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Switch } from '@/shared/components/ui/Switch';
import { Button } from '@/shared/components/ui/Button';
import { FileUpload } from '@/shared/components/forms/FileUpload';
import { RichTextEditorField } from '@/shared/components/forms/RichTextEditorField';
import { useLanguageStore } from '@/app/stores/language.store';
import { useStockServices } from '@/features/stocks/hooks/stock-services.hooks';
import { useStockCategories } from '@/features/stocks/hooks/stock-categories.hooks';
import { useSettingsApis } from '@/features/settings/hooks/settings.hooks';
import { LocalizedText } from '@/features/stocks/types/stock-service.types';
import { ApiProductImportPreviewRequest, ApiProductImportPreviewRow, productFulfillmentTypes, ProductFulfillmentType, productQuantityModes, ProductQuantityMode, StockProduct, StockProductApiConnection } from '@/features/stocks/types/stock-product.types';
import {
  useActivateStockProductApiConnection,
  useCreateStockProductApiConnection,
  useDeleteStockProductApiConnection,
  usePreviewApiProductsImport,
  useStockProduct,
  useStockProductApiConnections,
  useUpdateStockProduct,
} from '@/features/stocks/hooks/stock-products.hooks';
import { useStockProductRequirements } from '@/features/stocks/hooks/stock-product-requirements.hooks';
import { StockProductRequirement } from '@/features/stocks/types/stock-product-requirement.types';

const emptyLocalizedText: LocalizedText = { en: '', fr: '', ar: '' };
const supportedLanguages = ['en', 'fr', 'ar'] as const;

export default function StockProductEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [activeTab, setActiveTab] = useState<'product' | 'api'>('product');
  const [serviceId, setServiceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState<LocalizedText>(emptyLocalizedText);
  const [serviceNumber, setServiceNumber] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [costManual, setCostManual] = useState('');
  const [forQuantity, setForQuantity] = useState('');
  const [description, setDescription] = useState<LocalizedText>(emptyLocalizedText);
  const [quantityMode, setQuantityMode] = useState<ProductQuantityMode>('WITHOUT_QUANTITY');
  const [minQuantity, setMinQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [customQuantities, setCustomQuantities] = useState('');
  const [speed, setSpeed] = useState('');
  const [startTime, setStartTime] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);
  const [dripfeed, setDripfeed] = useState(false);
  const [refill, setRefill] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [stock, setStock] = useState(true);
  const [fulfillmentType, setFulfillmentType] = useState<ProductFulfillmentType>('MANUAL');
  const [image, setImage] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [selectedRequirementIds, setSelectedRequirementIds] = useState<string[]>([]);
  const [visibleCountryCodes, setVisibleCountryCodes] = useState<string[]>([]);
  const [connectionApiId, setConnectionApiId] = useState('');
  const [selectedProviderProductId, setSelectedProviderProductId] = useState('');
  const [providerProductSearch, setProviderProductSearch] = useState('');
  const [previewRows, setPreviewRows] = useState<ApiProductImportPreviewRow[]>([]);

  const { data: productResponse, isLoading } = useStockProduct(id);
  const product = productResponse?.data;
  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: categoriesResponse } = useStockCategories({ page: 1, limit: 300 });
  const { data: apisResponse } = useSettingsApis({ page: 1, limit: 300 });
  const { data: requirementsResponse } = useStockProductRequirements({ page: 1, limit: 300 });
  const { mutate: updateProduct, isPending } = useUpdateStockProduct();
  const { data: connectionsResponse, isLoading: isLoadingConnections } = useStockProductApiConnections(id);
  const { mutate: previewProducts, isPending: isPreviewing } = usePreviewApiProductsImport();
  const { mutate: createConnection, isPending: isCreatingConnection } = useCreateStockProductApiConnection(id);
  const { mutate: activateConnection, isPending: isActivatingConnection } = useActivateStockProductApiConnection(id);
  const { mutate: deleteConnection, isPending: isDeletingConnection } = useDeleteStockProductApiConnection(id);

  useEffect(() => {
    setPageTitle(t('stocks.products.update'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.products.title'), href: '/admin/stocks/products' },
      { label: t('stocks.products.update') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

  useEffect(() => {
    if (!product) return;
    setServiceId(getProductServiceId(product));
    setCategoryId(getProductCategoryId(product));
    setName({ ...product.name });
    setServiceNumber(product.serviceNumber || '');
    setCostPrice(String(product.costPrice));
    setCostManual(product.costManual !== undefined ? String(product.costManual) : '');
    setForQuantity(String(product.forQuantity));
    setDescription({ ...product.description });
    setQuantityMode(product.quantityMode);
    setMinQuantity(product.minQuantity !== undefined ? String(product.minQuantity) : '');
    setMaxQuantity(product.maxQuantity !== undefined ? String(product.maxQuantity) : '');
    setCustomQuantities(product.customQuantities?.join(',') || '');
    setSpeed(product.speed || '');
    setStartTime(product.startTime || '');
    setQuantityAvailable(product.quantityAvailable);
    setIsVisible(product.isVisible);
    setIsDeleted(product.isDeleted);
    setDripfeed(product.dripfeed);
    setRefill(product.refill);
    setCancel(product.cancel);
    setStock(product.stock);
    setFulfillmentType(product.fulfillmentType || 'MANUAL');
    setSelectedRequirementIds(getProductRequirementIds(product));
    const providerCountries = getProductProviderCountries(product);
    setVisibleCountryCodes(product.visibleCountryCodes !== undefined ? product.visibleCountryCodes : providerCountries.map((country) => country.countryCode));
    setImage(null);
    setUploadKey((key) => key + 1);
  }, [product]);

  const getLocalizedValue = (value: LocalizedText) => {
    const key = language.split('-')[0] as keyof LocalizedText;
    return value[key] || value.en;
  };

  const serviceOptions = useMemo(
    () => (servicesResponse?.data || []).map((service) => ({ value: service._id, label: getLocalizedValue(service.name) })),
    [servicesResponse?.data, language]
  );

  const categoryOptions = useMemo(
    () =>
      (categoriesResponse?.data || [])
        .filter((category) => {
          if (!serviceId) return false;
          return typeof category.serviceId === 'string' ? category.serviceId === serviceId : category.serviceId._id === serviceId;
        })
        .map((category) => ({ value: category._id, label: getLocalizedValue(category.name) })),
    [categoriesResponse?.data, serviceId, language]
  );

  const apiOptions = useMemo(() => (apisResponse?.data || [])
    .filter((api) => api.group !== 'SPECIAL_PROGRAMMING')
    .map((api) => ({ value: api._id, label: `${api.name} - ${t(`adminSettings.apiGroups.${api.group}`)}` })),
  [apisResponse?.data, t]);

  const selectedConnectionApi = useMemo(
    () => (apisResponse?.data || []).find((api) => api._id === connectionApiId),
    [apisResponse?.data, connectionApiId]
  );

  const connections = connectionsResponse?.data || [];
  const productProviderCountries = useMemo(() => getProductProviderCountries(product), [product]);
  const providerProductDatalistId = `provider-products-${id}`;
  const providerProductOptions = useMemo(
    () => previewRows.map((row) => ({
      value: row.providerProductId,
      label: `${row.name} | ${row.costPrice} USD | ${t(`stocks.productQuantityModes.${row.quantityMode}`)}`,
    })),
    [previewRows, t]
  );

  const requirementItems = useMemo(() => {
    const requirements = requirementsResponse?.data || [];
    return [
      ...selectedRequirementIds
        .map((requirementId) => requirements.find((requirement) => requirement._id === requirementId))
        .filter((requirement): requirement is StockProductRequirement => Boolean(requirement)),
      ...requirements.filter((requirement) => !selectedRequirementIds.includes(requirement._id)),
    ];
  }, [requirementsResponse?.data, selectedRequirementIds]);

  const updateLocalizedField = (
    setter: (value: LocalizedText) => void,
    currentValue: LocalizedText,
    code: keyof LocalizedText,
    value: string
  ) => {
    setter({ ...currentValue, [code]: value });
  };

  const toggleRequirement = (requirementId: string, checked: boolean) => {
    setSelectedRequirementIds((current) => {
      if (checked) return current.includes(requirementId) ? current : [...current, requirementId];
      return current.filter((id) => id !== requirementId);
    });
  };

  const handleRequirementReorder = (fromIndex: number, toIndex: number) => {
    setSelectedRequirementIds((current) => {
      const reordered = [...current];
      const [movedRequirement] = reordered.splice(fromIndex, 1);
      if (!movedRequirement) return current;
      reordered.splice(toIndex, 0, movedRequirement);
      return reordered;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProduct(
      {
        id,
        data: {
          serviceId,
          categoryId,
          name,
          serviceNumber: serviceNumber || undefined,
          costPrice: Number(costPrice),
          costManual: fulfillmentType === 'MANUAL' ? Number(costManual) : undefined,
          forQuantity: Number(forQuantity),
          description,
          quantityMode,
          minQuantity: minQuantity ? Number(minQuantity) : undefined,
          maxQuantity: maxQuantity ? Number(maxQuantity) : undefined,
          customQuantities: customQuantities || undefined,
          speed: speed || undefined,
          startTime: startTime || undefined,
          quantityAvailable,
          isVisible,
          isDeleted,
          dripfeed,
          refill,
          cancel,
          stock,
          fulfillmentType,
          requirements: selectedRequirementIds,
          visibleCountryCodes,
          image,
        },
      },
      { onSuccess: () => navigate('/admin/stocks/products') }
    );
  };

  const handlePreviewProviderProducts = () => {
    if (!selectedConnectionApi) return;
    previewProducts(
      { apiId: selectedConnectionApi._id, apiGroup: selectedConnectionApi.group as ApiProductImportPreviewRequest['apiGroup'] },
      {
        onSuccess: (response) => {
          setPreviewRows(response.data || []);
          setSelectedProviderProductId('');
          setProviderProductSearch('');
        },
      }
    );
  };

  const handleCreateConnection = () => {
    if (!connectionApiId || !selectedProviderProductId) return;
    createConnection(
      { apiId: connectionApiId, providerProductId: selectedProviderProductId },
      {
        onSuccess: () => {
          setSelectedProviderProductId('');
          setProviderProductSearch('');
        },
      }
    );
  };

  if (isLoading) {
    return <div className="rounded-xl border border-white/10 bg-secondary p-6 text-sm text-slate-400">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.products.update')} description={t('stocks.products.listDescription')} />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('stocks.products.update')}</h1>
        <PackageCheck size={24} className="text-primary" />
      </div>

      <div className="flex gap-2 rounded-lg border border-white/10 bg-secondary p-1">
        <button
          type="button"
          onClick={() => setActiveTab('product')}
          className={`rounded-md px-4 py-2 text-sm font-bold ${activeTab === 'product' ? 'bg-primary text-primary-foreground' : 'text-slate-300 hover:bg-white/5'}`}
        >
          {t('stocks.products.tabs.product')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={`rounded-md px-4 py-2 text-sm font-bold ${activeTab === 'api' ? 'bg-primary text-primary-foreground' : 'text-slate-300 hover:bg-white/5'}`}
        >
          {t('stocks.products.tabs.api')}
        </button>
      </div>

      {activeTab === 'product' ? (
      <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border border-white/10 bg-secondary p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Select
            label={t('stocks.products.service')}
            value={serviceId}
            options={[{ value: '', label: t('stocks.products.selectService') }, ...serviceOptions]}
            onChange={(event) => {
              setServiceId(event.target.value);
              setCategoryId('');
            }}
            required
          />
          <Select
            label={t('stocks.products.category')}
            value={categoryId}
            options={[{ value: '', label: t('stocks.products.selectCategory') }, ...categoryOptions]}
            onChange={(event) => setCategoryId(event.target.value)}
            required
            disabled={!serviceId}
          />
          <Select
            label={t('stocks.products.fulfillmentType')}
            value={fulfillmentType}
            options={productFulfillmentTypes.map((item) => ({ value: item, label: t(`stocks.productFulfillmentTypes.${item}`) }))}
            onChange={(event) => setFulfillmentType(event.target.value as ProductFulfillmentType)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {supportedLanguages.map((code) => (
            <Input
              key={code}
              label={t('stocks.products.nameByLanguage', { language: t(`stocks.languages.${code}`) })}
              value={name[code]}
              onChange={(event) => updateLocalizedField(setName, name, code, event.target.value)}
              required
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Input label={t('stocks.products.serviceNumber')} value={serviceNumber} onChange={(event) => setServiceNumber(event.target.value)} />
          <Input label={t('stocks.products.costPrice')} type="number" min="0" step="0.0001" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} required />
          {fulfillmentType === 'MANUAL' && (
            <Input label={t('stocks.products.costManual')} type="number" min="0" step="0.0001" value={costManual} onChange={(event) => setCostManual(event.target.value)} required />
          )}
          <Input label={t('stocks.products.forQuantity')} type="number" min="1" step="1" value={forQuantity} onChange={(event) => setForQuantity(event.target.value)} required />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {supportedLanguages.map((code) => (
            <RichTextEditorField
              key={code}
              label={t('stocks.products.descriptionByLanguage', { language: t(`stocks.languages.${code}`) })}
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

        <div className="grid gap-6 lg:grid-cols-3">
          <Select
            label={t('stocks.products.quantityMode')}
            value={quantityMode}
            options={productQuantityModes.map((mode) => ({ value: mode, label: t(`stocks.productQuantityModes.${mode}`) }))}
            onChange={(event) => setQuantityMode(event.target.value as ProductQuantityMode)}
          />
          {(quantityMode === 'QUANTITY' || quantityMode === 'COUNTER') && (
            <>
              <Input label={t('stocks.products.minQuantity')} type="number" min="0" value={minQuantity} onChange={(event) => setMinQuantity(event.target.value)} required />
              <Input label={t('stocks.products.maxQuantity')} type="number" min="0" value={maxQuantity} onChange={(event) => setMaxQuantity(event.target.value)} required />
            </>
          )}
          {quantityMode === 'CUSTOMIZE' && (
            <Input
              label={t('stocks.products.customQuantities')}
              value={customQuantities}
              onChange={(event) => setCustomQuantities(event.target.value)}
              placeholder={t('stocks.products.customQuantitiesPlaceholder')}
              required
            />
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Input label={t('stocks.products.speed')} value={speed} onChange={(event) => setSpeed(event.target.value)} />
          <Input label={t('stocks.products.startTime')} value={startTime} onChange={(event) => setStartTime(event.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          <Switch label={t('stocks.products.quantityAvailable')} checked={quantityAvailable} onChange={(event) => setQuantityAvailable(event.target.checked)} />
          <Switch label={t('adminSettings.show')} checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} />
          <Switch label={t('adminSettings.markDeleted')} checked={isDeleted} onChange={(event) => setIsDeleted(event.target.checked)} />
          <Switch label={t('stocks.products.dripfeed')} checked={dripfeed} onChange={(event) => setDripfeed(event.target.checked)} />
          <Switch label={t('stocks.products.refill')} checked={refill} onChange={(event) => setRefill(event.target.checked)} />
          <Switch label={t('stocks.products.cancel')} checked={cancel} onChange={(event) => setCancel(event.target.checked)} />
          <Switch label={t('stocks.products.stock')} checked={stock} onChange={(event) => setStock(event.target.checked)} />
        </div>

        {productProviderCountries.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">{t('stocks.products.visibleCountries')}</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setVisibleCountryCodes(productProviderCountries.map((country) => country.countryCode))}
                >
                  {t('stocks.products.selectAllCountries')}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setVisibleCountryCodes([])}>
                  {t('stocks.products.clearCountries')}
                </Button>
              </div>
            </div>
            <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-white/10 bg-background/30 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {productProviderCountries.map((country) => {
                const checked = visibleCountryCodes.includes(country.countryCode);
                return (
                  <label key={country.countryCode} className="flex items-center gap-3 rounded-md border border-white/10 bg-secondary/50 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setVisibleCountryCodes((current) => {
                          if (event.target.checked) return current.includes(country.countryCode) ? current : [...current, country.countryCode];
                          return current.filter((code) => code !== country.countryCode);
                        });
                      }}
                      className="h-4 w-4 accent-primary"
                    />
                    {country.flag && <img src={country.flag} alt={country.countryName} className="h-5 w-7 rounded-sm object-cover" />}
                    <span className="truncate">{country.countryName}</span>
                    <span className="ml-auto text-xs text-slate-500">{country.countryCode}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="font-bold">{t('stocks.products.requirements')}</h2>
          <div className="overflow-hidden rounded-lg border border-white/10">
            {requirementItems.length === 0 ? (
              <div className="p-4 text-sm text-slate-400">{t('stocks.products.noRequirements')}</div>
            ) : (
              <div className="divide-y divide-white/10">
                {requirementItems.map((requirement) => {
                  const selectedIndex = selectedRequirementIds.indexOf(requirement._id);
                  const isChecked = selectedIndex !== -1;
                  return (
                    <div
                      key={requirement._id}
                      draggable={isChecked}
                      onDragStart={(event) => {
                        if (!isChecked) return;
                        event.dataTransfer.setData('text/plain', String(selectedIndex));
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(event) => {
                        if (isChecked) event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (!isChecked) return;
                        event.preventDefault();
                        const fromIndex = Number(event.dataTransfer.getData('text/plain'));
                        if (!Number.isNaN(fromIndex) && fromIndex !== selectedIndex) {
                          handleRequirementReorder(fromIndex, selectedIndex);
                        }
                      }}
                      className="grid gap-3 bg-background/30 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className={isChecked ? 'text-slate-400' : 'text-slate-700'} />
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => toggleRequirement(requirement._id, event.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                      </div>
                      <div>
                        <div className="font-bold">{requirement.paramsName}</div>
                        <div className="text-sm text-slate-400">{getLocalizedValue(requirement.message)}</div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {isChecked ? t('stocks.products.requirementSortOrder', { order: selectedIndex + 1 }) : t('stocks.products.notSelected')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-bold">{t('stocks.products.image')}</h2>
          {product?.image?.secureUrl && !image && (
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-background/40 p-3">
              <img src={product.image.secureUrl} alt={getLocalizedValue(product.name)} className="h-12 w-12 rounded-md object-cover" />
              <span className="text-sm text-slate-400">{t('stocks.products.keepCurrentImage')}</span>
            </div>
          )}
          <FileUpload key={uploadKey} accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024} onFile={setImage} onClear={() => setImage(null)} />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/stocks/products')}>{t('common.cancel')}</Button>
          <Button type="submit" isLoading={isPending}>{t('stocks.products.update')}</Button>
        </div>
      </form>
      ) : (
        <div className="space-y-6 rounded-xl border border-white/10 bg-secondary p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{t('stocks.products.apiConnections.title')}</h2>
            <PlugZap size={22} className="text-primary" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <Select
              label={t('stocks.products.apiConnections.api')}
              value={connectionApiId}
              options={[{ value: '', label: t('stocks.products.apiConnections.selectApi') }, ...apiOptions]}
              onChange={(event) => {
                setConnectionApiId(event.target.value);
                setPreviewRows([]);
                setSelectedProviderProductId('');
                setProviderProductSearch('');
              }}
            />
            <Button type="button" onClick={handlePreviewProviderProducts} isLoading={isPreviewing} disabled={!connectionApiId} leftIcon={<RefreshCw size={16} />}>
              {t('stocks.products.apiConnections.loadProducts')}
            </Button>
          </div>

          {previewRows.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <Input
                label={t('stocks.products.apiConnections.providerProduct')}
                value={providerProductSearch}
                list={providerProductDatalistId}
                placeholder={t('stocks.products.apiConnections.selectProviderProduct')}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const selected = providerProductOptions.find((option) => option.label === nextValue);
                  setProviderProductSearch(nextValue);
                  setSelectedProviderProductId(selected?.value || '');
                }}
              />
              <datalist id={providerProductDatalistId}>
                {providerProductOptions.map((option) => (
                  <option key={option.value} value={option.label} />
                ))}
              </datalist>
              <Button type="button" onClick={handleCreateConnection} isLoading={isCreatingConnection} disabled={!selectedProviderProductId}>
                {t('stocks.products.apiConnections.addConnection')}
              </Button>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-background/50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">{t('stocks.products.apiConnections.status')}</th>
                  <th className="px-4 py-3">{t('stocks.products.apiConnections.api')}</th>
                  <th className="px-4 py-3">{t('stocks.products.apiConnections.providerProduct')}</th>
                  <th className="px-4 py-3">{t('stocks.products.costPrice')}</th>
                  <th className="px-4 py-3">{t('stocks.products.forQuantity')}</th>
                  <th className="px-4 py-3">{t('stocks.products.quantityMode')}</th>
                  <th className="px-4 py-3">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoadingConnections ? (
                  <tr><td className="px-4 py-6 text-slate-400" colSpan={7}>{t('common.loading')}</td></tr>
                ) : connections.length === 0 ? (
                  <tr><td className="px-4 py-6 text-slate-400" colSpan={7}>{t('stocks.products.apiConnections.empty')}</td></tr>
                ) : connections.map((connection) => (
                  <tr key={connection._id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${connection.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                        {connection.isActive ? t('stocks.products.apiConnections.active') : t('stocks.products.apiConnections.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getConnectionApiName(connection)}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold">{String(connection.apiPayload?.name || connection.apiProductId)}</div>
                      <div className="text-xs text-slate-400">{connection.apiProductId}</div>
                    </td>
                    <td className="px-4 py-3">{connection.costPrice}</td>
                    <td className="px-4 py-3">{connection.forQuantity}</td>
                    <td className="px-4 py-3">{t(`stocks.productQuantityModes.${connection.quantityMode}`)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!connection.isActive && !connection.isLegacy && (
                          <Button type="button" size="sm" onClick={() => activateConnection(connection._id)} isLoading={isActivatingConnection} leftIcon={<CheckCircle2 size={15} />}>
                            {t('stocks.products.apiConnections.activate')}
                          </Button>
                        )}
                        {!connection.isLegacy && (
                          <Button type="button" size="sm" variant="danger" onClick={() => deleteConnection(connection._id)} isLoading={isDeletingConnection} disabled={connection.isActive} leftIcon={<Trash2 size={15} />}>
                            {t('common.delete')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const getProductServiceId = (product: StockProduct) =>
  typeof product.serviceId === 'string' ? product.serviceId : product.serviceId._id;

const getProductCategoryId = (product: StockProduct) =>
  typeof product.categoryId === 'string' ? product.categoryId : product.categoryId._id;

const getProductRequirementIds = (product: StockProduct) =>
  (product.requirements || []).map((requirement) => (typeof requirement === 'string' ? requirement : requirement._id));

const getConnectionApiName = (connection: StockProductApiConnection) =>
  typeof connection.apiId === 'string' ? connection.apiId : connection.apiId.name;

interface ProductProviderCountry {
  countryCode: string;
  countryName: string;
  flag?: string;
}

const getProductProviderCountries = (product?: StockProduct): ProductProviderCountry[] => {
  const countries = product?.apiPayload?.countries;
  if (!Array.isArray(countries)) return [];

  return countries
    .map((country): ProductProviderCountry | null => {
      if (!country || typeof country !== 'object') return null;
      const record = country as Record<string, unknown>;
      const countryCode = String(record.countryCode || '').trim();
      if (!countryCode) return null;
      return {
        countryCode,
        countryName: String(record.countryName || countryCode),
        flag: typeof record.flag === 'string' ? record.flag : undefined,
      };
    })
    .filter((country): country is ProductProviderCountry => Boolean(country));
};
