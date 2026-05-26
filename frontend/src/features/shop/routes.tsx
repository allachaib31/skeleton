import { lazy } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

const ShopLayout = lazy(() => import('./layouts/ShopLayout'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const GiftCardsPage = lazy(() => import('./pages/GiftCardsPage'));
const SmmPage = lazy(() => import('./pages/SmmPage'));
const NumbersPage = lazy(() => import('./pages/NumbersPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const SupportCreatePage = lazy(() => import('./pages/SupportCreatePage'));
const SupportDetailPage = lazy(() => import('./pages/SupportDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const TopupPage = lazy(() => import('./pages/TopupPage'));
const BillsPage = lazy(() => import('./pages/BillsPage'));

function ComingSoon({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center">
      <div className="text-2xl font-extrabold text-[#100E22]">{name} service</div>
      <div className="mt-2 text-sm text-gray-500">
        This screen shares the same shell — same nav, top bar, product grid, dynamic forms.
      </div>
    </div>
  );
}

export const shopRoutes: RouteObject[] = [
  // Public landing (full-bleed, no layout)
  { path: '/shop', element: <LandingPage /> },
  // Auth screens (full-bleed split layout)
  { path: '/shop/login', element: <Navigate to="/login" replace /> },
  { path: '/shop/register', element: <Navigate to="/register" replace /> },
  // Authenticated marketplace (sidebar + topbar + bottom nav)
  {
    path: '/shop',
    element: <ShopLayout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'giftcards', element: <GiftCardsPage /> },
      { path: 'smm', element: <SmmPage /> },
      { path: 'numbers', element: <NumbersPage /> },
      { path: 'product/:id', element: <ProductPage /> },
      { path: 'product-group/:groupId', element: <ProductPage /> },
      { path: 'wallet', element: <WalletPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: 'support', element: <SupportPage /> },
      { path: 'support/new', element: <SupportCreatePage /> },
      { path: 'support/:id', element: <SupportDetailPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'topup', element: <TopupPage /> },
      { path: 'bills', element: <BillsPage /> },
      { path: 'gaming', element: <ComingSoon name="Gaming" /> },
      { path: 'streaming', element: <ComingSoon name="Streaming" /> },
    ],
  },
];
