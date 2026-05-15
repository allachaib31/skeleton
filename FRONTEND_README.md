# Advanced React + Vite + TailwindCSS Frontend Skeleton

## Enterprise Production-Ready Frontend Architecture

Production-ready frontend skeleton using:

- React
- Vite
- TypeScript
- TailwindCSS
- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Socket.IO Client
- i18next
- SEO-ready architecture
- Reusable components
- Clean code structure
- Scalable frontend architecture

---

# 1. Project Goal

Build a clean, scalable, reusable, SEO-friendly frontend skeleton ready for:

- SaaS dashboards
- Admin panels
- User portals
- E-commerce frontends
- Marketplaces
- Mobile-first web apps
- Realtime applications
- Public landing pages
- Authentication-based apps

The project must support:

- Clean architecture
- Reusable components
- SEO optimization
- Secure authentication flow
- Realtime Socket.IO events
- Multi-language support
- Fast loading
- Good developer experience
- Maintainable codebase

---

# 2. Tech Stack

## Core

- React
- Vite
- TypeScript
- TailwindCSS

## Routing

- React Router

## Server State

- TanStack Query

## Client State

- Zustand

## Forms

- React Hook Form
- Zod

## Realtime

- Socket.IO Client

## HTTP Client

- Axios

## i18n

- i18next
- react-i18next

## SEO

- React Helmet Async
- Sitemap generation
- Robots.txt
- Metadata configuration

## Testing

- Vitest
- React Testing Library
- Playwright

## Code Quality

- ESLint
- Prettier
- Husky
- lint-staged

---

# 3. Recommended Project Structure

```txt
src/
  main.tsx
  app/
    App.tsx
    providers/
      QueryProvider.tsx
      RouterProvider.tsx
      ThemeProvider.tsx
      I18nProvider.tsx
      SocketProvider.tsx
      AuthProvider.tsx

  assets/
    images/
    icons/
    fonts/

  config/
    env.config.ts
    api.config.ts
    routes.config.ts
    seo.config.ts
    socket.config.ts
    i18n.config.ts
    theme.config.ts

  routes/
    index.tsx
    public.routes.tsx
    private.routes.tsx
    admin.routes.tsx

  layouts/
    RootLayout.tsx
    PublicLayout.tsx
    AuthLayout.tsx
    DashboardLayout.tsx
    AdminLayout.tsx

  pages/
    public/
      HomePage.tsx
      AboutPage.tsx
      ContactPage.tsx
      NotFoundPage.tsx

    auth/
      LoginPage.tsx
      RegisterPage.tsx
      ForgotPasswordPage.tsx
      ResetPasswordPage.tsx
      VerifyEmailPage.tsx

    user/
      ProfilePage.tsx
      SettingsPage.tsx
      NotificationsPage.tsx

    admin/
      DashboardPage.tsx
      UsersPage.tsx
      RolesPage.tsx
      AuditLogsPage.tsx

  features/
    auth/
      api/
      components/
      hooks/
      schemas/
      stores/
      types/

    users/
      api/
      components/
      hooks/
      schemas/
      types/

    admin/
      api/
      components/
      hooks/
      schemas/
      types/

    uploads/
      api/
      components/
      hooks/
      types/

    notifications/
      api/
      components/
      hooks/
      socket/
      types/

  shared/
    components/
      ui/
        Button.tsx
        Input.tsx
        Modal.tsx
        Table.tsx
        Pagination.tsx
        Dropdown.tsx
        Card.tsx
        Badge.tsx
        Spinner.tsx
        EmptyState.tsx
        ErrorState.tsx

      forms/
        FormField.tsx
        PasswordInput.tsx
        SearchInput.tsx
        FileUpload.tsx

      layout/
        Header.tsx
        Sidebar.tsx
        Footer.tsx
        Breadcrumb.tsx

      seo/
        SEO.tsx
        JsonLd.tsx

    hooks/
      useDebounce.ts
      useDisclosure.ts
      useMediaQuery.ts
      usePagination.ts
      usePermissions.ts

    lib/
      api/
        axios.ts
        interceptors.ts
        endpoints.ts

      socket/
        socket.client.ts
        socket.events.ts

      auth/
        token.service.ts
        session.service.ts

      storage/
        localStorage.ts
        sessionStorage.ts

      seo/
        generateMetadata.ts

      utils/
        cn.ts
        date.ts
        format.ts
        errors.ts

    constants/
      routes.ts
      roles.ts
      permissions.ts
      queryKeys.ts

    types/
      api.types.ts
      auth.types.ts
      common.types.ts

  locales/
    en.json
    fr.json
    ar.json

  styles/
    globals.css
    tailwind.css

  tests/
```

---

# 4. Installation

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom axios @tanstack/react-query zustand
npm install react-hook-form zod @hookform/resolvers
npm install socket.io-client
npm install i18next react-i18next
npm install react-helmet-async
npm install clsx tailwind-merge
npm install lucide-react
npm install sonner
npm install date-fns
npm install -D eslint prettier vitest @testing-library/react @testing-library/jest-dom playwright husky lint-staged
```

---

# 5. Environment Variables

Create `.env`:

```env
VITE_APP_NAME=Advanced Frontend
VITE_APP_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_DEFAULT_LANGUAGE=en
VITE_ENABLE_SEO=true
VITE_ENABLE_ANALYTICS=false
```

Environment variables must be validated before app startup.

---

# 6. Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "e2e": "playwright test",
    "typecheck": "tsc --noEmit"
  }
}
```

---

# 7. Architecture Rules

## Mandatory Rules

- Use TypeScript everywhere
- Use feature-based architecture
- Keep pages thin
- Keep business logic inside hooks/services
- Keep API calls inside feature API files
- Keep UI components reusable
- Never duplicate components
- Never put API calls directly inside pages
- Never put business logic inside JSX
- Never use `any` unless impossible
- Use absolute imports
- Use schema validation for forms
- Use centralized error handling

---

# 8. Clean Code Rules

## Components

Components must be:

- Small
- Reusable
- Typed
- Single responsibility
- Easy to test
- Independent from business logic when possible

Good:

```tsx
<Button variant="primary" size="md" isLoading={isPending}>
  Save
</Button>
```

Bad:

```tsx
<button className="bg-blue-500 px-4 py-2 text-white">
  Save
</button>
```

## Naming

```txt
Components: PascalCase
Hooks: useSomething
Types: SomethingType
Schemas: somethingSchema
Constants: UPPER_CASE
Files: kebab-case or dot naming
```

Examples:

```txt
UserTable.tsx
useUserProfile.ts
user.schema.ts
user.api.ts
user.types.ts
```

---

# 9. TailwindCSS Configuration

## Required

- Design tokens
- Theme colors
- Font system
- Spacing standard
- Dark mode support
- RTL support for Arabic
- Reusable component classes
- No random values unless needed

## Global CSS

```css
@import "tailwindcss";

html {
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
}
```

## Utility Helper

```ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}
```

---

# 10. Routing System

## Route Groups

```txt
Public routes
Auth routes
Private user routes
Admin routes
```

## Example Routes

```txt
/                  Home
/about             About
/contact           Contact

/login             Login
/register          Register
/forgot-password   Forgot password
/reset-password    Reset password
/verify-email      Verify email

/app/profile       User profile
/app/settings      User settings
/app/notifications User notifications

/admin/dashboard   Admin dashboard
/admin/users       Admin users
/admin/roles       Admin roles
/admin/audit-logs  Admin audit logs
```

## Protected Route

```tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

## Permission Route

```tsx
export function PermissionRoute({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const hasPermission = usePermissions(permission);

  if (!hasPermission) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
```

---

# 11. API Layer

## Axios Instance

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});
```

## Response Interceptor

```ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh token or logout
    }

    return Promise.reject(error);
  }
);
```

## API Response Type

```ts
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  errors?: unknown;
};
```

---

# 12. TanStack Query

## Required

- Centralized query keys
- Proper staleTime
- Proper cacheTime/gcTime
- Retry rules
- Error handling
- Optimistic updates when useful
- Invalidate queries after mutation

## Query Key Example

```ts
export const queryKeys = {
  auth: ["auth"] as const,
  me: ["auth", "me"] as const,
  users: (params: unknown) => ["users", params] as const,
  notifications: ["notifications"] as const,
};
```

## Hook Example

```ts
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });
}
```

---

# 13. State Management

Use Zustand only for client state.

## Store Examples

- Auth store
- UI store
- Theme store
- Language store
- Socket store

## Auth Store

```ts
type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
};
```

Server data must stay in TanStack Query, not Zustand.

---

# 14. Authentication Flow

## Required Pages

- Login
- Register
- Forgot password
- Reset password
- Verify email
- Logout

## Security Rules

- Use HTTP-only cookies for refresh token
- Do not store refresh token in localStorage
- Access token can be in memory
- Auto refresh access token
- Logout clears client state
- Handle expired session
- Protect private routes
- Protect admin routes
- Check permissions from backend

---

# 15. Forms

Use:

- React Hook Form
- Zod
- @hookform/resolvers

## Example

```tsx
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

## Form Rules

- Validate all fields
- Show translated error messages
- Disable submit while loading
- Prevent double submit
- Handle backend validation errors
- Keep forms reusable

---

# 16. SEO Strategy

## Important Note

React + Vite is client-side rendered by default.

For maximum SEO, use one of these:

```txt
Best: React Router with SSR / Remix / Next.js
Good: Vite SSR
Acceptable: Pre-render static public pages
Weak: CSR only
```

If the project contains public marketing pages that must rank well, add SSR or pre-rendering.

## Required SEO Features

- Dynamic title
- Dynamic description
- Canonical URL
- Open Graph tags
- Twitter cards
- JSON-LD structured data
- Sitemap.xml
- Robots.txt
- Clean URLs
- 404 page
- Fast loading
- Image alt text
- Semantic HTML

## SEO Component

```tsx
import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
};

export function SEO({ title, description, canonical, image }: SEOProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
    </Helmet>
  );
}
```

## Public Page Example

```tsx
export function HomePage() {
  return (
    <>
      <SEO
        title="Home | Advanced Frontend"
        description="Modern React frontend skeleton built with Vite and TailwindCSS."
        canonical="https://example.com/"
      />

      <main>
        <h1>Advanced Frontend Skeleton</h1>
      </main>
    </>
  );
}
```

---

# 17. Performance Rules

## Required

- Lazy loading routes
- Code splitting
- Image optimization
- Use WebP/AVIF
- Compress assets
- Remove unused code
- Avoid unnecessary re-renders
- Memoize expensive calculations
- Use pagination
- Use virtualized lists for large tables
- Use skeleton loaders
- Use caching

## Lazy Route Example

```tsx
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
```

---

# 18. Socket.IO Configuration

## Use Cases

- Realtime notifications
- User online/offline status
- Admin live dashboard
- Chat-ready architecture
- Upload status updates
- Audit log events

## Socket Client

```ts
import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket"],
});
```

## Socket Provider

```tsx
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      socket.connect();
    }

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  return children;
}
```

## Socket Events

```ts
export const socketEvents = {
  notificationNew: "notification:new",
  userOnline: "user:online",
  userOffline: "user:offline",
  adminAuditLog: "admin:audit-log",
  uploadCompleted: "upload:completed",
};
```

## Socket Rules

- Connect only after authentication
- Disconnect on logout
- Never trust socket payloads
- Do not expose sensitive data
- Use typed events
- Remove listeners on unmount

---

# 19. Notification System

## Features

- Realtime notification receive
- Notification list
- Mark as read
- Mark all as read
- Unread count
- Toast display
- Notification preferences

## Routes

```txt
/app/notifications
```

---

# 20. Upload System

## Features

- Avatar upload
- Image preview
- File validation
- Progress indicator
- Error handling
- Cloudinary backend upload
- Replace old image

## Rules

- Do not upload directly with Cloudinary secret
- Use backend upload endpoint
- Validate file type
- Validate file size
- Show preview before upload
- Allow remove/cancel

---

# 21. Multi-language i18n

## Languages

```txt
en
fr
ar
```

## Requirements

- Language switcher
- Persist selected language
- Use Accept-Language with API
- RTL support for Arabic
- Translate validation messages
- Translate UI labels
- Translate SEO metadata

## Example

```ts
api.interceptors.request.use((config) => {
  config.headers["Accept-Language"] = i18n.language;
  return config;
});
```

---

# 22. Theme System

## Required

- Light mode
- Dark mode
- System mode
- Persist selected theme
- Tailwind dark mode support

## Theme Values

```txt
light
dark
system
```

---

# 23. Admin Frontend

## Admin Pages

```txt
/admin/dashboard
/admin/users
/admin/users/:id
/admin/roles
/admin/permissions
/admin/audit-logs
/admin/uploads
/admin/settings
```

## Admin Components

- Stats cards
- Data tables
- Filters
- Search
- Pagination
- User status badge
- Role editor
- Permission viewer
- Audit log table

## Admin Rules

- Admin layout separated
- Admin routes protected
- Admin permissions checked
- Never depend only on frontend checks
- Backend must enforce every permission

---

# 24. User Frontend

## User Pages

```txt
/app/profile
/app/settings
/app/security
/app/notifications
/app/sessions
```

## User Features

- Edit profile
- Change password
- Upload avatar
- Manage sessions
- Notification preferences

---

# 25. UI Component System

## Required Components

```txt
Button
Input
PasswordInput
Textarea
Select
Checkbox
Radio
Switch
Modal
Drawer
Dropdown
Table
Pagination
Tabs
Badge
Avatar
Card
Alert
Toast
Spinner
Skeleton
EmptyState
ErrorState
FileUpload
Breadcrumb
Sidebar
Header
Footer
```

## Component Rules

- Fully typed props
- Variant support
- Size support
- Loading state
- Disabled state
- Accessible HTML
- Keyboard support where needed

---

# 26. Error Handling

## Required

- Global error boundary
- API error parser
- Form validation errors
- Toast notifications
- 404 page
- 403 page
- 500 page
- Offline state handling

## Error Pages

```txt
/404
/403
/500
```

---

# 27. Accessibility

## Required

- Semantic HTML
- Keyboard navigation
- Focus states
- aria labels
- Color contrast
- Form labels
- Alt text for images
- Skip to content
- Accessible modals
- Accessible dropdowns

---

# 28. Testing

## Required Tests

- Component tests
- Hook tests
- Auth flow tests
- Form validation tests
- Route protection tests
- Permission tests
- API mock tests
- Socket listener tests
- E2E tests

## Coverage Target

```txt
80%
```

---

# 29. Build and Production

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Production Checklist

- Environment variables configured
- API URL configured
- Socket URL configured
- Build passes
- Typecheck passes
- Lint passes
- Tests pass
- Sitemap generated
- Robots.txt configured
- SEO metadata configured
- Images optimized
- Bundle analyzed
- Error boundary enabled
- Monitoring enabled

---

# 30. Recommended Packages

## Core

```bash
npm install react react-dom
```

## Routing

```bash
npm install react-router-dom
```

## API and Cache

```bash
npm install axios @tanstack/react-query
```

## State

```bash
npm install zustand
```

## Forms

```bash
npm install react-hook-form zod @hookform/resolvers
```

## Styling

```bash
npm install tailwindcss @tailwindcss/vite clsx tailwind-merge
```

## Socket

```bash
npm install socket.io-client
```

## SEO

```bash
npm install react-helmet-async
```

## i18n

```bash
npm install i18next react-i18next
```

## UI Helpers

```bash
npm install lucide-react sonner date-fns
```

## Testing

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright
```

---

# 31. Final Architecture Recommendation

## Best Frontend Skeleton

```txt
React + Vite + TypeScript
TailwindCSS
React Router
TanStack Query
Zustand
React Hook Form + Zod
Socket.IO Client
i18next
React Helmet Async
Feature-based architecture
Reusable UI components
SEO-ready public pages
Admin dashboard
User dashboard
```

## Important Rules

- Keep pages thin
- Keep business logic inside hooks
- Keep API calls inside API files
- Use reusable components
- Validate all forms with Zod
- Use TanStack Query for server state
- Use Zustand only for client state
- Use Socket.IO only after authentication
- Use SEO component on public pages
- Use lazy loading for routes
- Use protected routes
- Use permission routes
- Never trust frontend permissions only
- Make everything typed
- Avoid duplicated UI
- Optimize bundle size
- Support multi-language from day one
