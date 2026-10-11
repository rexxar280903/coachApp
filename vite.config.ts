import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';
import { validateSupabaseConfig } from './src/utils/security.ts';
import { createReceiptImagesHandler } from './server/portalReceiptImages.ts';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  validateSupabaseConfig((env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, ''), (env.VITE_SUPABASE_ANON_KEY || '').trim(), command === 'build');
  return {
    plugins: [react(), tailwindcss(), {
      name: 'portal-receipt-images-dev',
      configureServer(server) {
        const handler = createReceiptImagesHandler({ ...process.env, ...loadEnv(mode, process.cwd(), '') });
        server.middlewares.use('/api/portal-receipt-images', (req, res) => { void handler(req, res); });
      },
    }],
    server: {
      host: '127.0.0.1',
      cors: false,
      fs: { strict: true, deny: ['.env', '.env.*', '**/.git/**', '**/*.pem', '**/*.key'] },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: { host: '127.0.0.1' },
    build: { sourcemap: false },
  };
});
