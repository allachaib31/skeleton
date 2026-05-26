import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Theme } from '@/shared/types/common.types';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  resolveTheme: () => void;
}

const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export const useThemeStore = create<ThemeState & ThemeActions>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'dark',
        resolvedTheme: 'dark',

        setTheme: (theme) => {
          const resolvedTheme = getResolvedTheme(theme);
          set({ theme, resolvedTheme });
          
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(resolvedTheme);
        },

        resolveTheme: () => {
          const { theme } = get();
          const resolvedTheme = getResolvedTheme(theme);
          set({ resolvedTheme });
          
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(resolvedTheme);
        },
      }),
      { name: 'theme-storage' }
    ),
    { name: 'theme-store' }
  )
);
