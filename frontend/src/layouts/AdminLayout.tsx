import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Header } from '@/shared/components/layout/Header';
import { Breadcrumb } from '@/shared/components/layout/Breadcrumb';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export default function AdminLayout() {
  const { user } = useAuthStore();

  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN';

  if (!isAdmin) {
    return <Navigate to="/403" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 admin-area">
      <style>{`
        .admin-area { --primary: 221.2 83.2% 53.3%; } /* We could change this to red */
        .admin-area { --primary: 0 72% 51%; } /* Red accent for admin */
      `}</style>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 border-t-4 border-red-500">
          <div className="mx-auto max-w-7xl">
            <Breadcrumb />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
