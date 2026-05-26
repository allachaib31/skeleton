# Gift Card Providers

Use this group for gift card, game card, subscription, and digital-code providers that expose product lists and order APIs.

This group is for the first Gift Card Providers protocol used by the project.

## Provider Product Source

Typical provider actions:

- profile/balance
- products
- content/category
- create order
- check orders

Provider rows may include:

- product ID
- product name
- product type
- parent/category ID
- price
- quantity values
- order parameters
- availability

## Internal Mapping

Recommended relation:

```txt
Provider category tree -> StockCategory
Provider product -> StockProduct
```

Recommended `apiProductKey`:

```txt
apiId + providerProductId
```

## StockProduct Fields

- `serviceId`: mapped internal service, for example PlayStation, Xbox, Netflix, Steam
- `categoryId`: mapped provider category or internal category
- `name`: provider product name
- `description`: provider description and order rules
- `costPrice`: provider `price`
- `forQuantity`: `1`
- `productQuantityMode`: derived from provider `product_type` and `qty_values`
- `quantityValues`: provider fixed values when `qty_values` is an array
- `minQuantity`: provider `qty_values.min` when `qty_values` is an object
- `maxQuantity`: provider `qty_values.max` when `qty_values` is an object
- `apiId`: settings API account ID
- `apiGroup`: `GIFT_CARD_PROVIDERS`
- `apiProductId`: provider product ID
- `apiProductKey`: `apiId + providerProductId`
- `apiPayload`: full provider product row

## Product Quantity Mode Rules

Gift Card Providers products use `product_type` and `qty_values` together.

### Amount Products

When:

```txt
product_type = amount
qty_values = { min, max }
```

Map to:

```txt
productQuantityMode = COUNTER
forQuantity = 1
costPrice = price
minQuantity = qty_values.min
maxQuantity = qty_values.max
```

Meaning:

The provider price is for one unit. The client/admin enters a counter quantity between min and max.

Example:

```json
{
  "id": 365,
  "name": "UC 60",
  "price": 0.104,
  "params": ["ادخل الايدي الاعب"],
  "category_name": "UC 60",
  "available": true,
  "qty_values": {
    "min": 1,
    "max": "15000"
  },
  "product_type": "amount",
  "parent_id": 0,
  "base_price": 0.10,
  "category_img": ""
}
```

### Fixed Package Products

When:

```txt
product_type = package
qty_values = null
```

Map to:

```txt
productQuantityMode = WITHOUT_QUANTITY
forQuantity = 1
costPrice = price
```

Meaning:

The product is a fixed package. The client buys one package at a time and does not choose quantity.

Example:

```json
{
  "id": 2357,
  "name": "PANDA VPN 1 MONTH",
  "price": 8.25,
  "params": [],
  "category_name": "PANDA VPN",
  "available": false,
  "qty_values": null,
  "product_type": "package",
  "parent_id": 266,
  "base_price": 9,
  "category_img": "https://api.kasim-store.com/images/category/1618-1767910055.webp"
}
```

### Quantity Package Products

When:

```txt
product_type = package
qty_values = { min, max }
```

Map to:

```txt
productQuantityMode = QUANTITY
forQuantity = 1
costPrice = price
minQuantity = qty_values.min
maxQuantity = qty_values.max
```

Meaning:

The package accepts a quantity range. The client/admin enters quantity between min and max.

Example:

```json
{
  "id": 382,
  "name": "MeYo 490 gold",
  "price": 4.9692,
  "params": ["User ID"],
  "category_name": "MEYO LIVE",
  "available": true,
  "qty_values": {
    "min": 1,
    "max": "10"
  },
  "product_type": "package",
  "parent_id": 120,
  "base_price": 5.1185076923077,
  "category_img": "https://api.kasim-store.com/images/category/1618-1750265941.webp"
}
```

### Specific Package Products

When:

```txt
product_type = specificPackage
qty_values = ["1.92", "2.88", "..."]
```

Map to:

```txt
productQuantityMode = CUSTOMIZE
forQuantity = 1
costPrice = price
quantityValues = qty_values
```

Meaning:

The provider only accepts one of the fixed values in `qty_values`. The provider `price` is the price for one unit, and the selected value is sent as the product quantity/value.

Example:

```json
{
  "id": 2150,
  "name": "SYRIATEL",
  "price": 0.00772255027173913,
  "params": ["رقم الهانف"],
  "category_name": "Data and Communication Section",
  "available": true,
  "qty_values": ["1.92", "2.88", "3.84", "4.8", "5.76"],
  "product_type": "specificPackage",
  "parent_id": 110,
  "base_price": 10600,
  "category_img": "https://api.kasim-store.com/images/category/1618-1751237531.webp"
}
```

## Quantity Mapping Summary

| Provider `product_type` | Provider `qty_values` | Internal `productQuantityMode` |
| --- | --- | --- |
| `amount` | object with `min` and `max` | `COUNTER` |
| `package` | `null` | `WITHOUT_QUANTITY` |
| `package` | object with `min` and `max` | `QUANTITY` |
| `specificPackage` | array of values | `CUSTOMIZE` |

## Requirements

Some products need extra fields like:

- player ID
- email
- phone number
- region
- account identifier

Store these as product requirements and map them to provider order params.

## Fulfillment Flow

1. Client chooses product and fills requirements.
2. Backend validates local requirements.
3. Backend checks final price and balance/open credit.
4. Backend sends create order request.
5. Save provider order ID and optional UUID.
6. Check order until code or final status is returned.
7. If provider returns a code, save it securely on the order.

## Sync Rules

- Update provider cost, quantity rules, and raw payload.
- Do not overwrite admin names/descriptions after import.
- Use warehouse only when provider codes are imported and stored locally before sale.
- Keep provider error code map because order handling needs it later.
