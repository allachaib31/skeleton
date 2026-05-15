import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/features/auth/stores/auth.store';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('initializes with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });

  it('login() sets user and authentication status', () => {
    const user = { _id: '1', name: 'Test', email: 'test@test.com' } as any;
    const token = 'fake-token';
    
    useAuthStore.getState().login(user, token);
    
    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe(token);
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout() resets all auth state', () => {
    useAuthStore.getState().login({} as any, 'token');
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });
});
