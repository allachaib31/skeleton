# Gift Card Providers2

Use this group for ZNET-style APIs with bill payment, airtime top-up, and game PIN endpoints.

This protocol is not one product family. Treat each family separately.

## Product Families

Supported families:

- bills and institutions
- airtime or credit top-up
- game PIN products

## Internal Mapping

Recommended relation:

```txt
Provider family -> StockService
Institution/operator/game -> StockCategory
Denomination or bill service -> StockProduct
```

Recommended `apiProductKey`:

```txt
apiId + family + providerProductId
```

Examples:

```txt
apiId + BILL + institutionId
apiId + AIRTIME + operator + type + amount
apiId + PIN + gameId + denomination
```

## Bill Products

Provider source:

- institution list endpoint

StockProduct fields:

- `serviceId`: bills service
- `categoryId`: institution category
- `name`: institution name
- `costPrice`: provider cost/commission field
- `forQuantity`: `1`
- `quantityType`: `without quantity`
- `apiProductId`: institution ID

Requirements:

- subscriber name
- due date
- installation number
- institution code if needed
- bill number
- bill amount

## Airtime Products

Provider source:

- supported operators/types and admin-defined denominations

StockProduct fields:

- `serviceId`: mobile top-up service
- `categoryId`: operator category
- `name`: operator + type + amount
- `costPrice`: provider returned or configured amount
- `forQuantity`: `1`
- `quantityType`: `without quantity`
- `apiProductId`: operator/type/amount key

Requirements:

- phone number
- operator
- type
- amount

## Game PIN Products

Provider source:

- game PIN product list

StockProduct fields:

- `serviceId`: game or PIN service
- `categoryId`: game category
- `name`: provider PIN name
- `description`: provider description
- `costPrice`: provider price
- `forQuantity`: `1`
- `quantityType`: `without quantity`
- `apiProductId`: provider PIN product ID
- `apiPayload.family`: `PIN`
- `apiPayload.gameId`: provider `oyun_id`
- `apiPayload.gameName`: provider `oyun_adi`
- `apiPayload.denomination`: provider `kupur`
- `apiPayload.playerInfoId`: provider `oyun_bilgi_id`

Requirements:

- customer phone
- player info if provider requires it

### PIN Product Example

Provider product:

```json
{
  "id": "84",
  "adi": "Razer GOLD 100TL",
  "aciklama": "<font size=3 face=Arial color=red>Cep Numarasını Doğru Giriniz.</font> <font size=2 face=Arial color=blue>Razer Gold Şifresi Müşterinin Cep Telefonuna SMS Olarak Gönderilecek.. </font>",
  "oyun_id": "17",
  "oyun_adi": "Razer Gold",
  "fiyat": "109.37",
  "kupur": "100",
  "oyun_bilgi_id": "4"
}
```

Mapping:

```txt
StockProduct.name = adi
StockCategory.name = oyun_adi
costPrice = fiyat
forQuantity = kupur
productQuantityMode = WITHOUT_QUANTITY
apiProductId = id
apiProductKey = apiId + PIN + id
```

Meaning:

The provider price `fiyat` is the buy price for the denomination `kupur`. In the example, the admin pays `109.37` for a `100` TL Razer Gold product.

Order payload later needs:

```txt
oyun = oyun_id
kupur = kupur
oyuncu_bilgi = oyun_bilgi_id or client-provided player info depending on provider rules
musteri_tel = customer phone
referans = local unique order reference
```

## Fulfillment Flow

1. Resolve product family from `apiPayload`.
2. Validate family requirements.
3. Backend checks final price and balance/open credit.
4. Submit matching provider transaction.
5. Save provider transaction ID.
6. Poll matching status endpoint.
7. Save PIN/code or final transaction result.

## Sync Rules

- Keep family in `apiPayload`.
- Use separate requirement templates for each family.
- Do not mix bill, airtime, and PIN params in one generic form.
- Mark unavailable provider rows, do not delete internal products.
