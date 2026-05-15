import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  pageTitle: string;
  breadcrumbs: Breadcrumb[];
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setPageTitle: (title: string) => void;
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      pageTitle: '',
      breadcrumbs: [],

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setPageTitle: (pageTitle) => set({ pageTitle }),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
    }),
    { name: 'ui-store' }
  )
);
