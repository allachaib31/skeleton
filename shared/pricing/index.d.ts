export type PricingBalanceMode = 'NORMAL' | 'NEGATIVE_BALANCE';
export type PricingType = 'INCREMENT' | 'INCREASE' | 'PERCENT';
export type PromotionType = 'FIXED' | 'PERCENT';
export type AppliedRuleSource = 'SERVICE_GROUP' | 'PRODUCT_SPECIAL_PRICE' | 'CLIENT_SPECIAL_PRICE' | 'PROMOTION';

export interface PricingClientInput {
  balance: number;
  openCredit: number;
}

export interface PricingProductInput {
  costPrice: number;
  costManual?: number;
  forQuantity: number;
  fulfillmentType?: 'API' | 'WAREHOUSE' | 'MANUAL';
  specialSellPrice?: {
    pricingType: 'INCREMENT' | 'PERCENT';
    value: number;
    negativeValue: number;
    agentRatio?: number;
  };
}

export interface PricingServiceGroupInput {
  pricingType: 'INCREASE' | 'PERCENT';
  value: number;
  negativeValue: number;
  percentAgent?: number;
  entitlementValue?: number;
}

export interface PricingClientSpecialPriceInput {
  pricingType: 'INCREMENT' | 'PERCENT';
  value: number;
  negativeValue: number;
}

export interface PricingPromotionInput {
  promotionType: PromotionType;
  value: number;
  maxDiscountAmount?: number;
}

export interface CalculateFinalProductPriceInput {
  client: PricingClientInput;
  product: PricingProductInput;
  serviceGroup: PricingServiceGroupInput;
  clientSpecialPrice?: PricingClientSpecialPriceInput;
  promotion?: PricingPromotionInput;
  quantity: number;
}

export interface AppliedPricingRule {
  source: AppliedRuleSource;
  pricingType?: PricingType;
  promotionType?: PromotionType;
  value: number;
  negativeValue?: number;
  appliedValue?: number;
  discountAmount?: number;
  beforeUnitPrice: number;
  afterUnitPrice: number;
}

export interface FinalProductPriceResult {
  pricingBalanceMode: PricingBalanceMode;
  quantity: number;
  unitCost: number;
  baseCost: number;
  finalUnitPrice: number;
  finalTotalPrice: number;
  discountAmount: number;
  canBuyWithOpenCredit: boolean;
  minimumAllowedBalance: number;
  balanceAfterPurchase: number;
  appliedRules: AppliedPricingRule[];
}

export function calculateFinalProductPrice(input: CalculateFinalProductPriceInput): FinalProductPriceResult;
export function roundMoney(value: number): number;
