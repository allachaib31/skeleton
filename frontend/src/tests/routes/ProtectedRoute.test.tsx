import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { useAuthStore } from '@/features/auth/stores/auth.store';

vi.mock('@/features/auth/stores/auth.store', () => ({
  useAuthStore: vi.fn()
}));

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      isLoading: false
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<div>Secret Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: false
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<div>Secret Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
