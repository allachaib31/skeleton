# Special Programming

Use this group for custom provider APIs that do not match the standard groups.

Every provider in this group must have a small adapter README before production use.

## Required Adapter Documentation

Each custom provider must document:

- authentication method
- base URL
- product list endpoint if available
- order submit endpoint
- order status endpoint
- cancellation/refund behavior
- required client fields
- provider error codes
- retry rules
- webhook rules if supported

## Internal Mapping

Recommended relation:

```txt
Custom provider product -> ApiProductMapping -> StockProduct
```

Recommended `apiProductKey`:

```txt
apiId + adapterName + providerProductId
```

If provider has no product ID, build a deterministic key from stable fields.

## StockProduct Fields

- `serviceId`: admin-selected internal service
- `categoryId`: admin-selected internal category
- `name`: provider or admin product name
- `description`: admin description
- `costPrice`: provider cost or admin-entered cost
- `forQuantity`: depends on adapter
- `quantityType`: depends on adapter
- `apiId`: settings API account ID
- `apiGroup`: `SPECIAL_PROGRAMMING`
- `apiProductId`: provider product ID if available
- `apiProductKey`: stable adapter key
- `apiPayload`: raw provider metadata

## Fulfillment Flow

1. Adapter validates product requirements.
2. Backend checks final price and balance/open credit.
3. Adapter submits provider order.
4. Save provider order reference.
5. Adapter checks status or receives webhook.
6. Normalize provider result into local order status.

## Sync Rules

- Prefer explicit adapter code over generic dynamic requests.
- Never expose provider tokens to frontend.
- Validate external URLs and params to reduce SSRF risk.
- Add audit logs for admin-triggered sync/import.
- Add notifications when custom provider order state changes for the client.
