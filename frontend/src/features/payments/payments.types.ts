import { PaginationQuery } from '@/shared/types/api.types';
import { SettingsCurrency, SettingsPaymentGateway } from '@/features/settings/types/settings.types';
import { AdminClient } from '@/features/clients/types/client.types';

export type PaymentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentRequestInputType = 'TEXT' | 'IMAGE' | 'QR_CODE' | 'SERIAL';

export interface PaymentRequestInput {
  key: string;
  label: { en: string; fr: string; ar: string };
  type: PaymentRequestInputType;
  value?: string;
  upload?: { secureUrl: string; publicId: string; uploadId: string };
}

export interface PaymentRequest {
  _id: string;
  clientId: string | Pick<AdminClient, '_id' | 'name' | 'email' | 'username' | 'phoneNumber' | 'countryFlag' | 'balance'>;
  paymentGatewayId: string | Pick<SettingsPaymentGateway, '_id' | 'name' | 'kind' | 'image' | 'currencyId'>;
  gatewayKind: 'PAYMENT_GATEWAY' | 'BANK';
  currencyId?: string | Pick<SettingsCurrency, '_id' | 'name' | 'shortName' | 'icon' | 'price' | 'isDollar'>;
  amount: number;
  creditedAmount: number;
  taxType: 'INCREASE' | 'PERCENT';
  taxValue: number;
  taxAmount: number;
  payableAmount: number;
  status: PaymentRequestStatus;
  serialNumber?: string;
  clientComment?: string;
  adminComment?: string;
  inputs: PaymentRequestInput[];
  proofImage?: { secureUrl: string; publicId: string; uploadId: string };
  reviewedBy?: { _id: string; name?: string; email?: string };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequestQuery extends PaginationQuery {
  status?: PaymentRequestStatus | '';
  gatewayKind?: 'PAYMENT_GATEWAY' | 'BANK' | '';
  paymentGatewayId?: string;
  clientId?: string;
  search?: string;
}

export interface CreatePaymentRequestRequest {
  paymentGatewayId: string;
  amount: number;
  serialNumber?: string;
  clientComment?: string;
  inputs?: Array<{ key: string; value?: string }>;
  proofImage?: File | null;
}
