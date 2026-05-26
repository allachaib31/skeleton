# Social Media Service Providers

Examples: SMM panels using the common `key/action` API format.

Use this group for followers, likes, views, comments, traffic, subscriptions, and similar services.

## Provider Product Source

Provider product source is the `services` action.

Typical fields:

- `service`
- `name`
- `type`
- `category`
- `rate`
- `min`
- `max`
- `refill`
- `cancel`

## Internal Mapping

Recommended relation:

```txt
Provider platform/category -> StockService
Provider category/type -> StockCategory
Provider service row -> StockProduct
```

Recommended `apiProductKey`:

```txt
apiId + providerServiceId
```

## StockProduct Fields

- `serviceId`: mapped platform service, for example Instagram, TikTok, YouTube, Telegram
- `categoryId`: mapped provider category or internal subcategory
- `name`: provider service name
- `description`: provider notes and rules
- `costPrice`: provider `rate`, converted to dollar using the API currency
- `forQuantity`: provider `min` for quantity/counter services, otherwise `1`
- `productQuantityMode`: derived from provider `type`, `min`, and `max`
- `minQuantity`: provider `min`
- `maxQuantity`: provider `max`
- `apiId`: settings API account ID
- `apiGroup`: `SOCIAL_MEDIA_SERVICE_PROVIDERS`
- `apiProductId`: provider `service`
- `apiProductKey`: `apiId + providerServiceId`
- `apiPayload`: full provider service row

## Requirements By Provider Type

The product `type` controls required order fields.

Supported types:

- `Default`: link, quantity, optional runs/interval
- `Package`: link
- `SEO`: link, quantity, keywords
- `Custom Comments`: link, comments
- `Mentions with Hashtags`: link, quantity, usernames, hashtags
- `Mentions Custom List`: link, usernames
- `Mentions Hashtag`: link, quantity, hashtag
- `Mentions User Followers`: link, quantity, username
- `Mentions Media Likers`: link, quantity, media
- `Custom Comments Package`: link, comments
- `Comment Likes`: link, quantity, username
- `Poll`: link, quantity, answer number
- `Comment Replies`: link, username, comments
- `Invites from Groups`: link, quantity, groups
- `Subscriptions`: username, min, max, delay, optional posts/old posts/expiry
- `Web Traffic`: link, quantity, country, device, traffic type, optional keyword/referrer

When importing products, create missing product requirements from the provider `type`.

Do not create client requirements for:

- `service`: this is the provider product ID and is saved in `apiProductId`
- `quantity`: this is handled by product quantity selection

Create requirements for fields such as:

- `link`
- `comments`
- `keywords`
- `usernames`
- `hashtags`
- `hashtag`
- `username`
- `media`
- `answer_number`
- `groups`
- `country`
- `device`
- `type_of_traffic`
- `google_keyword`
- `referring_url`

## Product Quantity Mode Rules

### Fixed Package

When:

```txt
type = Package
min = max
```

Map to:

```txt
productQuantityMode = WITHOUT_QUANTITY
costPrice = rate
forQuantity = 1
```

Meaning:

The provider sells a fixed package. The client does not choose a quantity.

Example:

```json
{
  "service": 21595,
  "name": "SnapChat Followers Package 100 Followers",
  "type": "Package",
  "rate": "10.6722",
  "min": 1,
  "max": 1,
  "dripfeed": false,
  "refill": false,
  "cancel": false,
  "category": "SnapChat [Followers - Arab] [Type: Multiple Packages]"
}
```

### Quantity Service

When:

```txt
type = Default
min < max
```

Map to:

```txt
productQuantityMode = COUNTER
costPrice = rate
forQuantity = min
minQuantity = min
maxQuantity = max
```

Meaning:

The provider `rate` is the buy price for the minimum quantity. For example, if `min = 1000` and `rate = 33.8646`, then `33.8646` is the cost for 1000 units.

Example:

```json
{
  "service": 12656,
  "name": "SnapChat Followers Server #1",
  "type": "Default",
  "rate": "33.8646",
  "min": 1000,
  "max": 25000,
  "dripfeed": false,
  "refill": false,
  "cancel": false,
  "category": "SnapChat [Followers - Arab] [Type: Quantity Services]"
}
```

## Fulfillment Flow

1. Client fills product requirements.
2. Backend validates requirements based on provider `type`.
3. Backend checks final price and balance/open credit.
4. Backend sends `add` action to provider.
5. Save provider order ID on local order.
6. Poll `status` for one or many orders.
7. Support refill/cancel only if provider row allows it.

## Sync Rules

- Update `costPrice`, `minQuantity`, `maxQuantity`, refill support, cancel support, and raw payload.
- Keep admin translated name/description if edited.
- Mark provider missing rows as unavailable, do not delete.
- Do not use warehouse.
