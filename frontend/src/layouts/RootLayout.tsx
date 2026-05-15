import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export default function RootLayout() {
  const { pathname } = useLocation();

  // Scroll Restoration
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}
