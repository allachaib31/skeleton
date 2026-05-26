import { HttpError } from '../../../common/errors/HttpError';

export type GiftCardProviders2SimulationAction =
  | 'BALANCE'
  | 'INSTITUTIONS'
  | 'SUBMIT_BILL'
  | 'CHECK_BILL'
  | 'BULK_CHECK_BILL'
  | 'AIRTIME_TOPUP'
  | 'CHECK_AIRTIME'
  | 'PIN_PRODUCTS'
  | 'SUBMIT_PIN'
  | 'CHECK_PIN';

export const giftCardProvider2BillStatusCodes = {
  1: { key: 'PENDING', final: false },
  2: { key: 'APPROVED_TRANSACTION', final: true },
  3: { key: 'CANCELLED_TRANSACTION', final: true },
} as const;

export const giftCardProvider2AirtimeStatusCodes = {
  1: { key: 'SUCCESS', final: true },
  2: { key: 'IN_PROGRESS', final: false },
  3: { key: 'FAILED_OR_CANCELLED', final: true },
  8: { key: 'NEEDS_CHECK', final: false },
} as const;

export const giftCardProvider2PinStatusCodes = {
  1: { key: 'PENDING', final: false },
  2: { key: 'APPROVED_PIN_LOADED', final: true },
  3: { key: 'CANCELLED', final: true },
} as const;

export interface GiftCardProviders2Credentials {
  baseUrl: string;
  token: string;
}

export interface GiftCardProviders2Auth {
  kod: string;
  sifre: string;
}

export interface GiftCardProviders2SubmitBillParams {
  institutionId: string;
  transactionId: string;
  subscriberName: string;
  dueDate: string;
  installationNumber: string;
  institutionCode?: string;
  billNumber: string;
  billAmount: string;
}

export interface GiftCardProviders2AirtimeTopupParams {
  operator: string;
  type: string;
  amount: string;
  phoneNumber: string;
  transactionId: string;
}

export interface GiftCardProviders2SubmitPinParams {
  gameId: string;
  denomination: string;
  reference: string;
  customerPhone: string;
  playerInfo: string;
}

export type GiftCardProviders2SimulationInput =
  | { action: 'BALANCE' }
  | { action: 'INSTITUTIONS' }
  | { action: 'SUBMIT_BILL'; bill: GiftCardProviders2SubmitBillParams }
  | { action: 'CHECK_BILL'; transactionId: string }
  | { action: 'BULK_CHECK_BILL'; transactionIds: string[] }
  | { action: 'AIRTIME_TOPUP'; airtime: GiftCardProviders2AirtimeTopupParams }
  | { action: 'CHECK_AIRTIME'; transactionId: string }
  | { action: 'PIN_PRODUCTS' }
  | { action: 'SUBMIT_PIN'; pin: GiftCardProviders2SubmitPinParams }
  | { action: 'CHECK_PIN'; transactionId: string };

const normalizeBaseUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
};

const parseAuth = (token: string): GiftCardProviders2Auth => {
  const trimmed = token.trim();
  try {
    const parsed = JSON.parse(trimmed) as Partial<GiftCardProviders2Auth>;
    if (parsed.kod && parsed.sifre) return { kod: String(parsed.kod), sifre: String(parsed.sifre) };
  } catch {
    // Fall back to kod:sifre format.
  }

  const [kod, ...passwordParts] = trimmed.split(':');
  const sifre = passwordParts.join(':');
  if (kod && sifre) return { kod, sifre };
  throw HttpError.badRequest('settingsApis.gift_card_provider_2_credentials_invalid');
};

const buildUrl = (credentials: GiftCardProviders2Credentials, path: string, params: Record<string, string>) => {
  const auth = parseAuth(credentials.token);
  const url = new URL(`${normalizeBaseUrl(credentials.baseUrl)}${path}`);
  url.searchParams.set('kod', auth.kod);
  url.searchParams.set('sifre', auth.sifre);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '') url.searchParams.set(key, value);
  });
  return url;
};

const buildAirtimeUrl = (credentials: GiftCardProviders2Credentials, path: string, params: Record<string, string>) => {
  const auth = parseAuth(credentials.token);
  const url = new URL(`${normalizeBaseUrl(credentials.baseUrl)}${path}`);
  url.searchParams.set('bayi_kodu', auth.kod);
  url.searchParams.set('sifre', auth.sifre);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '') url.searchParams.set(key, value);
  });
  return url;
};

const parsePipe = (text: string) => text.split('|');
const parseColonStatus = (text: string) => {
  const [code, ...rest] = text.split(':');
  return { code: Number(code), description: rest.join(':') };
};

const parseInstitutions = (text: string) =>
  text
    .split('#')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [institutionId, queryCode, name, cost, specialAccountNote] = row.split(',');
      return { institutionId, queryCode, name, cost, specialAccountNote };
    });

const parseBulkBillCheck = (text: string) =>
  text
    .split('##')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [transactionId, status, description] = row.split('|');
      const numericStatus = Number(status);
      return {
        transactionId,
        status: numericStatus,
        description,
        statusInfo: giftCardProvider2BillStatusCodes[numericStatus as keyof typeof giftCardProvider2BillStatusCodes] || null,
      };
    });

const parseResponse = async (response: Response) => {
  const text = (await response.text()).trim();
  if (!response.ok) throw HttpError.badRequest('settingsApis.gift_card_provider_2_request_failed', String(response.status));
  if (!text) return { empty: true, errorInfo: { key: 'EMPTY_RESPONSE_OR_API_NOT_ALLOWED', retryable: false } };
  if (/^<!doctype html/i.test(text) || /^<html/i.test(text)) {
    return {
      empty: false,
      errorInfo: {
        key: 'HTML_RESPONSE_WRONG_BASE_URL_OR_API_DISABLED',
        retryable: false,
      },
      rawPreview: text.slice(0, 500),
    };
  }
  return { raw: text };
};

const hasRaw = (result: unknown): result is { raw: string } =>
  !!result && typeof result === 'object' && typeof (result as { raw?: unknown }).raw === 'string';

export class GiftCardProviders2Provider {
  private static async request(credentials: GiftCardProviders2Credentials, path: string, params: Record<string, string> = {}) {
    const response = await fetch(buildUrl(credentials, path, params), { method: 'GET', headers: { accept: '*/*' } });
    return parseResponse(response);
  }

  private static async airtimeRequest(credentials: GiftCardProviders2Credentials, path: string, params: Record<string, string> = {}) {
    const response = await fetch(buildAirtimeUrl(credentials, path, params), { method: 'GET', headers: { accept: '*/*' } });
    return parseResponse(response);
  }

  static async balance(credentials: GiftCardProviders2Credentials) {
    const result = await this.request(credentials, '/servis/bakiye_kontrol.php');
    if (hasRaw(result)) {
      const [status, balance] = parsePipe(result.raw);
      return { ...result, parsed: { status, balance: Number(balance) } };
    }
    return result;
  }

  static async institutions(credentials: GiftCardProviders2Credentials) {
    const result = await this.request(credentials, '/servis/kurum_listesi.php');
    return hasRaw(result) ? { ...result, parsed: parseInstitutions(result.raw) } : result;
  }

  static async submitBill(credentials: GiftCardProviders2Credentials, params: GiftCardProviders2SubmitBillParams) {
    const result = await this.request(credentials, '/servis/fatura_ekle.php', {
      kurum_id: params.institutionId,
      tahsilat_api_islem_id: params.transactionId,
      abone_adi: params.subscriberName,
      son_odeme_tarihi: params.dueDate,
      tesisat_no: params.installationNumber,
      kurum_kodu: params.institutionCode || '',
      fatura_no: params.billNumber,
      fatura_tutari: params.billAmount,
    });
    if (hasRaw(result)) {
      const [status, costOrMessage, remainingBalance, totalDeductedAmount] = parsePipe(result.raw);
      return { ...result, parsed: { status, costOrMessage, remainingBalance, totalDeductedAmount } };
    }
    return result;
  }

  static async checkBill(credentials: GiftCardProviders2Credentials, transactionId: string) {
    const result = await this.request(credentials, '/servis/fatura_kontrol.php', { tahsilat_api_islem_id: transactionId });
    if (hasRaw(result)) {
      const parsed = parseColonStatus(result.raw);
      return {
        ...result,
        parsed: { ...parsed, statusInfo: giftCardProvider2BillStatusCodes[parsed.code as keyof typeof giftCardProvider2BillStatusCodes] || null },
      };
    }
    return result;
  }

  static async bulkCheckBill(credentials: GiftCardProviders2Credentials, transactionIds: string[]) {
    const result = await this.request(credentials, '/servis/fatura_top_kontrol.php', { tahsilat_api_islem_id: transactionIds.join(',') });
    return hasRaw(result) ? { ...result, parsed: parseBulkBillCheck(result.raw) } : result;
  }

  static async airtimeTopup(credentials: GiftCardProviders2Credentials, params: GiftCardProviders2AirtimeTopupParams) {
    const result = await this.airtimeRequest(credentials, '/servis/tl_servis.php', {
      operator: params.operator,
      tip: params.type,
      kontor: params.amount,
      gsmno: params.phoneNumber,
      tekilnumara: params.transactionId,
    });
    if (hasRaw(result)) {
      const [status, code, description, cost] = parsePipe(result.raw);
      const numericCode = Number(code);
      return {
        ...result,
        parsed: { status, code: numericCode, description, cost, statusInfo: giftCardProvider2AirtimeStatusCodes[numericCode as keyof typeof giftCardProvider2AirtimeStatusCodes] || null },
      };
    }
    return result;
  }

  static async checkAirtime(credentials: GiftCardProviders2Credentials, transactionId: string) {
    const result = await this.airtimeRequest(credentials, '/servis/tl_kontrol.php', { tekilnumara: transactionId });
    if (hasRaw(result)) {
      const [code, description, cost] = result.raw.split(':');
      const numericCode = Number(code);
      return {
        ...result,
        parsed: { code: numericCode, description, cost, statusInfo: giftCardProvider2AirtimeStatusCodes[numericCode as keyof typeof giftCardProvider2AirtimeStatusCodes] || null },
      };
    }
    return result;
  }

  static async pinProducts(credentials: GiftCardProviders2Credentials) {
    const result = await this.request(credentials, '/servis/pin_listesi.php');
    if (hasRaw(result)) {
      try {
        return { ...result, parsed: JSON.parse(result.raw) };
      } catch {
        return result;
      }
    }
    return result;
  }

  static async submitPin(credentials: GiftCardProviders2Credentials, params: GiftCardProviders2SubmitPinParams) {
    const result = await this.request(credentials, '/servis/pin_ekle.php', {
      oyun: params.gameId,
      kupur: params.denomination,
      referans: params.reference,
      musteri_tel: params.customerPhone,
      oyuncu_bilgi: params.playerInfo,
    });
    if (hasRaw(result)) {
      const [status, dealerCostOrDescription, remainingBalance] = parsePipe(result.raw);
      const numericStatus = Number(status);
      const isError = status !== 'OK' && Number.isFinite(numericStatus);
      return {
        ...result,
        parsed: {
          status,
          code: isError ? numericStatus : undefined,
          dealerCostOrDescription,
          remainingBalance,
          description: isError ? dealerCostOrDescription : undefined,
        },
      };
    }
    return result;
  }

  static async checkPin(credentials: GiftCardProviders2Credentials, transactionId: string) {
    const result = await this.request(credentials, '/servis/pin_kontrol.php', { tahsilat_api_islem_id: transactionId });
    if (hasRaw(result)) {
      const parts = parsePipe(result.raw);
      const directStatus = Number(parts[0]);
      if (Number.isFinite(directStatus) && parts[0] !== 'OK') {
        return {
          ...result,
          parsed: {
            status: parts[0],
            code: directStatus,
            loadedPin: '',
            description: parts[1] || '',
            statusInfo: giftCardProvider2PinStatusCodes[directStatus as keyof typeof giftCardProvider2PinStatusCodes] || null,
          },
        };
      }
      const [status, code, loadedPin, description] = parts;
      const numericCode = Number(code);
      return {
        ...result,
        parsed: { status, code: numericCode, loadedPin, description, statusInfo: giftCardProvider2PinStatusCodes[numericCode as keyof typeof giftCardProvider2PinStatusCodes] || null },
      };
    }
    return result;
  }

  static simulate(credentials: GiftCardProviders2Credentials, input: GiftCardProviders2SimulationInput) {
    switch (input.action) {
      case 'BALANCE':
        return this.balance(credentials);
      case 'INSTITUTIONS':
        return this.institutions(credentials);
      case 'SUBMIT_BILL':
        return this.submitBill(credentials, input.bill);
      case 'CHECK_BILL':
        return this.checkBill(credentials, input.transactionId);
      case 'BULK_CHECK_BILL':
        return this.bulkCheckBill(credentials, input.transactionIds);
      case 'AIRTIME_TOPUP':
        return this.airtimeTopup(credentials, input.airtime);
      case 'CHECK_AIRTIME':
        return this.checkAirtime(credentials, input.transactionId);
      case 'PIN_PRODUCTS':
        return this.pinProducts(credentials);
      case 'SUBMIT_PIN':
        return this.submitPin(credentials, input.pin);
      case 'CHECK_PIN':
        return this.checkPin(credentials, input.transactionId);
      default:
        throw HttpError.badRequest('settingsApis.gift_card_provider_2_action_invalid');
    }
  }
}
