import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-secondary p-8 rounded-xl shadow-lg border border-white/10">
        <Outlet />
      </div>
    </div>
  );
}
