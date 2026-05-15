import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const vendorChunks: Record<string, string[]> = {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'query-vendor': ['@tanstack/react-query'],
  'ui-vendor': ['lucide-react', 'sonner'],
  'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
  'socket-vendor': ['socket.io-client'],
  'i18n-vendor': ['i18next', 'react-i18next'],
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');

            if (!normalizedId.includes('/node_modules/')) {
              return undefined;
            }

            for (const [chunkName, packages] of Object.entries(vendorChunks)) {
              if (packages.some((pkg) => normalizedId.includes(`/node_modules/${pkg}/`))) {
                return chunkName;
              }
            }

            return undefined;
          },
        },
      },
      sourcemap: mode === 'development',
      minify: 'esbuild',
      chunkSizeWarningLimit: 800,
      target: 'esnext',
    },
  };
});
