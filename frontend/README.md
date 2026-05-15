# AppName - Professional React Frontend Skeleton

An enterprise-grade React + Vite + TypeScript foundation for building scalable SaaS applications.

## ✨ Features

- **🛡️ Secure Auth**: JWT-based session management, secure cookies, and RBAC (Role-Based Access Control).
- **🚀 Performance**: Optimized build with chunk splitting, pre-fetching, and Vitest testing suite.
- **🌐 Global Ready**: Full i18n support with RTL layout for Arabic, French, and English.
- **📡 Real-time**: Integrated Socket.IO client for notifications and presence.
- **🎨 Premium UI**: Custom primitive component library with TailwindCSS and Dark Mode.
- **📊 Admin Hub**: Full administrative dashboard for users, roles, and system monitoring.

## 🛠️ Tech Stack

- **Core**: React 18, Vite, TypeScript
- **State**: Zustand (Store), TanStack Query (Server State)
- **Styling**: TailwindCSS, Lucide Icons, Sonner
- **Forms**: React Hook Form, Zod
- **Testing**: Vitest, React Testing Library, Playwright (E2E)
- **i18n**: i18next

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm 9+

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in the values:
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_APP_NAME | Application Title | AppName |
| VITE_API_URL | Backend API URL | http://localhost:5000/api/v1 |
| VITE_SOCKET_URL | Socket.IO Server URL | http://localhost:5000 |

### 4. Development
```bash
npm run dev
```

## 🧪 Testing

- **Unit/Integration**: `npm test`
- **Coverage**: `npm run test:coverage`
- **E2E (Playwright)**: `npm run test:e2e`

## 🏗️ Building for Production

```bash
npm run build
```

## 📜 Routes

- **Public**: `/`, `/about`, `/contact`
- **Auth**: `/login`, `/register`, `/forgot-password`
- **User**: `/app/profile`, `/app/settings`, `/app/notifications`
- **Admin**: `/admin/dashboard`, `/admin/users`, `/admin/roles`, `/admin/audit-logs`

---
Built with ❤️ by the Antigravity Team.
