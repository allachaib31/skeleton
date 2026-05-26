import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
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
import { productFulfillmentTypes, ProductFulfillmentType, productQuantityModes, ProductQuantityMode } from '@/features/stocks/types/stock-product.types';
import { useCreateStockProduct } from '@/features/stocks/hooks/stock-products.hooks';

const emptyLocalizedText: LocalizedText = { en: '', fr: '', ar: '' };
const supportedLanguages = ['en', 'fr', 'ar'] as const;

export default function StockProductCreatePage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [serviceId, setServiceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [apiId, setApiId] = useState('');
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
  const [dripfeed, setDripfeed] = useState(false);
  const [refill, setRefill] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [stock, setStock] = useState(true);
  const [fulfillmentType, setFulfillmentType] = useState<ProductFulfillmentType>('MANUAL');
  const [image, setImage] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const { data: servicesResponse } = useStockServices({ page: 1, limit: 300 });
  const { data: categoriesResponse } = useStockCategories({ page: 1, limit: 300 });
  const { data: apisResponse } = useSettingsApis({ page: 1, limit: 300 });
  const { mutate: createProduct, isPending } = useCreateStockProduct();

  useEffect(() => {
    setPageTitle(t('stocks.products.addTitle'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('stocks.title') },
      { label: t('stocks.products.addTitle') },
    ]);
  }, [setPageTitle, setBreadcrumbs, t]);

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

  const apiOptions = useMemo(
    () => (apisResponse?.data || []).map((api) => ({ value: api._id, label: api.name })),
    [apisResponse?.data]
  );

  const resetForm = () => {
    setServiceId('');
    setCategoryId('');
    setApiId('');
    setName({ ...emptyLocalizedText });
    setServiceNumber('');
    setCostPrice('');
    setCostManual('');
    setForQuantity('');
    setDescription({ ...emptyLocalizedText });
    setQuantityMode('WITHOUT_QUANTITY');
    setMinQuantity('');
    setMaxQuantity('');
    setCustomQuantities('');
    setSpeed('');
    setStartTime('');
    setQuantityAvailable(true);
    setIsVisible(true);
    setDripfeed(false);
    setRefill(false);
    setCancel(false);
    setStock(true);
    setFulfillmentType('MANUAL');
    setImage(null);
    setUploadKey((key) => key + 1);
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
      toast.error(t('stocks.products.imageRequired'));
      return;
    }

    createProduct(
      {
        serviceId,
        categoryId,
        apiId: apiId || undefined,
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
        dripfeed,
        refill,
        cancel,
        stock,
        fulfillmentType,
        image,
      },
      { onSuccess: resetForm }
    );
  };

  return (
    <div className="space-y-6">
      <SEO title={t('stocks.products.addTitle')} description={t('stocks.products.description')} />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('stocks.products.addTitle')}</h1>
        <PackagePlus size={24} className="text-primary" />
      </div>

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
            label={t('stocks.products.api')}
            value={apiId}
            options={[{ value: '', label: t('stocks.products.noApi') }, ...apiOptions]}
            onChange={(event) => setApiId(event.target.value)}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Switch label={t('stocks.products.quantityAvailable')} checked={quantityAvailable} onChange={(event) => setQuantityAvailable(event.target.checked)} />
          <Switch label={t('adminSettings.show')} checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} />
          <Switch label={t('stocks.products.dripfeed')} checked={dripfeed} onChange={(event) => setDripfeed(event.target.checked)} />
          <Switch label={t('stocks.products.refill')} checked={refill} onChange={(event) => setRefill(event.target.checked)} />
          <Switch label={t('stocks.products.cancel')} checked={cancel} onChange={(event) => setCancel(event.target.checked)} />
          <Switch label={t('stocks.products.stock')} checked={stock} onChange={(event) => setStock(event.target.checked)} />
        </div>

        <div className="space-y-2">
          <h2 className="font-bold">{t('stocks.products.image')}</h2>
          <FileUpload key={uploadKey} accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024} onFile={setImage} onClear={() => setImage(null)} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isPending}>{t('stocks.products.create')}</Button>
        </div>
      </form>
    </div>
  );
}
