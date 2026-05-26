# Temporary Number Coding Sites

Examples: GrizzlySMS and providers compatible with the sms-activate handler API.

Use this group for temporary SMS activation numbers.

## Provider Product Source

Provider catalog is usually built from:

- services
- countries
- operators
- price/availability rows

Recommended provider calls:

- balance: `getBalance`
- prices: `getPrices`, `getPricesV2`, or `getPricesV3`
- reserve number: `getNumber` or `getNumberV2`
- check SMS: `getStatus` or `getStatusV2`
- update activation: `setStatus`
- active activations: `getActiveActivations`

## Internal Mapping

For Grizzly/SMS-Activate-style import, do not create one product for every service-country pair. The product is a live API service template.

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
- `categoryId`: category named after provider service, for example Telegram
- `name`: provider service name
- `description`: provider service name
- `costPrice`: `0` placeholder; real price is fetched live before purchase
- `forQuantity`: `1`
- `quantityType`: `without quantity`
- `apiId`: settings API account ID
- `apiGroup`: `TEMPORARY_NUMBER_CODING_SITES`
- `apiProductId`: provider service code, for example `tg`
- `apiProductKey`: stable API/service key
- `apiPayload.serviceCode`: provider service code
- `apiPayload.serviceName`: provider service name
- `apiPayload.countries`: country code, name, SVG flag URL, latest price/count when available
- `apiPayload.dynamicPrice`: `true`

## Requirements

The client chooses a country at purchase time. Country options come from `apiPayload.countries`, then backend should refresh live price/availability before reserving a number.

If a future provider needs target app, country, operator, or forwarding options, store them as product requirement metadata.

## Fulfillment Flow

1. Client opens product.
2. Backend refreshes live price/availability for selected service/country.
3. Client buys product.
4. Backend checks final price and balance/open credit.
5. Backend calls provider `getNumber`.
6. Save activation ID and phone number on the order.
7. Client views the reserved number.
8. Backend polls or manually calls `getStatus`.
9. When SMS arrives, save the code on the order.
10. Use `setStatus` to finish or cancel according to order state.

## Error Handling

Store provider error codes in a normalized map.

Important codes:

- `BAD_KEY`
- `NO_BALANCE`
- `NO_NUMBERS`
- `BAD_ACTION`
- `BAD_SERVICE`
- `BAD_STATUS`
- `NO_ACTIVATION`
- `STATUS_WAIT_CODE`
- `STATUS_OK`
- `STATUS_CANCEL`

Network failures should be saved as retryable provider errors, not as product deletion.

## Sync Rules

- Do not use product price cron sync for this group.
- Refresh price and availability live during product display and order creation.
- Import can refresh countries/service metadata, but stored product price remains a placeholder.
- Do not overwrite admin product name/description after import.
- Do not create warehouse stock for live temporary numbers.
