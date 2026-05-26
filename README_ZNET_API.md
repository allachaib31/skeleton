# ZNET API Documentation

This README summarizes the ZNET dealer API described in the uploaded API document. All services are exposed under a dealer subdomain, usually in this format:

```text
http://bayi.siteadi.com/servis/
```

> Replace `bayi.siteadi.com`, dealer codes, passwords, subscriber numbers, transaction IDs, and other sample values with your real production values.

## Requirements

Before using any API endpoint, the dealer account must have API permission enabled from the user list.

Some services may return an empty response instead of a structured error when:

- The dealer does not exist.
- API access is not active.
- The fixed IP address does not match.

## Authentication

Most endpoints use these query parameters:

| Parameter | Description |
|---|---|
| `kod` | Dealer code |
| `sifre` | Dealer password |

Mobile top-up endpoints use:

| Parameter | Description |
|---|---|
| `bayi_kodu` | Dealer code |
| `sifre` | Dealer password |

---

## Balance Check

Checks the dealer balance.

### Endpoint

```http
GET /servis/bakiye_kontrol.php
```

### Example

```http
http://bayi.siteadi.com/servis/bakiye_kontrol.php?kod=5458301536&sifre=123456
```

### Success Response

```text
OK|12755.23
```

### Response Format

```text
OK|BALANCE
```

### Notes

If the dealer does not exist, API is inactive, or the fixed IP check fails, the response may be empty.

---

## Invoice Institution List and Prices

Returns supported invoice institutions and their costs.

### Endpoint

```http
GET /servis/kurum_listesi.php
```

### Example

```http
http://bayi.siteadi.com/servis/kurum_listesi.php?kod=5458301536&sifre=123456
```

### Response Format

Institutions are separated by `#`.

```text
KURUM_ID,SORGU_KODU,ADI,MALIYETI,OZELHSPYNT#...
```

### Fields

| Field | Description |
|---|---|
| `KURUM_ID` | Institution ID. This is the most important value for payment operations. |
| `SORGU_KODU` | Query code. May be the same for multiple records of the same institution. |
| `ADI` | Institution name |
| `MALIYETI` | Dealer cost/commission |
| `OZELHSPYNT` | Special account/payment method value |

### Notes

The same institution can appear more than once. Use `KURUM_ID` as the primary identifier.

---

## Send Invoice Payment

Adds/sends an invoice payment.

### Endpoint

```http
GET /servis/fatura_ekle.php
```

### Example

```http
http://bayi.siteadi.com/servis/fatura_ekle.php?kod=5458301536&sifre=123456&kurum_id=8&tahsilat_api_islem_id=123456&abone_adi=S***Y****&son_odeme_tarihi=2013-05-12&tesisat_no=5458301526&kurum_kodu=&fatura_no=12345665&fatura_tutari=110.15
```

### Parameters

| Parameter | Required | Description |
|---|---:|---|
| `kod` | Yes | Dealer code |
| `sifre` | Yes | Dealer password |
| `kurum_id` | Yes | Institution ID, for example `8` for Turkcell |
| `tahsilat_api_islem_id` | Yes | Unique transaction ID |
| `abone_adi` | Yes | Subscriber name |
| `son_odeme_tarihi` | Yes | Due date, format `YYYY-MM-DD` |
| `tesisat_no` | Yes | Installation/subscriber number |
| `kurum_kodu` | No/Conditional | Institution code. Used by institutions such as Tedaş that require two-digit codes. |
| `fatura_no` | Yes | Invoice number |
| `fatura_tutari` | Yes | Invoice amount |

### Success Response

```text
OK|0.30|2644.78|110.45
```

### Success Response Format

```text
OK|MALIYET|KALAN_BAKIYE|TOPLAM_DUSEN_TUTAR
```

| Field | Description |
|---|---|
| `MALIYET` | Dealer cost/commission |
| `KALAN_BAKIYE` | Remaining dealer balance |
| `TOPLAM_DUSEN_TUTAR` | Total deducted amount |

### Error Responses

```text
4|Daha Önce Gönderilmiş (166189)
```

```text
3|Açıklama
```

| Code | Meaning |
|---|---|
| `4` | Duplicate transaction |
| `3` | Other error, with explanation |

### Notes

`TOPLAM_DUSEN_TUTAR` may not always equal `MALIYET + fatura_tutari`. Invoice interest can also be included in the total deducted amount.

---

## Invoice Status Check

Checks the status of one invoice payment transaction.

### Endpoint

```http
GET /servis/fatura_kontrol.php
```

### Example

```http
http://bayi.siteadi.com/servis/fatura_kontrol.php?kod=5458301536&sifre=123456&tahsilat_api_islem_id=123456
```

### Parameters

| Parameter | Required | Description |
|---|---:|---|
| `kod` | Yes | Dealer code |
| `sifre` | Yes | Dealer password |
| `tahsilat_api_islem_id` | Yes | Unique invoice transaction ID |

### Response Format

```text
STATUS:ACIKLAMA
```

### Status Codes

| Code | Meaning |
|---|---|
| `1` | Waiting / pending |
| `2` | Approved transaction |
| `3` | Cancelled transaction |

---

## Bulk Invoice Status Check

Checks the status of multiple invoice payment transactions.

### Endpoint

```http
GET /servis/fatura_top_kontrol.php
```

### Example

```http
http://bayi.siteadi.com/servis/fatura_top_kontrol.php?kod=5458301536&sifre=123456&tahsilat_api_islem_id=123456,123457
```

### Parameters

| Parameter | Required | Description |
|---|---:|---|
| `kod` | Yes | Dealer code |
| `sifre` | Yes | Dealer password |
| `tahsilat_api_islem_id` | Yes | Comma-separated unique transaction IDs |

### Success Response

```text
123456|2||##123457|3||##
```

### Response Format

Records are separated by `##`.

```text
GONDERILEN_TEKIL_NO|DURUM|ACIKLAMA##GONDERILEN_TEKIL_NO|DURUM|ACIKLAMA##
```

### Notes

- Pending transactions do not return a response item.
- A maximum of 100 transactions can be checked at once.

---

## Mobile Top-Up Send

Sends mobile credit/top-up.

### Supported Operators

- `Turkcell`
- `Vodafone`
- `Avea`

### Supported Types

- `tam`
- `3gcep`
- `3g`
- `ses`
- `sms`
- `bal`

### Endpoint

```http
GET /servis/tl_servis.php
```

### Example

```http
http://bayi.siteadi.com/servis/tl_servis.php?bayi_kodu=5458301536&sifre=123456&operator=turkcell&tip=3gcep&kontor=5&gsmno=5458301526&tekilnumara=123456
```

### Parameters

| Parameter | Required | Description |
|---|---:|---|
| `bayi_kodu` | Yes | Dealer code |
| `sifre` | Yes | Dealer password |
| `operator` | Yes | Operator name, for example `turkcell` |
| `tip` | Yes | Top-up type |
| `kontor` | Yes | Top-up amount/package |
| `gsmno` | Yes | GSM/mobile number |
| `tekilnumara` | Yes | Unique transaction number |

### Response Examples

```text
OK|1|Talebiniz İşleme Alınmıştır.|5.50
```

```text
OK|3|Aynı Numaraya Aynı Miktarda 10 Dakika İçinde İşlem Gerçekleşti|0.00
```

```text
OK|3|bayikodu yada şifre geçersiz|0.00
```

```text
OK|8|Bu İşlem Daha Önce Gönderildi|0.00
```

### Response Format

```text
OK|SONUC_DURUM|ACIKLAMA|MALIYET
```

### Status Codes

| Code | Meaning |
|---|---|
| `1` | Request received / processing started |
| `3` | Negative/failed response |
| `8` | Transaction must be checked later |

### Notes

- Partial credit/top-up sending is not supported.
- Status `3` directly represents a negative response.
- Status `8` covers transactions that should be checked with the control endpoint.

---

## Mobile Top-Up Status Check

Checks the status of a mobile top-up transaction.

### Endpoint

```http
GET /servis/tl_kontrol.php
```

### Example

```http
http://bayi.siteadi.com/servis/tl_kontrol.php?bayi_kodu=5458301536&sifre=123456&tekilnumara=123456
```

### Parameters

| Parameter | Required | Description |
|---|---:|---|
| `bayi_kodu` | Yes | Dealer code |
| `sifre` | Yes | Dealer password |
| `tekilnumara` | Yes | Unique top-up transaction number |

### Response Examples

```text
1:olumlu_islem:5.50
```

```text
2:islemde:5.50
```

```text
3:iptal_nedeni
```

### Status Codes

| Code | Meaning |
|---|---|
| `1` | Successful transaction |
| `2` | In progress |
| `3` | Cancelled/failed, with reason |

---

## Game PIN Product List

Returns the list of available game PIN products.

### Endpoint

```http
GET /servis/pin_listesi.php
```

### Example

```http
http://bayi.siteadi.com/servis/pin_listesi.php?kod=5458301536&sifre=123456
```

### Success Response Example

```json
{
  "success": true,
  "result": [
    {
      "id": "2",
      "adi": "PUBG Mobile 325 UC",
      "aciklama": "Oyun otomatik olarak yuklenir.325 UC ",
      "oyun_id": "1",
      "oyun_adi": "PUBG",
      "fiyat": "35.00",
      "kupur": "325",
      "oyun_bilgi_id": "1"
    },
    {
      "id": "3",
      "adi": "PUBG Mobile 60 UC",
      "aciklama": "PUBG Mobile 60 UC.",
      "oyun_id": "1",
      "oyun_adi": "PUBG",
      "fiyat": "7.30",
      "kupur": "325",
      "oyun_bilgi_id": "1"
    }
  ],
  "error": null
}
```

### Response Fields

| Field | Description |
|---|---|
| `success` | `true` for successful response, `false` for failed response |
| `result` | Product list |
| `id` | Product ID |
| `adi` | Product name |
| `aciklama` | Product description |
| `oyun_id` | Game ID |
| `oyun_adi` | Game name |
| `fiyat` | Price |
| `kupur` | Denomination/package value |
| `oyun_bilgi_id` | Game information ID used in game PIN sending |
| `error` | Error description when `success` is `false` |

### Notes

For failed operations, `success` returns `false` and the error explanation is written in the `error` field.

---

## Send Game PIN

Sends a game PIN order.

### Endpoint

```http
GET /servis/pin_ekle.php
```

### Example

```http
http://bayi.siteadresi.com/servis/pin_ekle.php?kod=5555555555&sifre=123456&oyun=1&kupur=123&referans=123456&musteri_tel=51234567890&oyuncu_bilgi=987456
```

### Parameters

| Parameter | Required | Description |
|---|---:|---|
| `kod` | Yes | Dealer code |
| `sifre` | Yes | Dealer password |
| `oyun` | Yes | Game info ID returned from `pin_listesi.php` as `oyun_bilgi_id` |
| `kupur` | Yes | Denomination/package value |
| `referans` | Yes | Unique reference/transaction ID |
| `musteri_tel` | Yes | Customer phone number |
| `oyuncu_bilgi` | Yes | Player/customer game account information |

### Success Response

```text
OK|10.12|980.88
```

### Success Response Format

```text
OK|BAYI_MALIYETI|KALAN_BAKIYE
```

### Error Response

```text
3|Açıklama
```

---

## Game PIN Status Check

Checks the status of a game PIN transaction.

### Endpoint

```http
GET /servis/pin_kontrol.php
```

### Example

```http
http://bayi.siteadresi.com/servis/pin_kontrol.php?kod=5555555555&sifre=123456&tahsilat_api_islem_id=123456
```

### Parameters

| Parameter | Required | Description |
|---|---:|---|
| `kod` | Yes | Dealer code |
| `sifre` | Yes | Dealer password |
| `tahsilat_api_islem_id` | Yes | Transaction/reference ID |

### Response Examples

```text
OK|2|AB12-CD34-EF56-GH78|Açıklama
```

```text
OK|1| |Açıklama
```

```text
OK|3| |Açıklama
```

### Response Format

```text
OK|ISLEM_DURUM|YUKLENEN_PIN|ACIKLAMA
```

### Status Codes

| Code | Meaning |
|---|---|
| `1` | Waiting / processing |
| `2` | Approved/successful; PIN value may be returned |
| `3` | Cancelled/failed |

### Error Response

```text
3|Açıklama
```

---

## Implementation Tips

### Use Unique Transaction IDs

Always generate a unique transaction ID/reference for payment, top-up, and PIN requests:

- `tahsilat_api_islem_id` for invoice operations
- `tekilnumara` for mobile top-up operations
- `referans` for game PIN operations

This helps prevent duplicate processing and enables reliable status checks.

### Always Check Pending/Unclear Transactions

Some operations may return a status that requires later verification. For example:

- Mobile top-up response status `8`
- Invoice status `1`
- Game PIN status `1`

Use the related control endpoint before retrying or marking the transaction as failed.

### Parse Responses Carefully

The API uses mixed response formats:

- Pipe-separated text: `OK|...`
- Colon-separated text: `1:...`
- Hash-separated lists: `...##...`
- JSON for game PIN product list

Do not assume all endpoints return JSON.

### Recommended HTTP Handling

- Use URL encoding for all query parameters.
- Set reasonable connection and read timeouts.
- Log full request IDs and transaction IDs, but avoid logging real passwords.
- Treat empty responses as configuration/authentication/IP issues unless proven otherwise.

---

## Endpoint Summary

| Feature | Endpoint |
|---|---|
| Balance check | `/servis/bakiye_kontrol.php` |
| Invoice institution list | `/servis/kurum_listesi.php` |
| Send invoice payment | `/servis/fatura_ekle.php` |
| Invoice status check | `/servis/fatura_kontrol.php` |
| Bulk invoice status check | `/servis/fatura_top_kontrol.php` |
| Send mobile top-up | `/servis/tl_servis.php` |
| Mobile top-up status check | `/servis/tl_kontrol.php` |
| Game PIN product list | `/servis/pin_listesi.php` |
| Send game PIN | `/servis/pin_ekle.php` |
| Game PIN status check | `/servis/pin_kontrol.php` |

---

## License / Ownership

This README is generated from the provided ZNET API document. Confirm production credentials, service URLs, and current API behavior with the API provider before deploying.
