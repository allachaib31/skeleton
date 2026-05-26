# API Product Sync Architecture

This document defines how external provider products become internal sellable products.

## Core Rule

`StockProduct` is the product sold by Tafa3olcard.

Provider products are only fulfillment sources. They must not control final selling price, visibility, product grouping, or client-specific rules directly.

Recommended flow:

```txt
Provider API product -> ApiProductMapping -> StockProduct -> pricing engine -> client order
```

## Data Model Recommendation

Add provider metadata to `StockProduct`:

```ts
apiId?: ObjectId;
apiGroup?: ApiGroup;
apiProductId?: string;
apiProductKey?: string;
apiPayload?: Record<string, unknown>;
apiLastSyncedAt?: Date;
apiSyncStatus?: 'SYNCED' | 'MISSING' | 'ERROR';
apiSyncError?: string;
```

Add a dedicated mapping collection:

```txt
ApiProductMapping
- apiId
- apiGroup
- providerProductId
- providerProductKey
- serviceId
- categoryId
- productId
- rawProviderProduct
- lastSeenAt
- isIgnored
- isImported
- syncStatus
- syncError
- createdAt
- updatedAt
```

## Import Flow

1. Admin selects API account and API group.
2. Backend fetches provider catalog.
3. Backend upserts raw rows into `ApiProductMapping`.
4. Admin reviews unmapped products.
5. Admin maps provider service/category to internal service/category.
6. Admin imports selected rows as `StockProduct`.
7. Future sync updates provider cost and availability metadata.

## Fields Sync Can Update

Safe automatic updates:

- `costPrice`
- `minQuantity`
- `maxQuantity`
- `apiPayload`
- `apiLastSyncedAt`
- `apiSyncStatus`
- provider availability flags

Fields that should not be overwritten after admin edits:

- translated name
- translated description
- `isVisible`
- product group assignment
- final sell price rules
- client special prices
- product special prices
- promotion logic

## Product Key

Every provider integration must build a stable `apiProductKey`.

Rules:

- Include `apiId`.
- Include the provider product ID when available.
- Include service/country/operator/duration where provider has no single product ID.
- Never use translated provider names as the only key.

## Pricing Boundary

Provider cost is only the starting cost.

Final price is calculated by the shared pricing engine:

1. Start from product `costPrice`.
2. Apply client special price if present.
3. Else apply product special price if present.
4. Else apply service group price rule.
5. Apply promotions.
6. If client balance is negative, use `negativeValue` instead of `value` for the selected price rule.

## Warehouse Boundary

Use warehouse only when the platform owns local stock codes.

Do not create warehouse entries for live API fulfillment products unless provider codes are imported and stored locally before sale.
