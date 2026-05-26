import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute } from './components/PermissionRoute';

const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const UserDetailPage = lazy(() => import('@/pages/admin/UserDetailPage'));
const ClientsPage = lazy(() => import('@/pages/admin/ClientsPage'));
const ClientDetailPage = lazy(() => import('@/pages/admin/ClientDetailPage'));
const ClientLevelsPage = lazy(() => import('@/pages/admin/ClientLevelsPage'));
const ClientSpecialPricesPage = lazy(() => import('@/pages/admin/ClientSpecialPricesPage'));
const ClientFinancialMovementsPage = lazy(() => import('@/pages/admin/ClientFinancialMovementsPage'));
const ClientSpecialPricesAllPage = lazy(() => import('@/pages/admin/ClientSpecialPricesAllPage'));
const OrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));
const OrderCreatePage = lazy(() => import('@/pages/admin/OrderCreatePage'));
const OrderDetailPage = lazy(() => import('@/pages/admin/OrderDetailPage'));
const ManagePaymentsPage = lazy(() => import('@/pages/admin/ManagePaymentsPage'));
const ProblemReportsPage = lazy(() => import('@/pages/admin/ProblemReportsPage'));
const ProblemReportDetailPage = lazy(() => import('@/pages/admin/ProblemReportDetailPage'));
const RolesPage = lazy(() => import('@/pages/admin/RolesPage'));
const PermissionsPage = lazy(() => import('@/pages/admin/PermissionsPage'));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));
const UploadsPage = lazy(() => import('@/pages/admin/UploadsPage'));
const LanguagesPage = lazy(() => import('@/pages/admin/LanguagesPage'));
const StockServicesPage = lazy(() => import('@/pages/admin/StockServicesPage'));
const StockServiceGroupsPage = lazy(() => import('@/pages/admin/StockServiceGroupsPage'));
const StockCategoriesPage = lazy(() => import('@/pages/admin/StockCategoriesPage'));
const StockProductsPage = lazy(() => import('@/pages/admin/StockProductsPage'));
const StockProductImportPage = lazy(() => import('@/pages/admin/StockProductImportPage'));
const StockProductSpecialPricesPage = lazy(() => import('@/pages/admin/StockProductSpecialPricesPage'));
const StockProductCreatePage = lazy(() => import('@/pages/admin/StockProductCreatePage'));
const StockProductEditPage = lazy(() => import('@/pages/admin/StockProductEditPage'));
const StockProductRequirementsPage = lazy(() => import('@/pages/admin/StockProductRequirementsPage'));
const StockProductGroupsPage = lazy(() => import('@/pages/admin/StockProductGroupsPage'));
const StockWarehousesPage = lazy(() => import('@/pages/admin/StockWarehousesPage'));
const StockWarehouseItemsPage = lazy(() => import('@/pages/admin/StockWarehouseItemsPage'));
const StockPromotionsPage = lazy(() => import('@/pages/admin/StockPromotionsPage'));
const SettingsCurrenciesPage = lazy(() => import('@/pages/admin/SettingsCurrenciesPage'));
const SettingsApisPage = lazy(() => import('@/pages/admin/SettingsApisPage'));
const SettingsPaymentGatewaysPage = lazy(() => import('@/pages/admin/SettingsPaymentGatewaysPage'));
const SettingsPaymentCodesPage = lazy(() => import('@/pages/admin/SettingsPaymentCodesPage'));
const SettingsPricingSimulationPage = lazy(() => import('@/pages/admin/SettingsPricingSimulationPage'));
const SettingsApiSimulationPage = lazy(() => import('@/pages/admin/SettingsApiSimulationPage'));
const SettingsBrandingPage = lazy(() => import('@/pages/admin/SettingsBrandingPage'));

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <PermissionRoute permission="admin.dashboard.read">
          {/* Layout will be added in main index */}
          <div /> 
        </PermissionRoute>
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/:id', element: <UserDetailPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/financial-movements', element: <ClientFinancialMovementsPage /> },
      { path: 'clients/special-prices', element: <ClientSpecialPricesAllPage /> },
      { path: 'clients/:id', element: <ClientDetailPage /> },
      { path: 'clients/:id/levels', element: <ClientLevelsPage /> },
      { path: 'clients/:id/special-prices', element: <ClientSpecialPricesPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/add', element: <OrderCreatePage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: 'payments', element: <ManagePaymentsPage /> },
      { path: 'problem-reports', element: <ProblemReportsPage /> },
      { path: 'problem-reports/:id', element: <ProblemReportDetailPage /> },
      { path: 'roles', element: <RolesPage /> },
      { path: 'permissions', element: <PermissionsPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      { path: 'uploads', element: <UploadsPage /> },
      { path: 'languages', element: <LanguagesPage /> },
      { path: 'stocks/services', element: <StockServicesPage /> },
      { path: 'stocks/service-groups', element: <StockServiceGroupsPage /> },
      { path: 'stocks/categories', element: <StockCategoriesPage /> },
      { path: 'stocks/products', element: <StockProductsPage /> },
      { path: 'stocks/products/import', element: <StockProductImportPage /> },
      { path: 'stocks/special-prices', element: <StockProductSpecialPricesPage /> },
      { path: 'stocks/products/add', element: <StockProductCreatePage /> },
      { path: 'stocks/products/:id/edit', element: <StockProductEditPage /> },
      { path: 'stocks/product-requirements', element: <StockProductRequirementsPage /> },
      { path: 'stocks/product-groups', element: <StockProductGroupsPage /> },
      { path: 'stocks/warehouses', element: <StockWarehousesPage /> },
      { path: 'stocks/warehouse-items', element: <StockWarehouseItemsPage /> },
      { path: 'stocks/promotions', element: <StockPromotionsPage /> },
      { path: 'settings/currencies', element: <SettingsCurrenciesPage /> },
      { path: 'settings/apis', element: <SettingsApisPage /> },
      { path: 'settings/payment-gateways', element: <SettingsPaymentGatewaysPage /> },
      { path: 'settings/payment-codes', element: <SettingsPaymentCodesPage /> },
      { path: 'settings/pricing-simulation', element: <SettingsPricingSimulationPage /> },
      { path: 'settings/api-simulation', element: <SettingsApiSimulationPage /> },
      { path: 'settings', element: <SettingsBrandingPage /> },
    ]
  },
];
