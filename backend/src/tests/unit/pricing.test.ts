import { calculateFinalProductPrice } from '@pricing';

const baseInput = {
  client: { balance: 10, openCredit: 0 },
  product: { costPrice: 100, forQuantity: 10 },
  serviceGroup: { pricingType: 'INCREASE' as const, value: 5, negativeValue: 9 },
  quantity: 1,
};

describe('calculateFinalProductPrice', () => {
  it('uses service group when no product or client special price exists', () => {
    const result = calculateFinalProductPrice(baseInput);

    expect(result.appliedRules.map((rule) => rule.source)).toEqual(['SERVICE_GROUP']);
    expect(result.finalUnitPrice).toBe(15);
  });

  it('uses product special price directly from cost and skips service group', () => {
    const result = calculateFinalProductPrice({
      ...baseInput,
      product: {
        ...baseInput.product,
        specialSellPrice: { pricingType: 'PERCENT', value: 10, negativeValue: 20 },
      },
    });

    expect(result.appliedRules.map((rule) => rule.source)).toEqual(['PRODUCT_SPECIAL_PRICE']);
    expect(result.finalUnitPrice).toBe(11);
  });

  it('uses client special price directly from cost and skips product special price and service group', () => {
    const result = calculateFinalProductPrice({
      ...baseInput,
      product: {
        ...baseInput.product,
        specialSellPrice: { pricingType: 'PERCENT', value: 10, negativeValue: 20 },
      },
      clientSpecialPrice: { pricingType: 'PERCENT', value: 5, negativeValue: 30 },
    });

    expect(result.appliedRules.map((rule) => rule.source)).toEqual(['CLIENT_SPECIAL_PRICE']);
    expect(result.finalUnitPrice).toBe(10.5);
  });

  it('still applies promotion after the selected base price rule', () => {
    const result = calculateFinalProductPrice({
      ...baseInput,
      clientSpecialPrice: { pricingType: 'PERCENT', value: 5, negativeValue: 30 },
      promotion: { promotionType: 'PERCENT', value: 10 },
    });

    expect(result.appliedRules.map((rule) => rule.source)).toEqual(['CLIENT_SPECIAL_PRICE', 'PROMOTION']);
    expect(result.finalUnitPrice).toBe(9.45);
  });

  it('uses negativeValue when the client balance is below zero', () => {
    const result = calculateFinalProductPrice({
      ...baseInput,
      client: { balance: -1, openCredit: -20 },
      clientSpecialPrice: { pricingType: 'INCREMENT', value: 5, negativeValue: 30 },
    });

    expect(result.pricingBalanceMode).toBe('NEGATIVE_BALANCE');
    expect(result.appliedRules[0].appliedValue).toBe(30);
    expect(result.finalUnitPrice).toBe(40);
  });

  it('allows a purchase when positive open credit covers the negative balance', () => {
    const result = calculateFinalProductPrice({
      ...baseInput,
      client: { balance: 4, openCredit: 5 },
      product: { costPrice: 5, forQuantity: 1 },
      serviceGroup: { pricingType: 'INCREASE', value: 0, negativeValue: 0 },
      quantity: 1,
    });

    expect(result.minimumAllowedBalance).toBe(-5);
    expect(result.balanceAfterPurchase).toBe(-1);
    expect(result.canBuyWithOpenCredit).toBe(true);
  });

  it('blocks a purchase when positive open credit does not cover the negative balance', () => {
    const result = calculateFinalProductPrice({
      ...baseInput,
      client: { balance: 4, openCredit: 5 },
      product: { costPrice: 10, forQuantity: 1 },
      serviceGroup: { pricingType: 'INCREASE', value: 0, negativeValue: 0 },
      quantity: 1,
    });

    expect(result.minimumAllowedBalance).toBe(-5);
    expect(result.balanceAfterPurchase).toBe(-6);
    expect(result.canBuyWithOpenCredit).toBe(false);
  });

  it('uses manual cost as base cost for manual fulfillment products', () => {
    const result = calculateFinalProductPrice({
      ...baseInput,
      product: {
        ...baseInput.product,
        fulfillmentType: 'MANUAL',
        costManual: 60,
      },
    });

    expect(result.baseCost).toBe(60);
    expect(result.unitCost).toBe(6);
    expect(result.finalUnitPrice).toBe(11);
  });
});
