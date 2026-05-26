import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hook
vi.mock('@/features/auth/hooks/useLogin', () => ({
  useLogin: vi.fn()
}));

const renderLoginPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

describe('LoginPage Integration', () => {
  it('renders login form fields', () => {
    (useLogin as any).mockReturnValue({ isPending: false });
    renderLoginPage();
    expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    (useLogin as any).mockReturnValue({ isPending: false });
    renderLoginPage();
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('calls login mutation on valid submit', async () => {
    const mutate = vi.fn();
    (useLogin as any).mockReturnValue({ mutate, isPending: false });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email address$/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com', password: 'password123' })
      );
    });
  });
});
