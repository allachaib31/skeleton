import { randomUUID } from 'crypto';
import { HttpError } from '../../../common/errors/HttpError';

export type GiftCardProvidersSimulationAction = 'PROFILE' | 'PRODUCTS' | 'CONTENT' | 'CREATE_ORDER' | 'CHECK_ORDERS';

export const giftCardProviderErrorCodes = {
  120: { scope: 'PUBLIC', key: 'API_TOKEN_REQUIRED', retryable: false },
  121: { scope: 'PUBLIC', key: 'TOKEN_ERROR', retryable: false },
  122: { scope: 'PUBLIC', key: 'API_NOT_ALLOWED', retryable: false },
  123: { scope: 'PUBLIC', key: 'IP_NOT_ALLOWED', retryable: false },
  130: { scope: 'PUBLIC', key: 'SITE_UNDER_MAINTENANCE', retryable: true },
  100: { scope: 'ORDER', key: 'INSUFFICIENT_BALANCE', retryable: false },
  105: { scope: 'ORDER', key: 'QUANTITY_NOT_AVAILABLE', retryable: false },
  106: { scope: 'ORDER', key: 'QUANTITY_NOT_ALLOWED', retryable: false },
  107: { scope: 'ORDER', key: 'PLAYER_ID_BLOCKED', retryable: false },
  108: { scope: 'ORDER', key: 'TWO_FACTOR_REQUIRED', retryable: false },
  109: { scope: 'ORDER', key: 'PRODUCT_DELETED_OR_NOT_FOUND', retryable: false },
  110: { scope: 'ORDER', key: 'PRODUCT_NOT_AVAILABLE_NOW', retryable: true },
  111: { scope: 'ORDER', key: 'TRY_AGAIN_AFTER_ONE_MINUTE', retryable: true },
  112: { scope: 'ORDER', key: 'QUANTITY_TOO_SMALL', retryable: false },
  113: { scope: 'ORDER', key: 'QUANTITY_TOO_LARGE', retryable: false },
  114: { scope: 'ORDER', key: 'UNKNOWN_ERROR', retryable: true },
  500: { scope: 'ORDER', key: 'UNKNOWN_ERROR', retryable: true },
} as const;

export type GiftCardProviderErrorCode = keyof typeof giftCardProviderErrorCodes;

export const getGiftCardProviderErrorInfo = (code: unknown) => {
  const numericCode = Number(code);
  if (!Number.isInteger(numericCode)) return null;
  const info = giftCardProviderErrorCodes[numericCode as GiftCardProviderErrorCode];
  return info ? { code: numericCode, ...info } : null;
};

export interface GiftCardProvidersCredentials {
  baseUrl: string;
  token: string;
}

export interface GiftCardProvidersProductsParams {
  productsId?: string[];
  base?: boolean;
}

export interface GiftCardProvidersContentParams {
  parentId: number;
}

export interface GiftCardProvidersCreateOrderParams {
  productId: number;
  quantity: number;
  orderUuid?: string;
  params?: Record<string, string>;
}

export interface GiftCardProvidersCheckOrdersParams {
  orders: string[];
  byUuid?: boolean;
}

export type GiftCardProvidersSimulationInput =
  | { action: 'PROFILE' }
  | { action: 'PRODUCTS'; products?: GiftCardProvidersProductsParams }
  | { action: 'CONTENT'; content: GiftCardProvidersContentParams }
  | { action: 'CREATE_ORDER'; order: GiftCardProvidersCreateOrderParams }
  | { action: 'CHECK_ORDERS'; check: GiftCardProvidersCheckOrdersParams };

const normalizeBaseUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
};

const buildUrl = (credentials: GiftCardProvidersCredentials, path: string, query?: Record<string, string>) => {
  const url = new URL(`${normalizeBaseUrl(credentials.baseUrl)}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url;
};

const parseResponse = async (response: Response) => {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') && text ? JSON.parse(text) : text;

  if (!response.ok) {
    throw HttpError.badRequest('settingsApis.gift_card_provider_request_failed', String(response.status));
  }

  return body;
};

const findErrorCode = (response: unknown): unknown => {
  if (!response || typeof response !== 'object') return null;
  const record = response as Record<string, unknown>;
  return record.code ?? record.error_code ?? record.errorCode ?? record.err_code ?? null;
};

export class GiftCardProvidersProvider {
  private static async request(credentials: GiftCardProvidersCredentials, path: string, query?: Record<string, string>) {
    const url = buildUrl(credentials, path, query);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-token': credentials.token,
        accept: 'application/json',
      },
    });

    return parseResponse(response);
  }

  static profile(credentials: GiftCardProvidersCredentials) {
    return this.request(credentials, '/client/api/profile');
  }

  static products(credentials: GiftCardProvidersCredentials, params: GiftCardProvidersProductsParams = {}) {
    return this.request(credentials, '/client/api/products', {
      products_id: params.productsId?.join(',') || '',
      base: params.base ? '1' : '',
    });
  }

  static content(credentials: GiftCardProvidersCredentials, params: GiftCardProvidersContentParams) {
    return this.request(credentials, `/client/api/content/${params.parentId}`);
  }

  static createOrder(credentials: GiftCardProvidersCredentials, params: GiftCardProvidersCreateOrderParams) {
    const orderUuid = params.orderUuid || randomUUID();
    return this.request(credentials, `/client/api/newOrder/${params.productId}/params`, {
      qty: String(params.quantity),
      order_uuid: orderUuid,
      ...(params.params || {}),
    });
  }

  static checkOrders(credentials: GiftCardProvidersCredentials, params: GiftCardProvidersCheckOrdersParams) {
    return this.request(credentials, '/client/api/check', {
      orders: params.orders.join(','),
      uuid: params.byUuid ? '1' : '',
    });
  }

  static async simulate(credentials: GiftCardProvidersCredentials, input: GiftCardProvidersSimulationInput) {
    let response: unknown;

    switch (input.action) {
      case 'PROFILE':
        response = await this.profile(credentials);
        break;
      case 'PRODUCTS':
        response = await this.products(credentials, input.products);
        break;
      case 'CONTENT':
        response = await this.content(credentials, input.content);
        break;
      case 'CREATE_ORDER':
        response = await this.createOrder(credentials, input.order);
        break;
      case 'CHECK_ORDERS':
        response = await this.checkOrders(credentials, input.check);
        break;
      default:
        throw HttpError.badRequest('settingsApis.gift_card_provider_action_invalid');
    }

    return {
      response,
      errorInfo: getGiftCardProviderErrorInfo(findErrorCode(response)),
    };
  }
}
