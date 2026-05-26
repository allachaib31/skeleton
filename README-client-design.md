# tafa3olcard Client Website Design README

This README is a design and build guide for creating the **client-facing screens** of `tafa3olcard`: a modern multilingual digital-products marketplace for gift cards, game cards, subscriptions, social media services, temporary SMS numbers, mobile top-up, bill payments, and wallet payments.

The goal is not to build a generic SaaS dashboard. The client website must feel like a **premium digital marketplace**: fast, clean, visual, trustworthy, mobile-first, and beautiful.

---

## 1. Product Summary

`tafa3olcard` sells digital products and services through a wallet-based customer experience.

Customers should be able to:

- Browse services, categories, product groups, and promotions.
- Search quickly for products such as PlayStation, Steam, PUBG, Netflix, Telegram numbers, Instagram services, mobile top-up, and bill payments.
- Add balance using payment gateways, bank/manual transfer, payment codes, or uploaded proof.
- Buy products using dynamic forms based on product type.
- Track orders, delivery results, provider status, SMS codes, receipts, and refunds.
- Manage profile, wallet, levels, special prices, sessions, and security.

The public and customer UI must support:

- Arabic, English, and French.
- Full RTL and LTR layout switching.
- Mobile, tablet, and desktop screens.
- Clean marketplace visuals with strong trust signals.

---

## 2. Brand Direction

### Brand

- Product name: `tafa3olcard`
- Tone: modern, energetic, trustworthy, marketplace-focused
- Main font: `Zain`
- UI language: Arabic, English, French

### Colors

```css
--color-primary: #fdf001;
--color-dark: #100E22;
--color-text: #111827;
--color-muted: #6B7280;
--color-border: #E5E7EB;
--color-page: #FFFFFF;
--color-soft: #F8FAFC;
--color-success: #16A34A;
--color-warning: #F59E0B;
--color-danger: #DC2626;
--color-info: #2563EB;
```

### Color Rules

- Use `#fdf001` only for the strongest action on the screen.
- Primary actions include: **Buy**, **Add Balance**, **Submit Order**, **Confirm**, **Save**, **Redeem Code**.
- Do not use yellow as small text on white backgrounds.
- When yellow is used as a background, use dark text.
- Use dark sections only where they improve contrast, trust, or brand impact.
- Public and customer dashboard screens should mostly use white and soft backgrounds.

### Visual Style

The UI should feel:

- Modern
- Clean
- Bright
- Premium
- Fast
- Mobile-first
- Product-rich
- Trustworthy

Avoid:

- Generic SaaS hero sections
- Empty corporate templates
- Too many gradients
- Overloaded cards
- Admin-looking client pages
- Technical API wording shown to customers

---

## 3. Design Principles

### 3.1 Marketplace First

The client website is a store, not just a dashboard. Always prioritize:

- Product discovery
- Search
- Product images
- Price clarity
- Availability
- Fast buying
- Promotions
- Recent orders
- Wallet state

### 3.2 Product Type Controls the UI

Do not use one generic buy form for all products.

Different product families need different interfaces:

- Gift cards: visual marketplace cards and denomination selectors.
- SMM services: structured order forms with link, quantity, min/max, refill/cancel badges.
- Temporary numbers: app cards, country selector, live price, availability, SMS polling.
- Airtime/top-up: operator cards, phone input, amount selector.
- Bills: institution list, bill/reference fields, amount, receipt/result.

### 3.3 Trust Is Part of the Design

Make these states visible and clear:

- Wallet balance
- Open credit warning
- Payment status
- Order timeline
- Provider status
- Delivered code/result
- Refund/cancel reason
- Security sessions
- 2FA state

### 3.4 Multilingual From Day One

Every layout must work in Arabic, English, and French.

Rules:

- Never hardcode visible text in components.
- Use i18n keys.
- Mirror layouts for RTL Arabic.
- Keep icons direction-aware where needed.
- Avoid fixed-width text containers that break with longer French labels.

---

## 4. Layout System

### Public Website Layout

Used for landing, login, register, product browsing before authentication, and marketing sections.

Structure:

```txt
Top announcement / trust strip
Header
Hero / search / CTA
Product group shelves
Featured services
Featured products
How it works
Payment methods
Trust/security section
Footer
```

### Authenticated Client Layout

Used after login.

Desktop:

```txt
Sidebar or compact service navigation
Top bar with search, language, wallet, profile
Main content area
Right helper panel when useful
```

Mobile:

```txt
Top app bar
Search
Content
Sticky bottom navigation
Floating buy/add-balance action where useful
```

### Recommended Max Widths

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1440px;
```

### Spacing

Use a clean 4px/8px spacing system.

```txt
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
```

### Cards

Product cards should be visual and easy to scan.

Recommended style:

- White background
- 1px soft border
- 16px to 24px radius
- Subtle shadow on hover
- Image area with soft background
- Price and CTA clearly visible
- Promotion badge when active
- Availability badge when relevant

---

## 5. Core Client Screens

## 5.1 Landing Page

### Purpose

Introduce `tafa3olcard`, explain the marketplace, and push users to browse, login, or register.

### Sections

1. **Hero**
   - Brand headline
   - Short value proposition
   - Product search
   - Primary CTA: `Start Shopping` / `Create Account`
   - Secondary CTA: `Browse Products`
   - Visual collage of product cards: gift cards, gaming, subscriptions, social media, temporary numbers

2. **Product Group Shelves**
   - Popular gift cards
   - Best gaming offers
   - Social media growth
   - Temporary numbers
   - Mobile top-up

3. **How It Works**
   - Add balance
   - Choose product
   - Submit requirements
   - Receive code/service result
   - Track order

4. **Featured Promotions**
   - Promotional products
   - Old price/new price
   - Limited-time badges

5. **Supported Payments**
   - Gateway logos/cards
   - Bank/manual transfer
   - Payment code redemption

6. **Trust Section**
   - Wallet balance
   - Secure payments
   - Order tracking
   - Multilingual support
   - Fast delivery

7. **Footer**
   - Product categories
   - Support links
   - Terms/privacy
   - Language switcher

### Landing Page Visual Direction

Use a bright hero with dark accents. Add product-card previews so users instantly understand the store. The design should look like a digital marketplace, not a plain company landing page.

---

## 5.2 Login And Register

### Login Screen

Required elements:

- Email/username input
- Password input
- Remember me
- Forgot password
- Login button
- Register link
- Language selector
- 2FA verification step when required

### Register Screen

Required elements:

- Username
- Email
- Password
- Confirm password
- First name
- Last name
- Phone with country code and flag
- Referral/invitation number if available
- Terms agreement

### Design Notes

- Use split layout on desktop: form on one side, product/brand visual on the other.
- Use simple single-column layout on mobile.
- Keep error messages clear and close to the field.
- Do not make auth pages feel boring; show mini product cards or wallet/order illustrations.

---

## 5.3 Marketplace Home / Client Dashboard

### Purpose

After login, the customer should immediately know:

- Their wallet balance
- Whether they have open credit
- What they can buy
- Current promotions
- Recent orders
- Fast path to add balance

### Main Blocks

1. **Wallet Summary**
   - Current balance
   - Open credit state
   - Expenses
   - Add balance CTA

2. **Global Search**
   - Search services, categories, products
   - Show quick suggestions

3. **Service Navigation**
   - Gaming
   - Gift cards
   - Subscriptions
   - Social media
   - Temporary numbers
   - Mobile top-up
   - Bills

4. **Product Groups**
   - Horizontal shelves or responsive grids

5. **Promotions**
   - Discount badge
   - Old/new price
   - Product image

6. **Recent Orders**
   - Status
   - Product
   - Date
   - Result shortcut

7. **Payment Shortcut**
   - Add balance
   - Redeem payment code
   - Upload proof

---

## 5.4 Service Page

A service page displays one business area such as PlayStation, PUBG, Instagram, Telegram numbers, Netflix, or mobile top-up.

### Gift Card / Game / Subscription Service Layout

Use:

- Service hero with image/cover
- Category tabs
- Product cards
- Price
- Promotion badge
- Availability
- Quick buy button

### Social Media Service Layout

Use:

- Platform navigation: Instagram, TikTok, YouTube, Telegram, Snapchat, Facebook
- Filters by category/service type
- Dense product list or table
- Min/max
- Rate/final price
- Refill/cancel/dripfeed badges
- Buy/order button

### Temporary Number Service Layout

Use:

- App/service cards: Telegram, WhatsApp, Google, Facebook, etc.
- Country selector
- Flag
- Live price
- Availability count
- Buy button

---

## 5.5 Product Detail / Buy Page

Every product detail page needs:

- Product name
- Product image
- Service
- Category
- Description/rules
- Final client price
- Promotion/old price when active
- Quantity/value selector
- Dynamic requirements form
- Balance/open credit check
- Primary buy button
- Related products

### Quantity Modes

Support these UI modes:

1. **Fixed package**
   - No quantity input
   - Show one final price

2. **Counter quantity**
   - Quantity input with plus/minus
   - Show min/max when available
   - Recalculate total live

3. **Custom value selector**
   - Dropdown or pill selector for denominations/values
   - Show price for selected value

4. **Live price product**
   - Refresh price before purchase
   - Show last updated state
   - Make availability feel live

### Dynamic Requirements

Possible requirement fields:

- Player ID
- Username
- Profile link
- Phone number
- Country
- Comments
- Keywords
- Hashtags
- Groups
- QR/reference information
- Bill/reference number
- Custom text areas

### Buy Button States

- Normal: `Buy Now`
- Loading: `Checking...` / `Submitting...`
- Not enough balance: `Add Balance`
- Out of stock: `Out of Stock`
- Live price stale: `Refresh Price`
- Disabled product: `Unavailable`

---

## 5.6 Gift Card Product Experience

Use for:

- Gift cards
- Game cards
- Subscription codes
- PIN codes
- License keys
- Manual warehouse stock
- Gift card API products

### UI Pattern

- Visual grid
- Product image
- Brand/category
- Denomination or package
- Price
- Availability
- Promotion badge
- Quick buy

### Product Detail

- Denomination selector
- Quantity selector when supported
- Instructions/rules
- Final price
- Buy button
- Delivered code shown only after order completion

### Important Rule

Never expose warehouse codes before purchase completion.

---

## 5.7 Social Media Service Experience

Use for:

- Followers
- Likes
- Views
- Comments
- Traffic
- Subscriptions
- Telegram/Instagram/TikTok/YouTube services

### UI Pattern

This section should look like a professional SMM ordering website, not a gift card store.

Use:

- Platform tabs
- Dense service cards or table
- Service name
- Min/max
- Rate/final price
- Refill badge
- Cancel badge
- Dripfeed badge
- Average start time/speed if available

### Order Forms By Type

Support these fields based on service type:

| Service Type | Fields |
|---|---|
| Default | link, quantity, optional runs, optional interval |
| Package | link only |
| SEO | link, quantity, keywords |
| Custom Comments | link, comments textarea |
| Mentions With Hashtags | link, quantity, usernames, hashtags |
| Mentions Custom List | link, usernames textarea |
| Mentions Hashtag | link, quantity, hashtag |
| Mentions User Followers | link, quantity, username |
| Mentions Media Likers | link, quantity, media URL |
| Comment Likes | link, quantity, username |
| Poll | link, quantity, answer number |
| Comment Replies | link, username, comments textarea |
| Invites From Groups | link, quantity, groups textarea |
| Subscriptions | username, min, max, delay, posts, old posts, expiry |
| Web Traffic | link, quantity, country, device, traffic type, keyword/referrer |

### Design Notes

- Large textareas are required for comments, usernames, hashtags, keywords, groups, and replies.
- Min/max limits must be visible near quantity fields.
- Explain invalid links clearly.
- Show refill/cancel availability before purchase.

---

## 5.8 Temporary Number Experience

Use for SMS activation products such as Telegram, WhatsApp, Google, Facebook, and similar services.

### Product Model

- Product = app/service
- Countries = selectable options inside product API payload
- Price and count are live or recently synced

### UI Pattern

- App/service cards
- Country selector with flag
- Live price
- Availability count
- Refresh button
- Buy activation button

### After Purchase Screen

Show:

- Reserved phone number
- Country flag
- Activation status
- SMS code area
- Refresh/check button
- Cancel action where supported
- Finish/complete action where supported
- Timer or remaining time when relevant

### Important Rule

Do not show warehouse stock for temporary-number products. Do not show static product price as final truth without refreshing.

---

## 5.9 Airtime, Mobile Top-Up, And Bills

### Airtime / Mobile Credit

Use:

- Operator cards
- Phone input with country code
- Amount/denomination selector
- Final price
- Confirmation summary

### Bills

Use:

- Institution list
- Account/reference fields
- Amount
- Due date when available
- Confirmation screen
- Receipt/result area after payment

### Game PIN Products

Use gift-card style visual cards with game/category shelves.

---

## 5.10 Orders

### Order List

Filters:

- Status
- Service
- Product type
- Date
- Search

Columns/cards:

- Order number
- Product
- Quantity
- Total price
- Status
- Created date
- Result shortcut

### Order Detail

Show:

- Product
- Service/category
- Quantity
- Price
- Requirements submitted
- Provider status
- Created date
- Status timeline
- Result area

### Status Timeline

Use these states where applicable:

```txt
Pending -> Processing -> Completed
Pending -> Processing -> Cancelled -> Refunded
Pending -> Failed -> Refunded
```

### Special Result Areas

| Product Type | Result Area |
|---|---|
| Gift card/manual code | Delivered code/PIN after completion |
| SMM | Provider order ID, progress/status, refill/cancel actions |
| Temporary number | Phone number, SMS code, activation state, timer |
| Bill/top-up | Receipt fields and provider response |

---

## 5.11 Payments And Add Balance

### Add Balance Page

Required sections:

- Current wallet balance
- Amount input
- Payment method selector
- Payment instructions
- Proof upload if required
- Serial/reference number if required
- Submit payment request

### Payment Method Types

1. **Electronic gateway**
   - Gateway name
   - Gateway image/logo
   - Redirect or pay action

2. **Bank/manual transfer**
   - Currency
   - Description
   - Account number
   - QR/image
   - Extra fields
   - Upload proof

3. **Payment code**
   - Code input
   - Redeem button
   - Result message

### Payment History

Show:

- Date
- Method
- Amount
- Currency
- Status
- Reference
- Admin note when available

---

## 5.12 Profile And Account

Profile should include:

- Avatar
- Email
- Username
- First name
- Last name
- Phone with country code and flag
- Password/security
- 2FA setup
- Referral/invitation number
- Balance
- Expenses
- Referral wins
- Service levels and points
- Special prices assigned to the client
- Active sessions
- Login/security history where available

### Service Levels UI

Show rows/cards with:

- Service
- Current level
- Points
- Next threshold
- Benefits/discount summary

---

## 6. Component Library

Build reusable components.

### Navigation

- Public header
- Authenticated top bar
- Sidebar/service navigation
- Mobile bottom navigation
- Breadcrumbs
- Language switcher

### Marketplace

- Service card
- Category tab
- Product card
- Product group shelf
- Promotion badge
- Price block
- Availability badge
- Quick buy button
- Search command palette

### Forms

- Text input
- Password input
- Phone input with country
- Number/counter input
- Select
- Radio cards
- Denomination selector
- Country selector with flag
- Textarea
- File upload
- QR/image instruction block
- Dynamic requirement renderer

### Orders

- Order status badge
- Order timeline
- Result card
- Delivered code card
- SMS activation panel
- Receipt card

### Wallet And Payments

- Wallet balance card
- Open credit warning
- Payment method card
- Payment proof uploader
- Payment history table/card
- Payment code redemption card

### Feedback

- Toasts
- Empty states
- Loading skeletons
- Error states
- Confirmation modal
- Not-enough-balance modal
- Live price refresh state

---

## 7. Responsive Design Rules

### Mobile First

Most customers will likely buy from mobile. Design mobile first.

Mobile rules:

- Use sticky bottom navigation.
- Keep buy/add-balance CTA reachable.
- Product cards should be 1 or 2 columns depending on width.
- Forms should be single-column.
- Avoid dense tables on mobile; use cards instead.
- Keep wallet balance visible in the dashboard.

### Tablet

- 2 to 3 product columns.
- Sidebar can collapse.
- Shelves can become horizontal carousels.

### Desktop

- 4 to 6 product columns depending on card size.
- Use left navigation or category sidebar.
- Use right summary panel on checkout/buy screens.

---

## 8. RTL / LTR Rules

The UI must work in Arabic, English, and French.

### Arabic RTL

- Direction: `rtl`
- Sidebar and icons mirror.
- Back/forward arrows mirror.
- Text aligns right.
- Price numbers can remain readable using localized formatting.

### English/French LTR

- Direction: `ltr`
- Text aligns left.
- Layout returns to normal left-to-right flow.

### Implementation Notes

- Use logical CSS classes where possible: `ms-*`, `me-*`, `ps-*`, `pe-*`.
- Avoid hardcoded `left` and `right` unless necessary.
- Use i18n keys for every label, button, empty state, toast, and error.

---

## 9. UX States

Every screen should include states for:

- Loading
- Empty
- Error
- Success
- Disabled
- Not enough balance
- Out of stock
- Product unavailable
- Live price stale
- Payment pending
- Order processing
- Order completed
- Order cancelled/refunded

### Empty State Examples

- No products found
- No orders yet
- No payment history
- No active promotions
- No available countries
- No SMS code received yet

Use helpful empty states with clear next actions.

---

## 10. Frontend Technical Stack

Recommended stack:

- React
- Vite
- TypeScript
- TailwindCSS
- TanStack Query
- Zustand
- i18next
- React Hook Form
- Zod
- Socket.IO client for realtime updates

### Suggested Frontend Structure

```txt
frontend/
  src/
    app/
      router.tsx
      providers.tsx
    assets/
    components/
      common/
      layout/
      marketplace/
      product/
      orders/
      payments/
      profile/
      forms/
    features/
      auth/
      marketplace/
      products/
      orders/
      payments/
      wallet/
      profile/
      temporary-numbers/
      smm/
    hooks/
    i18n/
      ar.json
      en.json
      fr.json
    lib/
      api.ts
      format.ts
      validation.ts
    styles/
      globals.css
    types/
```

---

## 11. Suggested Routes

```txt
/
/login
/register
/forgot-password

/app
/app/search
/app/services
/app/services/:serviceSlug
/app/services/:serviceSlug/categories/:categorySlug
/app/products/:productSlug
/app/products/:productSlug/buy

/app/orders
/app/orders/:orderId

/app/payments/add-balance
/app/payments/history
/app/payments/redeem-code

/app/profile
/app/profile/security
/app/profile/levels
/app/profile/special-prices
/app/profile/sessions
```

---

## 12. Data Models Needed By UI

### Service

```ts
type Service = {
  id: string;
  slug: string;
  name: LocalizedText;
  image?: string;
  coverImage?: string;
  visible: boolean;
  sortOrder: number;
};
```

### Category

```ts
type Category = {
  id: string;
  serviceId: string;
  slug: string;
  name: LocalizedText;
  image?: string;
  visible: boolean;
  sortOrder: number;
};
```

### Product

```ts
type Product = {
  id: string;
  serviceId: string;
  categoryId: string;
  slug: string;
  name: LocalizedText;
  description?: LocalizedText;
  image?: string;
  type: 'gift_card' | 'smm' | 'temporary_number' | 'airtime' | 'bill' | 'custom';
  quantityMode: 'fixed' | 'counter' | 'custom_value' | 'live_price';
  finalPrice: number;
  oldPrice?: number;
  currency: string;
  promotion?: PromotionBadge;
  availability: 'available' | 'low_stock' | 'out_of_stock' | 'unavailable';
  requirements: ProductRequirement[];
  minQuantity?: number;
  maxQuantity?: number;
  values?: ProductValue[];
  badges?: ProductBadge[];
};
```

### Product Requirement

```ts
type ProductRequirement = {
  id: string;
  key: string;
  label: LocalizedText;
  helpText?: LocalizedText;
  type: 'text' | 'number' | 'textarea' | 'select' | 'country' | 'phone' | 'file' | 'url';
  required: boolean;
  options?: Array<{ label: LocalizedText; value: string }>;
};
```

---

## 13. Design Quality Checklist

Before approving any screen, check:

- Does it look like a real digital marketplace?
- Is the main action obvious?
- Is the price clear?
- Is wallet/balance state clear where buying happens?
- Is the form adapted to the product type?
- Does it work on mobile?
- Does it work in Arabic RTL?
- Are loading, empty, and error states designed?
- Are promotion and availability states clear?
- Is technical provider/API wording hidden from customers?
- Are security and payment states trustworthy?

---

## 14. Build Rules

- Do not hardcode visible text. Use i18n keys.
- Do not build one static product form for all product types.
- Do not expose warehouse codes before order completion.
- Do not show static price as final truth for live-price temporary-number products.
- Do not ignore not-enough-balance and open-credit states.
- Do not use admin-style dense tables for normal customer marketplace browsing.
- Do not design Arabic as an afterthought.
- Do not use yellow for every button; reserve it for the strongest action.

---

## 15. First Screens To Design

Start with these screens in order:

1. Landing page
2. Login/Register
3. Marketplace home/client dashboard
4. Service page for gift cards
5. Service page for social media services
6. Temporary number product page
7. Gift card product detail/buy page
8. SMM order form page
9. Add balance page
10. Orders list and order detail
11. Profile/security page

---

## 16. Example AI Design Prompt

Use this prompt when generating design concepts with an AI design tool:

```txt
Design a modern, premium, multilingual digital-products marketplace called tafa3olcard.
The website sells gift cards, game cards, subscriptions, social media services, temporary SMS numbers, mobile top-up, bill payments, and wallet balance products.

Use a mostly white marketplace design with dark premium sections and primary yellow action color #fdf001. Main font is Zain. The UI must support Arabic RTL, English LTR, and French LTR.

Create client-facing screens, not admin screens. The design must feel like a beautiful digital marketplace, not a generic SaaS template.

Required screens:
- Landing page with hero, search, product shelves, how it works, payment methods, trust section.
- Client dashboard with wallet balance, search, service navigation, product groups, promotions, recent orders, add balance shortcut.
- Service page for gift cards with category tabs and product cards.
- Service page for social media services with platform filters, min/max, refill/cancel/dripfeed badges.
- Product detail/buy page with dynamic requirements form, final price, quantity/value selector, balance check, and buy button.
- Temporary number page with app card, country selector, flag, live price, availability count, reserved number, SMS code polling, cancel/finish actions.
- Add balance page with payment method selector, payment instructions, proof upload, and payment history.
- Orders list and order detail with status timeline and result area.
- Profile/security page with personal info, 2FA, service levels, special prices, and sessions.

Design style:
- Clean cards, rounded corners, subtle shadows, strong product imagery.
- Yellow only for the strongest action.
- Mobile-first responsive layout.
- Trustworthy payment and order status UX.
- Clear empty/loading/error states.
```

---

## 17. Definition Of Done

The client design is ready when:

- All first-priority screens are designed for desktop and mobile.
- Arabic RTL layout is tested.
- Product types have different UI patterns.
- Dynamic product forms are represented.
- Wallet, payment, order, and trust states are clear.
- Components are reusable.
- Visual style feels modern, beautiful, and marketplace-specific.
