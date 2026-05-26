import { StockProduct } from '@/features/stocks/types/stock-product.types';
import { StockCategory } from '@/features/stocks/types/stock-category.types';
import { AdminClient } from '@/features/clients/types/client.types';
import { LocalizedText, StockService } from '@/features/stocks/types/stock-service.types';

export type OrderStatus = 'PENDING_MANUAL' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type OrderFulfillmentSource = 'WAREHOUSE' | 'API' | 'MANUAL';

export interface OrderRequirementSnapshot {
  requirementId?: string;
  paramsName: string;
  message?: LocalizedText;
  value: string;
}

export interface OrderDeliveredItem {
  warehouseItemId?: string;
  code?: string;
  serialNumber?: string;
  pin?: string;
  extraData?: Record<string, unknown>;
}

export interface AdminOrder {
  _id: string;
  orderNumber: string;
  clientId: Pick<AdminClient, '_id' | 'name' | 'email' | 'username' | 'phoneNumber' | 'balance' | 'openCredit'> | string;
  productId: Pick<StockProduct, '_id' | 'name' | 'image' | 'fulfillmentType' | 'apiGroup'> | string;
  serviceId: Pick<StockService, '_id' | 'name' | 'type'> | string;
  categoryId: Pick<StockCategory, '_id' | 'name' | 'serviceId'> | string;
  productName: LocalizedText;
  quantity: number;
  fulfillmentSource: OrderFulfillmentSource;
  status: OrderStatus;
  needsAdminAction: boolean;
  issueReason?: string;
  assignedAdminId?: { _id: string; name?: string; email?: string; username?: string } | string;
  providerOrderId?: string;
  providerResponse?: Record<string, unknown>;
  providerStatus?: string;
  unitCost: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  levelPointsApplied?: boolean;
  levelPointsAppliedAt?: string;
  levelPointsAmount?: number;
  requirementSnapshots: OrderRequirementSnapshot[];
  deliveredItems: OrderDeliveredItem[];
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  page: number;
  limit: number;
  search?: string;
  clientId?: string;
  productId?: string;
  status?: OrderStatus;
  fulfillmentSource?: OrderFulfillmentSource;
  needsAdminAction?: boolean;
}

export interface CreateOrderRequest {
  clientId: string;
  productId: string;
  quantity: number;
  requirements?: Record<string, string>;
}

export interface CompleteOrderRequest {
  deliveredItems?: OrderDeliveredItem[];
  providerResponse?: Record<string, unknown>;
}

export interface SwitchOrderApiRequest {
  connectionId: string;
  requirements?: Record<string, string>;
}
