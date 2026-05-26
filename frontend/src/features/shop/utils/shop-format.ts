import { ShopProductItem, ShopServiceItem } from '../types/shop.types';

type LocalizedValue = { en?: string; fr?: string; ar?: string } | undefined;

export const localized = (value: LocalizedValue, language: string, fallback = '') => {
  const key = language.startsWith('ar') ? 'ar' : language.startsWith('fr') ? 'fr' : 'en';
  return value?.[key] || value?.en || value?.fr || value?.ar || fallback;
};

export const serviceGlyph = (service: Pick<ShopServiceItem, 'type' | 'name'>, language = 'en') => {
  const name = localized(service.name, language, 'S');
  if (service.type === 'SOCIAL_REINFORCERS') return '#';
  if (service.type === 'PHONE_NUMBER_GENERATOR') return '✉';
  if (service.type === 'ESIM_NUMBER') return 'SIM';
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const serviceColor = (index: number) => {
  const colors = ['#7B5BFF', '#FF6B6B', '#06D6A0', '#FF8E3C', '#118AB2', '#EF476F', '#9B5DE5'];
  return colors[index % colors.length];
};

export const serviceShopPath = (service: Pick<ShopServiceItem, '_id' | 'type'>) => {
  const query = `serviceId=${service._id}`;

  if (service.type === 'SOCIAL_REINFORCERS') return `/shop/smm?${query}`;
  if (service.type === 'ESIM_NUMBER' || service.type === 'PHONE_NUMBER_GENERATOR') return `/shop/numbers?${query}`;

  return `/shop/giftcards?${query}`;
};

export const serviceFromProduct = (product: ShopProductItem) => {
  return typeof product.serviceId === 'string' ? undefined : product.serviceId;
};

export const categoryName = (product: ShopProductItem, language: string) => {
  return typeof product.categoryId === 'string'
    ? ''
    : localized(product.categoryId?.name, language);
};

export const productQuantityLabel = (product: ShopProductItem) => {
  if (product.quantityMode === 'WITHOUT_QUANTITY') return '1';
  if (product.quantityMode === 'CUSTOMIZE') return `${product.customQuantities?.length || 0}`;
  return `${product.minQuantity || 1}-${product.maxQuantity || 1}`;
};
