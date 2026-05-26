const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 10000) / 10000;

const applyMarkup = (base, pricingType, value) => {
  if (pricingType === 'PERCENT') return roundMoney(base + (base * value) / 100);
  return roundMoney(base + value);
};

const applyPromotion = (currentUnitPrice, promotion) => {
  if (!promotion) return { finalUnitPrice: currentUnitPrice, discountAmount: 0 };

  let discountAmount = 0;
  let finalUnitPrice = currentUnitPrice;

  if (promotion.promotionType === 'FIXED') {
    discountAmount = promotion.value;
    if (promotion.maxDiscountAmount !== undefined) discountAmount = Math.min(discountAmount, promotion.maxDiscountAmount);
    finalUnitPrice = currentUnitPrice - discountAmount;
  }

  if (promotion.promotionType === 'PERCENT') {
    discountAmount = (currentUnitPrice * promotion.value) / 100;
    if (promotion.maxDiscountAmount !== undefined) discountAmount = Math.min(discountAmount, promotion.maxDiscountAmount);
    finalUnitPrice = currentUnitPrice - discountAmount;
  }

  return {
    finalUnitPrice: roundMoney(Math.max(0, finalUnitPrice)),
    discountAmount: roundMoney(discountAmount),
  };
};

function calculateFinalProductPrice(input) {
  const quantity = Math.max(1, Number(input.quantity || 1));
  const baseCost = input.product.fulfillmentType === 'MANUAL' && input.product.costManual !== undefined
    ? input.product.costManual
    : input.product.costPrice;
  const unitCost = roundMoney(baseCost / input.product.forQuantity);
  const pricingBalanceMode = input.client.balance < 0 ? 'NEGATIVE_BALANCE' : 'NORMAL';
  const useNegativeValue = pricingBalanceMode === 'NEGATIVE_BALANCE';
  const appliedRules = [];

  let currentUnitPrice = unitCost;

  if (input.clientSpecialPrice) {
    const clientSpecialValue = useNegativeValue
      ? input.clientSpecialPrice.negativeValue
      : input.clientSpecialPrice.value;
    currentUnitPrice = applyMarkup(unitCost, input.clientSpecialPrice.pricingType, clientSpecialValue);
    appliedRules.push({
      source: 'CLIENT_SPECIAL_PRICE',
      pricingType: input.clientSpecialPrice.pricingType,
      value: input.clientSpecialPrice.value,
      negativeValue: input.clientSpecialPrice.negativeValue,
      appliedValue: clientSpecialValue,
      beforeUnitPrice: unitCost,
      afterUnitPrice: currentUnitPrice,
    });
  } else if (input.product.specialSellPrice) {
    const specialValue = useNegativeValue
      ? input.product.specialSellPrice.negativeValue
      : input.product.specialSellPrice.value;
    currentUnitPrice = applyMarkup(unitCost, input.product.specialSellPrice.pricingType, specialValue);
    appliedRules.push({
      source: 'PRODUCT_SPECIAL_PRICE',
      pricingType: input.product.specialSellPrice.pricingType,
      value: input.product.specialSellPrice.value,
      negativeValue: input.product.specialSellPrice.negativeValue,
      appliedValue: specialValue,
      beforeUnitPrice: unitCost,
      afterUnitPrice: currentUnitPrice,
    });
  } else {
    const serviceGroupValue = useNegativeValue ? input.serviceGroup.negativeValue : input.serviceGroup.value;
    currentUnitPrice = applyMarkup(unitCost, input.serviceGroup.pricingType, serviceGroupValue);
    appliedRules.push({
      source: 'SERVICE_GROUP',
      pricingType: input.serviceGroup.pricingType,
      value: input.serviceGroup.value,
      negativeValue: input.serviceGroup.negativeValue,
      appliedValue: serviceGroupValue,
      beforeUnitPrice: unitCost,
      afterUnitPrice: currentUnitPrice,
    });
  }

  const beforePromotionUnitPrice = currentUnitPrice;
  const promotionResult = applyPromotion(currentUnitPrice, input.promotion);
  currentUnitPrice = promotionResult.finalUnitPrice;

  if (input.promotion) {
    appliedRules.push({
      source: 'PROMOTION',
      promotionType: input.promotion.promotionType,
      value: input.promotion.value,
      discountAmount: promotionResult.discountAmount,
      beforeUnitPrice: beforePromotionUnitPrice,
      afterUnitPrice: currentUnitPrice,
    });
  }

  const finalUnitPrice = roundMoney(currentUnitPrice);
  const finalTotalPrice = roundMoney(finalUnitPrice * quantity);
  const minimumAllowedBalance = input.client.openCredit <= 0 ? input.client.openCredit : -input.client.openCredit;
  const canBuyWithOpenCredit = roundMoney(input.client.balance - finalTotalPrice) >= minimumAllowedBalance;

  return {
    pricingBalanceMode,
    quantity,
    unitCost,
    baseCost,
    finalUnitPrice,
    finalTotalPrice,
    discountAmount: promotionResult.discountAmount,
    canBuyWithOpenCredit,
    minimumAllowedBalance,
    balanceAfterPurchase: roundMoney(input.client.balance - finalTotalPrice),
    appliedRules,
  };
}

module.exports = {
  calculateFinalProductPrice,
  roundMoney,
};
