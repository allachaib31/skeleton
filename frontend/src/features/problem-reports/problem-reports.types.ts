import { PaginationQuery } from '@/shared/types/api.types';
import { AdminClient } from '@/features/clients/types/client.types';
import { AdminOrder } from '@/features/orders/types/order.types';
import { PaymentRequest } from '@/features/payments/payments.types';

export type ProblemReportType =
  | 'ORDER'
  | 'PAYMENT'
  | 'WALLET'
  | 'PRODUCT'
  | 'API_PROVIDER'
  | 'WAREHOUSE'
  | 'ACCOUNT_SECURITY'
  | 'REFUND'
  | 'GENERAL';

export type ProblemReportStatus =
  | 'OPEN'
  | 'WAITING_ADMIN'
  | 'WAITING_CLIENT'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CLOSED';

export type ProblemReportPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type ProblemReportSenderRole = 'CLIENT' | 'ADMIN';

export interface ProblemReport {
  _id: string;
  reportNumber: string;
  clientId: string | Pick<AdminClient, '_id' | 'name' | 'email' | 'username' | 'phoneNumber' | 'countryFlag' | 'balance' | 'openCredit'>;
  assignedAdminId?: string | { _id: string; name?: string; email?: string; username?: string };
  type: ProblemReportType;
  status: ProblemReportStatus;
  priority: ProblemReportPriority;
  subject: string;
  description: string;
  relatedOrderId?: string | Pick<AdminOrder, '_id' | 'orderNumber' | 'status' | 'totalPrice' | 'createdAt'> & { productName?: AdminOrder['productName'] };
  relatedPaymentRequestId?: string | Pick<PaymentRequest, '_id' | 'amount' | 'payableAmount' | 'creditedAmount' | 'status' | 'createdAt'>;
  relatedProductId?: string | { _id: string; name?: Record<string, string>; image?: { secureUrl?: string }; fulfillmentType?: string; apiGroup?: string };
  relatedServiceId?: string | { _id: string; name?: Record<string, string>; type?: string; image?: { secureUrl?: string } };
  relatedCategoryId?: string | { _id: string; name?: Record<string, string>; serviceId?: string; image?: { secureUrl?: string } };
  lastMessageAt?: string;
  lastMessageBy?: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemReportMessage {
  _id: string;
  reportId: string;
  senderId: string | { _id: string; name?: string; email?: string; username?: string; avatar?: { secureUrl?: string } };
  senderRole: ProblemReportSenderRole;
  message: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemReportDetail {
  report: ProblemReport;
  messages: ProblemReportMessage[];
}

export interface ProblemReportQuery extends PaginationQuery {
  type?: ProblemReportType | '';
  status?: ProblemReportStatus | '';
  priority?: ProblemReportPriority | '';
  assignedAdminId?: string;
  relatedOrderId?: string;
}

export interface CreateProblemReportRequest {
  type: ProblemReportType;
  priority?: ProblemReportPriority;
  subject: string;
  description: string;
  relatedOrderId?: string;
  relatedPaymentRequestId?: string;
  relatedFinancialMovementId?: string;
  relatedProductId?: string;
  relatedServiceId?: string;
  relatedCategoryId?: string;
}

export interface ProblemReportMessageRequest {
  message: string;
}

export interface AdminProblemReportMessageRequest extends ProblemReportMessageRequest {
  isInternal?: boolean;
}

