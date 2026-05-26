# tafa3olcard Cloud Design Brief

This file is for cloud/product designers. It describes the screens, visual hierarchy, and design rules needed for the customer-facing cloud platform and the admin cloud dashboard.

## Design Goal

tafa3olcard should feel like a cloud marketplace for digital products and services:

- Fast to browse
- Easy to buy
- Clear wallet and payment state
- Different displays for different product types
- Strong admin controls without looking like a generic template

The design must support Arabic, English, and French. Arabic is RTL and must be treated as a first-class layout, not an afterthought.

## Visual Identity

- Font: Zain
- Primary action: `#fdf001`
- Admin/backend dark surface: `#100E22`
- Public and client dashboard backgrounds: mostly white
- Use dark text on yellow buttons
- Avoid yellow text on light backgrounds
- Use cards for products and repeated items only
- Use dense tables for admin and SMM product lists

## Customer Cloud Screens

### 1. Landing Page

Purpose: introduce tafa3olcard and guide users to register, login, or browse.

Sections:

- Hero with brand name, marketplace search, and strong action button
- Featured product groups
- Gift cards and game cards
- Social media services
- Temporary number services
- Payment methods
- How it works: add balance, choose product, submit details, receive result
- Support/trust area

The landing page must show real platform categories. Do not make it look like a generic SaaS landing page.

### 2. Customer Dashboard

Main content:

- Wallet balance
- Open credit warning when applicable
- Add balance button
- Recent orders
- Favorite or recently used services
- Promotions
- Product group shelves
- Search input

Balance should be highly visible. If the balance is negative, show it clearly with the allowed open credit limit.

### 3. Marketplace Browse

Use three navigation layers:

```txt
Service -> Category -> Product
```

Service browsing:

- Service cards with image, name, and short description
- Category tabs or side filter after service selection
- Product list changes depending on service type

Gift-card services:

- Product grid
- Image, price, category, stock/availability, promotion badge

SMM services:

- Dense service table
- Min/max quantity
- Refill/cancel/dripfeed badges
- Search and platform filters

Temporary number services:

- App/service cards
- Country selector with flag
- Live price and availability

### 4. Product Detail

Shared elements:

- Product image/name/category/service
- Description and rules
- Quantity mode area
- Dynamic requirements form
- Final price
- Balance check
- Buy button

Quantity modes:

- Without quantity: no quantity input
- Quantity: min/max quantity input
- Counter: counter input using provider min/max
- Customize: select or enter fixed values

### 5. Order Flow

Order steps:

1. Select product
2. Fill requirements
3. Confirm price and balance
4. Submit order
5. Track status
6. Receive code/result

Order detail should include:

- Product summary
- Requirements submitted
- Price and balance movement
- Status timeline
- Provider status when available
- Result area

Special result displays:

- Gift card/code: delivered code, PIN, serial
- SMM: provider order ID, refill/cancel availability
- Temporary number: phone number, SMS code, refresh/check status
- Bill/top-up: receipt-style result

### 6. Payments

Payment screens:

- Add balance
- Choose payment method
- Bank/manual payment instructions
- QR/image/text fields
- Upload proof if required
- Serial/reference number if required
- Payment code redeem
- Payment history

Payment method display:

- Electronic gateway: logo, name, action button
- Bank/manual: bank logo, currency, QR, account information, copy buttons
- Payment code: simple redeem form with security-friendly error messages

### 7. Profile

Profile sections:

- Personal info
- Avatar
- Phone and country flag
- Password
- 2FA
- Sessions
- Referral code
- Balance and expenses
- Client levels per service
- Special prices

## Admin Cloud Screens

### Dashboard

Dashboard cards:

- Total sales
- Total deposits
- Total withdrawals
- Pending orders
- API sync errors
- Low warehouse stock
- Recent clients
- Recent financial movements

### Stocks

Admin stocks navigation:

- Services
- Categories
- Service groups
- Products
- Add product
- Import products from API
- Product requirements
- Product groups
- Special product prices
- Warehouse
- Warehouse items
- Promotions

Admin tables must support:

- Search
- Filters
- Pagination
- Page size
- Checkbox bulk actions
- Icon-only row actions
- Soft-delete state
- Visibility state
- Drag-and-drop sorting when relevant

### Settings

Settings pages:

- Branding: app name, logo, favicon
- Currencies
- APIs
- API simulation
- Payment gateways
- Payment codes
- Payment code journal
- Pricing simulation

API table should show:

- API name
- Group
- Currency
- Balance
- Sync status
- Last sync
- Force sync action

### Clients

Client management:

- Client table
- Add/edit client modal
- Client detail page
- Balance add/withdraw
- Open credit edit
- Financial movements
- Levels
- Special prices

Client detail must make these different:

- Balance is real money.
- Open credit is a negative allowed limit, not money added to balance.
- Financial movements change balance.
- Open credit does not create a financial movement.

## Product Type Display Rules

### Gift Cards

Use marketplace cards:

- Strong image
- Category
- Final price
- Stock status
- Promotion badge

### Gift Card Providers2

Use different templates:

- PIN products: gift-card display
- Airtime: operator + amount form
- Bills: institution + bill fields form

### Social Media Services

Use SMM-style service table:

- Service name
- Min/max
- Final price/rate
- Refill
- Cancel
- Dripfeed
- Requirements

Order form should adapt to service type: link, quantity, comments, keywords, usernames, hashtags, poll answer, subscription settings, traffic settings.

### Temporary Numbers

Use live-service display:

- App/service name
- Country flags
- Live price
- Available count
- Buy number button
- SMS status panel after purchase

Do not show temporary numbers like gift cards.

## Empty States

Every page needs a clear empty state:

- No services
- No categories
- No products
- No orders
- No payments
- No warehouse items
- No promotions
- No API products found

Empty states should include the next action for admins and a useful browse/search action for clients.

## Responsive Design

Mobile:

- Bottom-friendly actions
- Product cards in one column
- Tables become list rows or horizontally scroll only for admin-heavy views
- Keep buy/add balance buttons visible

Desktop:

- Dense admin layout
- Side navigation
- Multi-column product grids
- Filter bars above tables

## Designer Checklist

- Uses Zain font
- Uses yellow only for primary actions
- Supports RTL and LTR
- Has separate layouts for gift cards, SMM, and temporary numbers
- Shows wallet state clearly
- Shows order status timeline
- Shows payment instructions clearly
- Avoids generic SaaS sections
- Avoids decorative UI that hides product information
- Keeps admin screens dense and operational
