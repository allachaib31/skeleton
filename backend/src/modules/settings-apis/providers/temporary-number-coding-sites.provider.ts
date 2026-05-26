import { HttpError } from '../../../common/errors/HttpError';

export type TemporaryNumberCodingSitesSimulationAction =
  | 'GET_NUMBER'
  | 'GET_NUMBER_V2'
  | 'SET_STATUS'
  | 'GET_STATUS'
  | 'GET_STATUS_V2'
  | 'GET_BALANCE'
  | 'GET_PRICES'
  | 'GET_PRICES_V2'
  | 'GET_PRICES_V3'
  | 'GET_ACTIVE_ACTIVATIONS';

export const temporaryNumberCodingSiteErrorCodes = {
  BAD_KEY: { key: 'BAD_KEY', retryable: false },
  NO_BALANCE: { key: 'NO_BALANCE', retryable: false },
  NO_NUMBERS: { key: 'NO_NUMBERS', retryable: true },
  SERVICE_UNAVAILABLE_REGION: { key: 'SERVICE_UNAVAILABLE_REGION', retryable: false },
  BAD_ACTION: { key: 'BAD_ACTION', retryable: false },
  BAD_SERVICE: { key: 'BAD_SERVICE', retryable: false },
  BAD_STATUS: { key: 'BAD_STATUS', retryable: false },
  NO_ACTIVATION: { key: 'NO_ACTIVATION', retryable: false },
  ERROR_SQL: { key: 'ERROR_SQL', retryable: true },
  SERVICE_UNAVAILABLE: { key: 'SERVICE_UNAVAILABLE', retryable: true },
  STATUS_WAIT_CODE: { key: 'STATUS_WAIT_CODE', retryable: true },
  STATUS_WAIT_RETRY: { key: 'STATUS_WAIT_RETRY', retryable: true },
  STATUS_WAIT_RESEND: { key: 'STATUS_WAIT_RESEND', retryable: true },
  STATUS_CANCEL: { key: 'STATUS_CANCEL', retryable: false },
} as const;

export interface TemporaryNumberCodingSitesCredentials {
  baseUrl: string;
  token: string;
}

export interface TemporaryNumberCodingSitesCountryCatalogRow {
  id?: number;
  name?: string;
  external_id?: string;
  icon?: string;
  phone_code?: string;
  name_intl?: Record<string, string>;
}

export interface TemporaryNumberCodingSitesServiceCatalogRow {
  id?: number;
  name?: string;
  external_id?: string;
  slug?: string;
  popular?: number;
  sort?: number;
  icon_id?: number;
}

export interface TemporaryNumberCodingSitesSimulationInput {
  apiId: string;
  action: TemporaryNumberCodingSitesSimulationAction;
  service?: string;
  country?: string;
  maxPrice?: string;
  providerIds?: string[];
  exceptProviderIds?: string[];
  activationId?: string;
  status?: string;
  extra?: Record<string, string | number | boolean>;
}

const actionMap: Record<TemporaryNumberCodingSitesSimulationAction, string> = {
  GET_NUMBER: 'getNumber',
  GET_NUMBER_V2: 'getNumberV2',
  SET_STATUS: 'setStatus',
  GET_STATUS: 'getStatus',
  GET_STATUS_V2: 'getStatusV2',
  GET_BALANCE: 'getBalance',
  GET_PRICES: 'getPrices',
  GET_PRICES_V2: 'getPricesV2',
  GET_PRICES_V3: 'getPricesV3',
  GET_ACTIVE_ACTIVATIONS: 'getActiveActivations',
};

const normalizeHandlerUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  if (url.hostname === 'grizzlysms.com' || url.hostname === 'www.grizzlysms.com') {
    return 'https://api.grizzlysms.com/stubs/handler_api.php';
  }
  const normalized = `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  return normalized.endsWith('/stubs/handler_api.php') ? normalized : `${normalized}/stubs/handler_api.php`;
};

const normalizePublicSiteUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  if (url.hostname === 'api.grizzlysms.com') return 'https://grizzlysms.com';
  return `${url.origin}`;
};

const requestPublicJson = async <T>(baseUrl: string, path: string): Promise<T[]> => {
  const url = new URL(path, normalizePublicSiteUrl(baseUrl));
  const response = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
  if (!response.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload) ? payload as T[] : [];
};

const getFetchFailureInfo = (error: unknown, url: URL) => {
  const cause = error instanceof Error && 'cause' in error ? error.cause : undefined;
  const networkCause = cause && typeof cause === 'object' ? cause as Record<string, unknown> : {};
  return {
    key: 'NETWORK_FETCH_FAILED',
    retryable: true,
    endpoint: `${url.origin}${url.pathname}`,
    message: error instanceof Error ? error.message : 'request_failed',
    code: typeof networkCause.code === 'string' ? networkCause.code : undefined,
    hostname: typeof networkCause.hostname === 'string' ? networkCause.hostname : url.hostname,
  };
};

const parseTextResponse = (text: string) => {
  if (text.startsWith('ACCESS_NUMBER:')) {
    const [, activationId, phoneNumber] = text.split(':');
    return { type: 'ACCESS_NUMBER', activationId, phoneNumber };
  }
  if (text.startsWith('ACCESS_BALANCE:')) {
    const [, balance] = text.split(':');
    return { type: 'ACCESS_BALANCE', balance: Number(balance) };
  }
  if (text.startsWith('STATUS_OK:')) {
    const [, code] = text.split(':');
    return { type: 'STATUS_OK', code };
  }
  if (text.startsWith('STATUS_WAIT_CODE')) return { type: 'STATUS_WAIT_CODE', statusInfo: temporaryNumberCodingSiteErrorCodes.STATUS_WAIT_CODE };
  if (text.startsWith('STATUS_WAIT_RETRY')) return { type: 'STATUS_WAIT_RETRY', statusInfo: temporaryNumberCodingSiteErrorCodes.STATUS_WAIT_RETRY };
  if (text.startsWith('STATUS_WAIT_RESEND')) return { type: 'STATUS_WAIT_RESEND', statusInfo: temporaryNumberCodingSiteErrorCodes.STATUS_WAIT_RESEND };
  if (text.startsWith('STATUS_CANCEL')) return { type: 'STATUS_CANCEL', statusInfo: temporaryNumberCodingSiteErrorCodes.STATUS_CANCEL };
  if (text.startsWith('ACCESS_READY')) return { type: 'ACCESS_READY' };
  if (text.startsWith('ACCESS_RETRY_GET')) return { type: 'ACCESS_RETRY_GET' };
  if (text.startsWith('ACCESS_ACTIVATION')) return { type: 'ACCESS_ACTIVATION' };
  if (text.startsWith('ACCESS_CANCEL')) return { type: 'ACCESS_CANCEL' };
  if (temporaryNumberCodingSiteErrorCodes[text as keyof typeof temporaryNumberCodingSiteErrorCodes]) {
    return { type: 'ERROR', errorInfo: temporaryNumberCodingSiteErrorCodes[text as keyof typeof temporaryNumberCodingSiteErrorCodes] };
  }
  return null;
};

const parseResponse = async (response: Response) => {
  const text = (await response.text()).trim();
  if (!response.ok) {
    return {
      raw: text,
      parsed: null,
      errorInfo: {
        key: 'HTTP_RESPONSE_FAILED',
        retryable: response.status >= 500,
        status: response.status,
      },
    };
  }
  if (!text) return { empty: true, errorInfo: { key: 'EMPTY_RESPONSE', retryable: true } };
  try {
    return { raw: text, parsed: JSON.parse(text) };
  } catch {
    const parsed = parseTextResponse(text);
    return { raw: text, parsed, errorInfo: parsed && 'errorInfo' in parsed ? parsed.errorInfo : null };
  }
};

export class TemporaryNumberCodingSitesProvider {
  static getPrices(credentials: TemporaryNumberCodingSitesCredentials, input: Omit<TemporaryNumberCodingSitesSimulationInput, 'apiId' | 'action'> = {}) {
    return this.simulate(credentials, { apiId: '', action: 'GET_PRICES', ...input });
  }

  static getPricesV2(credentials: TemporaryNumberCodingSitesCredentials, input: Omit<TemporaryNumberCodingSitesSimulationInput, 'apiId' | 'action'> = {}) {
    return this.simulate(credentials, { apiId: '', action: 'GET_PRICES_V2', ...input });
  }

  static getPricesV3(credentials: TemporaryNumberCodingSitesCredentials, input: Omit<TemporaryNumberCodingSitesSimulationInput, 'apiId' | 'action'> = {}) {
    return this.simulate(credentials, { apiId: '', action: 'GET_PRICES_V3', ...input });
  }

  static getBalance(credentials: TemporaryNumberCodingSitesCredentials) {
    return this.simulate(credentials, { apiId: '', action: 'GET_BALANCE' });
  }

  static getCountryCatalog(credentials: TemporaryNumberCodingSitesCredentials) {
    return requestPublicJson<TemporaryNumberCodingSitesCountryCatalogRow>(credentials.baseUrl, '/api/country');
  }

  static getServiceCatalog(credentials: TemporaryNumberCodingSitesCredentials) {
    return requestPublicJson<TemporaryNumberCodingSitesServiceCatalogRow>(credentials.baseUrl, '/api/service/all');
  }

  static async simulate(credentials: TemporaryNumberCodingSitesCredentials, input: TemporaryNumberCodingSitesSimulationInput) {
    const url = new URL(normalizeHandlerUrl(credentials.baseUrl));
    url.searchParams.set('api_key', credentials.token);
    url.searchParams.set('action', actionMap[input.action]);

    if (['GET_NUMBER', 'GET_NUMBER_V2', 'GET_PRICES', 'GET_PRICES_V2', 'GET_PRICES_V3'].includes(input.action)) {
      if (input.service) url.searchParams.set('service', input.service);
      if (input.country) url.searchParams.set('country', input.country);
      if (input.maxPrice) url.searchParams.set('maxPrice', input.maxPrice);
      if (input.providerIds?.length) url.searchParams.set('providerIds', input.providerIds.join(','));
      if (input.exceptProviderIds?.length) url.searchParams.set('exceptProviderIds', input.exceptProviderIds.join(','));
    }

    if (input.action === 'SET_STATUS') {
      if (!input.activationId || !input.status) throw HttpError.badRequest('settingsApis.temporary_number_provider_status_required');
      url.searchParams.set('id', input.activationId);
      url.searchParams.set('status', input.status);
    }

    if (input.action === 'GET_STATUS' || input.action === 'GET_STATUS_V2') {
      if (!input.activationId) throw HttpError.badRequest('settingsApis.temporary_number_provider_activation_required');
      url.searchParams.set('id', input.activationId);
    }

    Object.entries(input.extra || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    });

    try {
      const response = await fetch(url, { method: 'GET', headers: { accept: '*/*' } });
      return parseResponse(response);
    } catch (error) {
      return {
        raw: null,
        parsed: null,
        errorInfo: getFetchFailureInfo(error, url),
      };
    }
  }
}
