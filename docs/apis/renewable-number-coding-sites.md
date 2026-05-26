# Renewable Number Coding Sites

Use this group for rented or renewable phone numbers.

These providers are different from temporary activation providers because a client may keep the same number for a period and renew it.

## Provider Product Source

Provider catalog is usually built from:

- services
- countries
- rental duration
- renewal price
- availability

## Internal Mapping

For Grizzly/SMS-Activate-style renewable imports, keep the same catalog shape as temporary numbers until the rental flow is implemented.

```txt
Selected internal service -> StockService
Provider service name -> StockCategory
Provider service code -> StockProduct
Provider countries -> StockProduct.apiPayload.countries
```

Recommended `apiProductKey`:

```txt
apiId + apiGroup + serviceCode
```

## StockProduct Fields

- `serviceId`: mapped internal service
- `categoryId`: category named after provider service
- `name`: provider service name
- `description`: provider service name
- `costPrice`: `0` placeholder; real price is fetched live before purchase or renewal
- `forQuantity`: `1`
- `quantityType`: `without quantity`
- `apiId`: settings API account ID
- `apiGroup`: `RENEWABLE_NUMBER_CODING_SITES`
- `apiProductId`: provider service code
- `apiProductKey`: stable API/service key
- `apiPayload.serviceCode`: provider service code
- `apiPayload.serviceName`: provider service name
- `apiPayload.countries`: country code, name, SVG flag URL, latest price/count when available
- `apiPayload.dynamicPrice`: `true`

## Requirements

The client chooses country and duration at purchase/renewal time. Refresh live price before creating the provider rental.

## Fulfillment Flow

1. Client buys rental product.
2. Backend reserves/rents a provider number.
3. Save provider rental ID, phone number, start date, and expiry date.
4. Client receives SMS through order detail.
5. Renewal order uses the same provider rental ID.
6. Expired rentals must be marked inactive locally.

## Sync Rules

- Do not use product price cron sync for this group.
- Refresh rental cost and renewal cost live during purchase/renewal.
- Keep expiry state on orders or rental records, not only on product.
- Do not delete internal products when provider temporarily has no stock.
- Do not use warehouse unless numbers are pre-purchased and stored locally.
