# Order Readiness Report

Date: 2026-05-22

Scope: backend and shared logic added before starting the order module: stocks, products, API providers, import/sync, pricing, promotions, warehouse, clients, levels, special prices, payment gateways, payment codes, and settings.

## Automated Checks

Commands run:

```bash
npm --prefix backend run typecheck
npm --prefix backend test
npm run contract
npm --prefix frontend run typecheck
```

Result after adding focused tests:

- Backend typecheck: passed
- Backend tests: passed, 9 suites / 42 tests
- OpenAPI + frontend contract generation: passed
- Frontend typecheck: passed

Important note: backend tests now cover the original auth/security/contract baseline plus focused tests for pricing/open credit, payment-code redemption/currency conversion, concurrent payment-code redemption, warehouse stock counters, warehouse reserve/release/sale transitions, and promotion usage limits. More tests are still needed for import mapping, API sync, client levels/special prices/payment gateways, and the future order module.

## Global Verdict

The architecture is strong enough to continue, but the order module should not be built on top of the current code without fixing the blocking findings below.

What is solid:

- Protected admin routes mostly have authentication, admin role checks, validation, and service-layer logic.
- Most state-changing flows use audit logs.
- Soft delete is used consistently for business records.
- Product/API provider model is flexible enough for gift cards, SMM services, temporary numbers, warehouse stock, and manual products.
- Pricing priority is implemented in a shared function and already has basic unit tests.
- API price currency conversion during product import/sync correctly divides provider price by currency price for non-dollar currencies.
- Product API connections solve the sensitive problem of changing the active provider product separately from normal product edits.

What is not solid yet:

- The new modules are under-tested.
- Order-specific invariants are not centralized yet.
- Some provider/import/warehouse paths can produce inconsistent state if used under load or with unusual data.

## Blocking Findings Before Order Logic

### 1. Open credit sign logic was inconsistent

Files:

- `backend/src/modules/admin-clients/admin-client.service.ts`
- `shared/pricing/index.js`

Admin balance withdrawal treats positive open credit as an allowed negative limit:

```ts
const minimumAllowedBalance = openCredit <= 0 ? openCredit : -openCredit;
if (after < minimumAllowedBalance) throw ...
```

But pricing checks:

```js
input.client.balance - finalTotalPrice >= input.client.openCredit
```

If `openCredit = 100`, admin withdrawal allows balance down to `-100`, but pricing requires balance after purchase to be `>= 100`, which blocks almost every purchase. If `openCredit = -100`, pricing works, but admin UI/business wording has also used positive values to mean credit amount.

Applied fix:

- Normalize open credit into one rule everywhere:

```txt
minimumAllowedBalance = openCredit <= 0 ? openCredit : -openCredit
canBuy = balanceAfterPurchase >= minimumAllowedBalance
```

- Added unit tests for:
  - balance 4, order 5, openCredit 0 -> cannot buy
  - balance 4, order 5, openCredit 5 -> can buy, balance after -1
  - balance 4, order 10, openCredit 5 -> cannot buy
  - negative balance uses negativeValue pricing

### 2. Payment code currency conversion was wrong

File:

- `backend/src/modules/payment-codes/payment-code.service.ts`

Current logic:

```ts
currency.isDollar ? value : value * currency.price
```

Product import/sync uses the opposite rule for provider costs:

```ts
nonDollarDollarValue = providerPrice / currency.price
```

Based on the existing currency model and earlier TR example, if `currency.price = 45.58` means `1 USD = 45.58 TR`, then a `109 TR` payment code should add `109 / 45.58 = 2.39 USD`, not `109 * 45.58`.

Applied fix:

```ts
currency.isDollar ? value : value / currency.price
```

Added non-dollar redemption test. Dollar redemption is covered through the second-redeem test.

### 3. Payment code redemption needed stronger race protection

Files:

- `backend/src/modules/payment-codes/payment-code.service.ts`
- `backend/src/modules/payment-codes/payment-code.model.ts`

The previous redeem flow read the code, validated status, updated client balance, then marked the code used. That left double-use prevention too dependent on application flow.

Applied fix:

- Use an atomic conditional update when claiming a code:

```txt
findOneAndUpdate({ codeHash, status: AVAILABLE, isDeleted: false }, { status: USED, ... })
```

- Create the balance movement and success journal after the claim.
- Keep failed attempt journal writes outside the aborted transaction so random/invalid/reused attempts remain visible.
- Added a concurrency test that sends two redemption attempts for the same code and verifies exactly one balance movement.

### 4. Warehouse stock reservation/sale helpers were missing

Files:

- `backend/src/modules/stock-warehouses/stock-warehouse.service.ts`

Warehouse supports create/import/update/bulk-update, but order logic also needs controlled item transitions.

Applied fix:

- Added `reserveAvailableItem(productId, orderId, clientId)`.
- Added `markReservedItemSold(itemId, orderId, clientId)`.
- Added `releaseReservedItem(itemId, orderId)`.
- Each helper uses an atomic status filter, recalculates warehouse counters, creates warehouse movement rows, and writes audit logs.
- Added integration coverage for reserve, release, reserve again, and sale.

Order logic must not directly call generic `updateItem`, because that allows manual transitions without ownership or order reference checks.

### 5. Promotion usage was read but not written by a shared helper

Files:

- `backend/src/modules/pricing/pricing.service.ts`
- `backend/src/modules/stock-promotions/stock-promotion-usage.model.ts`
- `backend/src/modules/stock-promotions/stock-promotion.service.ts`

Pricing checks `usageLimit` and `perClientLimit`, but the order flow needs a single safe helper for recording usage.

Applied fix:

- Added `StockPromotionService.recordUsage`.
- It can run inside an existing order transaction or open its own transaction.
- It enforces `usageLimit` and `perClientLimit`, increments `usageCount`, creates `StockPromotionUsage`, and writes an audit log.
- Added integration coverage for usage count increment and limit enforcement.

Still required for orders: decide whether refunded/cancelled orders reverse promotion usage.

## Important Non-Blocking Findings

### 6. New modules still need more direct test coverage

Current backend tests:

- Auth integration
- Authorization integration
- i18n
- CSRF middleware
- upload middleware
- mail templates
- API response shape
- pricing unit tests
- payment-code redemption/currency integration tests
- warehouse counter integration tests

Still missing test coverage:

- Client creation + level initialization
- Client open credit
- Client financial movements
- Client special prices
- Service group level upgrade/sync
- Product CRUD
- Product requirements sorting
- Product import for each API group
- Product API connections activate/update/delete
- Payment gateways
- Payment codes generation/import edge cases
- Promotions target matching beyond direct usage limits
- API sync unavailable notifications

Recommendation:

Before order logic, continue adding tests for remaining money and inventory primitives. Orders will depend on them.

### 7. Product import is not wrapped in a transaction

File:

- `backend/src/modules/stock-products/stock-product.service.ts`

`importApiProducts` creates categories, requirements, products, and audit logs, but it is not wrapped in `withTransaction`. A partial failure can leave categories/requirements without matching products or audit logs.

Recommendation:

- Wrap DB writes in a transaction where environment supports it.
- If local Mongo cannot use transactions, provide a safe non-transaction fallback with idempotent upserts and clear error reporting.

### 8. API sync updates active product fields but not product API connection snapshots

Files:

- `backend/src/modules/settings-apis/settings-api-sync.service.ts`
- `backend/src/modules/stock-products/stock-product-api-connection.model.ts`

API sync updates `StockProduct` rows by `apiProductKey`. If a product uses `StockProductApiConnection`, the connection snapshot may become stale unless it is also synced.

Recommendation:

- Sync active and non-deleted `StockProductApiConnection` rows by `apiProductKey`.
- If active connection changes price/quantity availability, apply it to the parent `StockProduct`.

### 9. Temporary number products need live price enforcement in order flow

Files:

- `backend/src/modules/stock-products/stock-product.service.ts`
- `docs/apis/temporary-number-coding-sites.md`

Temporary-number products correctly store cost price as `0` and save country/service metadata. The order flow must never use that placeholder price directly.

Required in order logic:

- On product page/order start, refresh selected country/service price from provider.
- Calculate final price using live cost.
- Store the provider activation ID, phone number, selected country, live provider price, and SMS status on the order.

### 10. Provider requirements are created, but order validation must be stricter

Files:

- `backend/src/modules/stock-products/stock-product.service.ts`
- `backend/src/modules/stock-product-requirements`

Requirements are imported/assigned, but the order module still needs a central validator that:

- checks required fields exist
- checks type-specific rules for SMM providers
- excludes internal provider fields like `service`
- validates quantity mode and custom quantity choices
- validates visible country codes for number products

## What Should Be Fixed Before Building Orders

Minimum required fixes:

1. Open-credit calculation in shared pricing is fixed and tested.
2. Payment-code non-dollar currency conversion is fixed and tested.
3. Add atomic payment-code claim logic.
4. Add warehouse reservation/sale/release methods.
5. Define and implement order transaction boundary:
   - calculate final price
   - validate requirements
   - deduct client balance
   - reserve or call provider
   - create order
   - create financial movement
   - write promotion usage
   - write audit log
   - notify client/admin as needed

Minimum required tests:

1. Pricing open-credit unit tests are added.
2. Payment-code redemption tests for non-dollar conversion and second redeem are added.
3. Warehouse import/status counter tests are added.
4. Warehouse reservation concurrency test.
5. Promotion limit/per-client usage test.
6. Product import mapping tests for:
   - Gift Card Providers
   - Gift Card Providers2 PIN
   - Social Media Service Providers
   - Temporary Number Coding Sites

## Suggested Order Module Shape

Create a dedicated order module instead of mixing order logic into products/clients.

Recommended models:

- `Order`
- `OrderRequirementValue`
- `OrderProviderTransaction`
- `OrderStatusHistory`

Recommended service boundary:

- `OrderPricingService`: wraps current shared pricing and live provider price refresh
- `OrderValidationService`: validates requirements and quantity rules
- `OrderBalanceService`: reserves/deducts/refunds client balance
- `OrderFulfillmentService`: routes to warehouse/API/manual fulfillment
- `OrderNotificationService`: client/admin notifications

Recommended first statuses:

- `PENDING_PAYMENT_CHECK`
- `PAID`
- `PROCESSING`
- `COMPLETED`
- `CANCELLED`
- `FAILED`
- `REFUNDED`

## Final Assessment

The platform foundation is stronger now: the biggest money math issues found in this review are fixed and covered by tests. Before real-money order execution, still add atomic payment-code claim logic, warehouse reservation/sale/release methods, promotion usage tests, and API import/sync tests.
