import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/shopping-list/' : '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/180.png', 'icons/192.png', 'icons/512.png'],
      manifest: {
        name: '買い物リスト',
        short_name: '買い物',
        description: '冷蔵庫と日用品を1タップで記録',
        start_url: command === 'build' ? '/shopping-list/' : '/',
        scope: command === 'build' ? '/shopping-list/' : '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4caf50',
        lang: 'ja',
        icons: [
          { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 3
            }
          }
        ]
      }
    })
  ],
  server: { host: true, port: 5173 }
}));
