import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { useAuthStore } from '@/features/auth/stores/auth.store';

// Mock auth store
vi.mock('@/features/auth/stores/auth.store', () => ({
  useAuthStore: vi.fn()
}));

describe('usePermissions Hook', () => {
  it('returns true when user has permission', () => {
    const state = {
      isAuthenticated: true,
      user: { role: { permissions: [{ name: 'users:read' }] } }
    };
    (useAuthStore as any).mockImplementation((selector: any) => selector(state));

    const { result } = renderHook(() => usePermissions('users:read'));
    expect(result.current).toBe(true);
  });

  it('returns false when user lacks permission', () => {
    const state = {
      isAuthenticated: true,
      user: { role: { permissions: [{ name: 'users:read' }] } }
    };
    (useAuthStore as any).mockImplementation((selector: any) => selector(state));

    const { result } = renderHook(() => usePermissions('admin:access'));
    expect(result.current).toBe(false);
  });

  it('returns false when not authenticated', () => {
    const state = {
      isAuthenticated: false,
      user: null
    };
    (useAuthStore as any).mockImplementation((selector: any) => selector(state));

    const { result } = renderHook(() => usePermissions('users:read'));
    expect(result.current).toBe(false);
  });
});
