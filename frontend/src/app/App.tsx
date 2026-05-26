import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from '@/routes';
import { AuthProvider } from './providers/AuthProvider';
import { SocketProvider } from './providers/SocketProvider';
import { AppBrandingSync } from '@/features/settings/components/AppBrandingSync';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppBrandingSync />
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </SocketProvider>
    </AuthProvider>
  );
}
