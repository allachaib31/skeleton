# tafa3olcard

tafa3olcard is a multilingual platform for selling digital products and services: gift cards, game cards, subscription codes, social media services, temporary SMS numbers, API-connected products, manual warehouse codes, and payment-code balance top-ups.

This README is written as a product and design brief. It explains what the system sells, how the data is organized, and what screens the customer and admin experiences need.

## Brand Direction

- Product name: `tafa3olcard`
- Main font: Zain
- Primary action color: `#fdf001`
- Backend/admin dark background: `#100E22`
- Public landing page and dashboard content backgrounds: mostly white, with dark sections only where useful
- UI language: Arabic, English, and French with full RTL/LTR support
- Visual goal: clear marketplace experience for buyers, dense operational controls for admins

Use the yellow color for the strongest action on a screen: buy, add balance, create, submit order, save, or confirm. Avoid using yellow as a text color on bright backgrounds. When yellow is used as a background, text should be dark.

## Product Model

The platform catalog is organized in this order:

```txt
Service -> Category -> Product -> Product groups
```

### Service

A service is the top-level business area. Examples:

- PlayStation
- Steam
- PUBG
- Telegram numbers
- Instagram followers
- Netflix subscriptions
- Mobile top-up

Services are multilingual and can be shown, hidden, soft-deleted, sorted by drag and drop, and represented by an image.

### Category

A category belongs to one service. It groups related products inside the service.

Examples:

- PUBG UC
- PlayStation USA cards
- Instagram followers
- Telegram activations
- Razer Gold

Categories are multilingual, sortable, image-based, visible/hidden, and soft-deleted.

### Product

A product is what the client buys. It belongs to one service and one category. Products may be:

- Manual products using warehouse stock
- API products fulfilled by external providers
- Live-price products such as temporary SMS numbers
- Fixed packages with no quantity input
- Counter/quantity products where the client chooses amount
- Custom value products where the client chooses from fixed values

Important product data for design:

- Name and description are multilingual
- Product image is optional but important for marketplace cards
- Service number/API product ID may exist for provider matching
- Cost price and `forQuantity` control price calculation
- Quantity mode controls the buy form
- Requirements control extra client inputs, for example player ID, link, phone number, comments, country, or QR information
- Show, stock, quantity availability, dripfeed, refill, cancel, and soft-delete switches exist in admin
- Product may have multiple API connections, but one active API connection is used for fulfillment

### Product Groups

Product groups are marketing collections. They are not the same as categories.

Examples:

- Popular gift cards
- Best gaming offers
- Social media growth
- Top-up products

A product group has multilingual name, multilingual rich description, image, cover image, and a list of related product IDs. Designers should treat groups as landing sections, carousels, or curated shelves.

## Pricing Model

Final price is calculated from product cost plus pricing rules.

Priority:

1. Client special price, if it exists
2. Product special price, if it exists
3. Client service group level, if no special price exists
4. Promotions always apply after the base rule

If the client balance is below zero because open credit is used, `negativeValue` is used instead of the normal value for service groups and special prices.

Design implication:

- Product pages should show the final client price, not internal formulas.
- Admin simulation page should show each pricing rule step: cost, selected rule, before/after, promotion, final total, and whether the client can buy.
- Admin price forms need normal value and negative-balance value.

## Client Levels

Each client has one level group per service. Service groups define pricing and points:

- Pricing type: increase or percent
- Value
- Negative value
- Percent agent
- Entitlement value
- Default group for service

When the client buys products in a service, points can move the client from VIP1 to VIP2/VIP3 based on entitlement values.

Design implication:

- Client detail should show levels per service.
- Admin can move a client up/down.
- Level rows should display service, group, points, next threshold, and manual action buttons.

## Promotions

Promotions are stock/catalog pricing rules applied after the base price rule.

They can target:

- All products
- Specific service
- Specific category
- Specific product
- Specific client
- Specific client level group

Design implication:

- Admin promotion page needs filters, active dates, status, target badges, value type, usage count, and edit/soft-delete actions.
- Customer-facing product cards should show promotional price, old price if useful, and promotion badge only when the promotion is visible and active.

## Warehouse

Warehouse is used for manual code/card stock, not for all products.

Use warehouse for:

- Gift card codes
- Subscription codes
- PIN codes
- License keys
- Manually uploaded stock

Do not use warehouse for:

- Social media services
- Temporary number products
- API products fulfilled live without local stock

Warehouse concepts:

- Warehouse batch belongs to product
- Items are individual sellable codes or credentials
- Items have statuses such as available, sold, reserved, disabled
- Admin can import many items

Design implication:

- Admin needs warehouse list, item list, import modal/page, status filters, and counters.
- Product cards can show stock status, but never expose codes before purchase.

## API Groups

External APIs are configured in Settings > APIs. Each API has name, link, token, group, currency, balance, visibility, sync schedule where relevant, and soft-delete status.

Supported groups:

- Temporary number coding sites
- Number coding sites are renewable
- Social Media Service Providers
- Gift Card Providers
- Gift Card Providers2
- Special programming

Each group should have its own customer display style because the buying experience is different.

### Gift Card Providers

Used for gift cards, game cards, subscriptions, and digital-code products.

Provider products can be:

- `amount` with min/max: use counter quantity
- `package` with no quantity: fixed package
- `package` with min/max: quantity package
- `specificPackage` with fixed values: custom value selector

Customer screen recommendation:

- Marketplace grid with product image, category, price, availability, and quick buy
- Product details page with description, required fields, quantity/value selector, final price, and buy button
- Category pages should feel like a gift-card marketplace, not a technical API list

Admin import screen:

- Choose API group and API account
- Preview provider products
- Filter by name, category, status, product type, and quantity mode
- Auto-create categories or select an existing system category
- Import selected products in bulk
- Convert provider currency to dollar using settings currency price

### Gift Card Providers2

Used for ZNET-style providers. This group contains separate product families:

- Bill payment
- Airtime/mobile credit top-up
- Game PIN products

Customer screen recommendation:

- Game PINs: display like gift cards with game/category shelves
- Airtime: display operator cards, amount/denomination selector, phone input
- Bills: display institution list, bill form, amount, due date, and account/reference fields

Important provider fields for PIN products:

- `adi`: product name
- `aciklama`: provider description
- `oyun_id`: game ID
- `oyun_adi`: game/category name
- `fiyat`: provider buy price
- `kupur`: denomination
- `oyun_bilgi_id`: player info identifier

Design implication:

- Do not force all Gift Card Providers2 products into one generic screen.
- Use different form layouts for PIN, airtime, and bill products.

### Social Media Service Providers

Used for SMM-panel products: followers, likes, views, comments, traffic, subscriptions, and similar services.

Customer screen recommendation:

- This should look like an SMM website, not a gift-card store.
- Use platform/service navigation: Instagram, TikTok, YouTube, Telegram, Snapchat, Facebook, etc.
- Product table/list should show service name, min/max, rate/final price, refill, cancel, dripfeed, average start time/speed if available.
- Order form should adapt to the provider service type.

Common provider service types and required inputs:

- Default: link, quantity, optional runs and interval
- Package: link only
- SEO: link, quantity, keywords
- Custom Comments: link, comments
- Mentions with Hashtags: link, quantity, usernames, hashtags
- Mentions Custom List: link, usernames
- Mentions Hashtag: link, quantity, hashtag
- Mentions User Followers: link, quantity, username
- Mentions Media Likers: link, quantity, media URL
- Comment Likes: link, quantity, username
- Poll: link, quantity, answer number
- Comment Replies: link, username, comments
- Invites from Groups: link, quantity, groups
- Subscriptions: username, min, max, delay, optional posts, old posts, expiry
- Web Traffic: link, quantity, country, device, traffic type, keyword/referrer when required

Design implication:

- SMM product detail should be a structured order form with help text.
- Large textareas are required for comments, usernames, hashtags, keywords, groups, and replies.
- Refill/cancel badges are important.
- Min/max limits must be visible near quantity fields.

### Temporary Number Coding Sites

Used for temporary SMS activation numbers such as GrizzlySMS/SMS-Activate-style providers.

Important: this group does not create one product for every country. The product is the service/app, and countries are saved inside product API payload.

Internal mapping:

```txt
Provider service name -> Category
Provider service code -> Product
Countries -> Product API payload / visible country list
```

Stored product data:

- Service code, for example Telegram provider code
- Service name
- Countries with code, name, flag, last known price/count when available
- Dynamic price flag
- Cost price is a placeholder; real price is fetched live

Customer screen recommendation:

- App/service cards, for example Telegram, WhatsApp, Google, Facebook
- Product detail with country selector, flag, live price, availability count, and buy button
- After purchase, show reserved phone number, status, SMS code, refresh/check button, and cancel/finish actions where supported

Design implication:

- Country selection is a first-class part of the product page.
- Price and availability should look live/fresh.
- Do not show warehouse stock for this type.
- Do not show static product price as final truth without refreshing.

### Renewable Number Coding Sites

Used for longer-lived/renewable number products. This group should follow the temporary-number visual language but include renewal period, remaining time, renewal price, and renewal actions.

### Special Programming

Used for custom provider integrations that do not match the standard groups. Designer should keep screens flexible and data-driven, but admin must still see provider group, API account, product mapping, requirements, status, and logs.

## Customer-Facing Screens

### Landing Page

Purpose: explain the platform and drive login/register or browsing.

Recommended sections:

- Hero with tafa3olcard brand, short value proposition, search or primary action
- Product group shelves: gift cards, gaming, subscriptions, social media, temporary numbers
- How it works: add balance, choose product, submit requirements, receive code/service result
- Featured products/promotions
- Supported payment methods
- Trust/security notes: wallet balance, order tracking, support, multilingual

The landing page should not look like a generic SaaS template. It should show the actual product categories and marketplace feeling.

### Marketplace Home

Authenticated customer dashboard should prioritize buying:

- Wallet balance and open credit state
- Search bar
- Service/category navigation
- Product groups
- Promotions
- Recent orders
- Payment/add balance shortcut

### Service Page

Displays one service and its categories/products.

Gift-card style services:

- Product cards and category tabs
- Price, image, availability, promotion badge

SMM style services:

- Dense list/table, platform filters, min/max, refill/cancel/dripfeed badges

Temporary number services:

- Service cards with country selector or country-first browsing

### Product Detail / Buy Page

Every product detail needs:

- Product name, image, category, service
- Description/rules
- Final price
- Quantity/value selector based on quantity mode
- Dynamic requirements form
- Balance/open credit check
- Buy/submit order button

Do not use one static form for all products. The form must be generated from product type and requirements.

### Orders

Client order pages should include:

- Order list with filters: status, service, date, search
- Order detail page with product, quantity, price, requirements, provider status, created date
- Result area: delivered code, PIN, phone number, SMS code, provider order ID, or cancellation reason
- Status timeline: pending, processing, completed, cancelled, refunded

Special order displays:

- Gift card/manual code: show delivered code after completion
- SMM: show provider order ID, status, refill/cancel if allowed
- Temporary number: show phone number, SMS code polling, activation state
- Bill/top-up: show receipt fields and provider response

### Payments

Client payment screens:

- Add balance page
- Payment method selector: electronic gateway, bank/manual transfer, payment code
- Payment instructions with image/QR/bank fields where configured
- Upload proof image and serial/reference number when required
- Payment history
- Payment code redemption

Payment gateway types:

- Electronic gateway: name, link/token, image
- Bank/manual method: currency, description, additional fields such as QR code, image, account number, text information

### Profile

Client profile should include:

- Personal info: email, username, first/last name, phone with country code and flag
- Avatar
- Password/security and 2FA
- Referral/invitation number
- Balance, expenses, referral wins
- Service levels and points
- Special prices assigned to the client
- Sessions/login security

## Admin Screens

### Dashboard

Operational overview:

- Sales totals
- Balance movements
- Orders by status
- Low stock/manual warehouse alerts
- API unavailable products
- Payment requests
- Recent clients and audit logs

### Stocks

Subpages:

- Services
- Categories
- Service groups
- Products
- Add product
- Import products from API
- Product requirements
- Product groups
- Special product prices
- Warehouse batches
- Warehouse items
- Promotions

Admin design should be dense, sortable, searchable, paginated, and optimized for repeated operations.

### Settings

Subpages:

- Branding: app name, logo, favicon
- Currencies
- APIs and API balances/sync
- API simulation
- Payment gateways
- Payment codes and journal
- Pricing simulation

### Clients

Subpages:

- Clients table
- Client detail
- Client levels
- Client special prices
- All financial movements
- All client special prices

Client detail needs wallet controls:

- Add balance with payment method and comment
- Withdraw balance with comment
- Open credit limit, stored separately from balance

Open credit does not add money. It defines how negative the balance is allowed to go when buying.

## Admin Data Tables

General table behavior:

- Search and filters
- Pagination with page navigation and page size choices
- Bulk checkbox actions where needed
- Icon-only row actions with tooltips
- Soft delete, never hard delete business records
- Drag-and-drop sorting for services, categories, products, and requirements where supported
- Visible/hidden status badges
- Active/deleted status badges

## Multilingual Content

The platform supports Arabic, English, and French. Designers should expect:

- Multi-input fields for names and descriptions in admin
- RTL layout in Arabic
- LTR layout in English/French
- Public text, admin text, labels, empty states, buttons, toasts, table headers, and dialogs all translated

## Security And Trust UX

Design should make sensitive flows clear:

- 2FA setup and login verification
- Session management
- Audit/admin action visibility
- Payment proof upload
- Balance/open credit warnings
- API sync and unavailable product alerts
- Soft-delete status clearly visible to admins

## Technical Stack

- Frontend: React, Vite, TypeScript, TailwindCSS, TanStack Query, Zustand, i18next
- Backend: Node.js, Express, TypeScript, MongoDB/Mongoose, Zod, Socket.IO, queues, OpenAPI
- Uploads: Cloudinary-backed upload model
- Realtime: notifications and operational updates

## Engineering Rules For Contributors

- Do not hardcode visible frontend text. Use i18n keys.
- Do not hardcode backend response or email text. Use backend locale keys.
- Do not add protected routes without authentication and authorization checks.
- Do not add state-changing business behavior without audit logging.
- Do not skip notifications when a user needs to know about security, account, workflow, or admin-triggered events.
- Do not accept unvalidated request bodies, query params, route params, files, or environment variables.
- Do not leak secrets, tokens, cookies, stack traces, passwords, or private user data.
- Do not use hard delete for business data; use soft delete.

## Quality Gate

Before calling work complete, run the relevant checks:

```bash
npm run contract
npm run typecheck
npm run test
```

For focused backend work:

```bash
npm --prefix backend run typecheck
npm --prefix backend test
```

For focused frontend work:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend test
```

After code changes, update the graph:

```bash
graphify update .
```

## Related Documentation

- API product sync architecture: `docs/apis/product-sync-architecture.md`
- Gift Card Providers: `docs/apis/gift-card-providers.md`
- Gift Card Providers2: `docs/apis/gift-card-providers-2.md`
- Social Media Service Providers: `docs/apis/social-media-service-providers.md`
- Temporary Number Coding Sites: `docs/apis/temporary-number-coding-sites.md`
- Renewable Number Coding Sites: `docs/apis/renewable-number-coding-sites.md`
- Special Programming: `docs/apis/special-programming.md`
- Production notes: `docs/production.md`
- Agent rules: `AGENTS.md`
# newTafa3ol2
