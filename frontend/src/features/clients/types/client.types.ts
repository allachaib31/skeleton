import { PaginationQuery } from '@/shared/types/api.types';
import { SettingsPaymentGateway } from '@/features/settings/types/settings.types';
import { ProductSpecialPricingType, StockProduct } from '@/features/stocks/types/stock-product.types';
import { StockCategory } from '@/features/stocks/types/stock-category.types';
import { StockService } from '@/features/stocks/types/stock-service.types';
import { LocalizedText as StockServiceLocalizedText } from '@/features/stocks/types/stock-service.types';

export type ClientStatus = 'active' | 'inactive' | 'banned' | 'pending_verification';
export type ClientMovementType = 'DEPOSIT' | 'WITHDRAW';

export interface AdminClient {
  _id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  phoneNumber?: string;
  countryCode?: string;
  countryIso?: string;
  countryFlag?: string;
  avatar?: string;
  status: ClientStatus;
  invitationCode?: string;
  referralClientId?: Pick<AdminClient, '_id' | 'name' | 'email' | 'username' | 'invitationCode'>;
  balance: number;
  openCredit: number;
  totalExpenses: number;
  totalReferralWin: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFinancialMovement {
  _id: string;
  clientId: string | Pick<AdminClient, '_id' | 'name' | 'email' | 'username' | 'phoneNumber' | 'countryFlag'>;
  type: ClientMovementType;
  amount: number;
  paymentMethodId?: Pick<SettingsPaymentGateway, '_id' | 'name' | 'kind' | 'image'>;
  source?: 'ADMIN' | 'PAYMENT_GATEWAY' | 'BANK' | 'PAYMENT_CODE' | 'ORDER';
  referenceId?: string;
  referenceModel?: string;
  originalAmount?: number;
  currencyId?: string;
  comment?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface ClientLevelGroup {
  _id: string;
  serviceId: string;
  name: string;
  entitlementValue: number;
  pricingType: string;
  value: number;
  negativeValue: number;
  percentAgent: number;
  isDefault: boolean;
}

export interface ClientServiceLevel {
  _id: string;
  clientId: string;
  serviceId: {
    _id: string;
    name: StockServiceLocalizedText;
    type: string;
    image?: { secureUrl?: string };
    isVisible: boolean;
  };
  groupId: ClientLevelGroup | null;
  availableGroups: ClientLevelGroup[];
  points: number;
}

export interface ClientLevelsResponse {
  levels: ClientServiceLevel[];
  groups: ClientLevelGroup[];
  missingLevelCount: number;
  invalidLevelCount: number;
  skippedNoGroupCount: number;
  canGenerateLevels: boolean;
}

export interface ClientProductSpecialPrice {
  _id: string;
  clientId: string | Pick<AdminClient, '_id' | 'name' | 'email' | 'username' | 'phoneNumber' | 'countryFlag'>;
  serviceId: Pick<StockService, '_id' | 'name' | 'type'> | string;
  categoryId: Pick<StockCategory, '_id' | 'name' | 'serviceId'> | string;
  productId: Pick<StockProduct, '_id' | 'name' | 'image' | 'serviceId' | 'categoryId'> | string;
  pricingType: ProductSpecialPricingType;
  value: number;
  negativeValue: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminClientRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
  countryIso: string;
  countryFlag: string;
  status: ClientStatus;
  password: string;
  referralClientId?: string;
  avatar?: File | null;
}

export interface UpdateAdminClientRequest extends Partial<CreateAdminClientRequest> {}

export interface CreateClientMovementRequest {
  type: ClientMovementType;
  amount: number;
  paymentMethodId?: string;
  comment?: string;
}

export interface UpdateClientOpenCreditRequest {
  openCredit: number;
  comment?: string;
}

export interface CreateClientSpecialPriceRequest {
  serviceId: string;
  categoryId: string;
  productId: string;
  pricingType: ProductSpecialPricingType;
  value: number;
  negativeValue: number;
}

export interface UpdateClientSpecialPriceRequest extends Partial<CreateClientSpecialPriceRequest> {}

export interface AdminClientDetail {
  client: AdminClient;
  movements: {
    data: ClientFinancialMovement[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ClientListQuery extends PaginationQuery {
  status?: string;
}

export interface ClientMovementQuery {
  page: number;
  limit: number;
  type?: ClientMovementType | '';
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ClientSpecialPricesQuery {
  page: number;
  limit: number;
  clientId?: string;
  serviceId?: string;
  categoryId?: string;
  productId?: string;
  pricingType?: ProductSpecialPricingType | '';
}
