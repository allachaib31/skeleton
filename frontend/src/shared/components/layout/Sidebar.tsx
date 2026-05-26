import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useUIStore } from '@/app/stores/ui.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { cn } from '@/shared/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  FileText, 
  Upload, 
  Settings, 
  User, 
  Bell,
  Globe2,
  Package,
  ShoppingCart,
  CreditCard,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button';

export function Sidebar() {
  const { user } = useAuthStore();
  const { sidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const location = useLocation();
  const { t } = useTranslation();
  const { direction } = useLanguageStore();
  const isRtl = direction === 'rtl';
  const [clientsOpen, setClientsOpen] = useState(location.pathname.startsWith('/admin/clients'));
  const [stocksOpen, setStocksOpen] = useState(location.pathname.startsWith('/admin/stocks'));
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/admin/settings'));

  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN';

  const userLinks = [
    { label: t('nav.dashboard'), path: '/app/dashboard', icon: LayoutDashboard },
    { label: t('profile.title'), path: '/app/profile', icon: User },
    { label: t('notifications.title'), path: '/app/notifications', icon: Bell },
    { label: t('settings.title'), path: '/app/settings', icon: Settings },
  ];

  const adminLinks = [
    { label: t('admin.dashboard'), path: '/admin/dashboard', icon: Shield },
    { label: t('admin.users'), path: '/admin/users', icon: Users },
    { label: t('admin.auditLogs'), path: '/admin/audit-logs', icon: FileText },
    { label: t('orders.title'), path: '/admin/orders', icon: ShoppingCart },
    { label: t('payments.manageTitle'), path: '/admin/payments', icon: CreditCard },
    { label: t('problemReports.adminTitle'), path: '/admin/problem-reports', icon: Bell },
    { label: t('admin.uploads'), path: '/admin/uploads', icon: Upload },
    { label: t('admin.languages.title'), path: '/admin/languages', icon: Globe2 },
  ];

  const links = isAdmin && location.pathname.startsWith('/admin')
    ? adminLinks
    : isAdmin
      ? [...userLinks, { label: t('admin.panel'), path: '/admin/dashboard', icon: Shield }]
      : userLinks;

  if (!sidebarOpen) return null;

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 z-30 flex flex-col bg-secondary transition-all duration-300 md:relative",
        isRtl ? "right-0 border-l border-white/10" : "left-0 border-r border-white/10",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
        {!sidebarCollapsed && <span className="font-bold text-lg">{t('nav.menu')}</span>}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex"
        >
          {sidebarCollapsed
            ? (isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />)
            : (isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />)}
        </Button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-4">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
              location.pathname === link.path 
                ? "bg-primary text-primary-foreground" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <link.icon size={20} className={cn(location.pathname === link.path ? "" : "text-slate-400 group-hover:text-primary")} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{link.label}</span>}
          </Link>
        ))}
        {isAdmin && location.pathname.startsWith('/admin') && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setClientsOpen((isOpen) => !isOpen)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors group",
                location.pathname.startsWith('/admin/clients')
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <User size={20} className={cn(location.pathname.startsWith('/admin/clients') ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-start text-sm font-medium">{t('clients.manage')}</span>
                  <ChevronDown size={16} className={cn("transition-transform", clientsOpen && "rotate-180")} />
                </>
              )}
            </button>
            {!sidebarCollapsed && clientsOpen && (
              <div className={cn("space-y-1", isRtl ? "pr-9" : "pl-9")}>
                <Link
                  to="/admin/clients"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/clients'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('clients.title')}
                </Link>
                <Link
                  to="/admin/clients/financial-movements"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/clients/financial-movements'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('clients.financialMovements')}
                </Link>
                <Link
                  to="/admin/clients/special-prices"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/clients/special-prices'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('clients.specialPricesAll')}
                </Link>
              </div>
            )}
          </div>
        )}
        {isAdmin && location.pathname.startsWith('/admin') && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setStocksOpen((isOpen) => !isOpen)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors group",
                location.pathname.startsWith('/admin/stocks')
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <Package size={20} className={cn(location.pathname.startsWith('/admin/stocks') ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-start text-sm font-medium">{t('stocks.title')}</span>
                  <ChevronDown size={16} className={cn("transition-transform", stocksOpen && "rotate-180")} />
                </>
              )}
            </button>
            {!sidebarCollapsed && stocksOpen && (
              <div className={cn("space-y-1", isRtl ? "pr-9" : "pl-9")}>
                <Link
                  to="/admin/stocks/categories"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/categories'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.categories.title')}
                </Link>
                <Link
                  to="/admin/stocks/services"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/services'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.services.title')}
                </Link>
                <Link
                  to="/admin/stocks/service-groups"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/service-groups'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.serviceGroups.title')}
                </Link>
                <Link
                  to="/admin/stocks/products"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/products'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.products.title')}
                </Link>
                <Link
                  to="/admin/stocks/products/add"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/products/add'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.products.addTitle')}
                </Link>
                <Link
                  to="/admin/stocks/products/import"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/products/import'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.importProducts.title')}
                </Link>
                <Link
                  to="/admin/stocks/special-prices"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/special-prices'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.specialPrices.title')}
                </Link>
                <Link
                  to="/admin/stocks/product-requirements"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/product-requirements'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.productRequirements.title')}
                </Link>
                <Link
                  to="/admin/stocks/product-groups"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/product-groups'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.productGroups.title')}
                </Link>
                <Link
                  to="/admin/stocks/warehouses"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/warehouses'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.warehouses.title')}
                </Link>
                <Link
                  to="/admin/stocks/warehouse-items"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/warehouse-items'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.warehouses.itemsTitle')}
                </Link>
                <Link
                  to="/admin/stocks/promotions"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/stocks/promotions'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('stocks.promotions.title')}
                </Link>
              </div>
            )}
          </div>
        )}
        {isAdmin && location.pathname.startsWith('/admin') && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSettingsOpen((isOpen) => !isOpen)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors group",
                location.pathname.startsWith('/admin/settings')
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <SlidersHorizontal size={20} className={cn(location.pathname.startsWith('/admin/settings') ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-start text-sm font-medium">{t('adminSettings.title')}</span>
                  <ChevronDown size={16} className={cn("transition-transform", settingsOpen && "rotate-180")} />
                </>
              )}
            </button>
            {!sidebarCollapsed && settingsOpen && (
              <div className={cn("space-y-1", isRtl ? "pr-9" : "pl-9")}>
                <Link
                  to="/admin/settings"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/settings'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('adminSettings.branding.title')}
                </Link>
                <Link
                  to="/admin/settings/currencies"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/settings/currencies'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('adminSettings.currencies.title')}
                </Link>
                <Link
                  to="/admin/settings/apis"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/settings/apis'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('adminSettings.apis.title')}
                </Link>
                <Link
                  to="/admin/settings/payment-gateways"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/settings/payment-gateways'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('adminSettings.paymentGateways.title')}
                </Link>
                <Link
                  to="/admin/settings/payment-codes"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/settings/payment-codes'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('adminSettings.paymentCodes.title')}
                </Link>
                <Link
                  to="/admin/settings/pricing-simulation"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/settings/pricing-simulation'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('adminSettings.simulation.title')}
                </Link>
                <Link
                  to="/admin/settings/api-simulation"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === '/admin/settings/api-simulation'
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                  )}
                >
                  {t('adminSettings.apiSimulation.title')}
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 px-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t('common.systemOnline')}</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
