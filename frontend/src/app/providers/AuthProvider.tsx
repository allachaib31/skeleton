import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { getMe, refreshToken } from '@/features/auth/api/auth.api';
import { User } from '@/shared/types/auth.types';

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthBootstrapResult {
  user: User;
  accessToken: string | null;
}

let authBootstrapPromise: Promise<AuthBootstrapResult> | null = null;

const bootstrapAuth = async (): Promise<AuthBootstrapResult> => {
  let accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    const refreshResponse = await refreshToken();
    accessToken = refreshResponse.data.accessToken;
    useAuthStore.getState().setAccessToken(accessToken);
  }

  const response = await getMe();
  return { user: response.data, accessToken };
};

const getAuthBootstrapPromise = () => {
  authBootstrapPromise ??= bootstrapAuth().finally(() => {
    authBootstrapPromise = null;
  });

  return authBootstrapPromise;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setAccessToken, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setLoading(true);

      try {
        const { user, accessToken } = await getAuthBootstrapPromise();
        if (isMounted) {
          setAccessToken(accessToken);
          setUser(user);
        }
      } catch (error) {
        if (isMounted) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [setAccessToken, setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
