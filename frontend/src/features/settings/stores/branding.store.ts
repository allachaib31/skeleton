import { create } from 'zustand';
import { env } from '@/config/env.config';

interface BrandingState {
  appName: string;
  logoUrl?: string;
  faviconUrl?: string;
  setBranding: (branding: Partial<Pick<BrandingState, 'appName' | 'logoUrl' | 'faviconUrl'>>) => void;
}

export const useBrandingStore = create<BrandingState>((set) => ({
  appName: env.VITE_APP_NAME || 'tafa3olcard',
  setBranding: (branding) => set((state) => ({ ...state, ...branding })),
}));
