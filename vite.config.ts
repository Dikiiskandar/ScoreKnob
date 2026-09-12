import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const base = process.env.VITE_BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon.png', 'logo.svg'],
      manifest: {
        name: 'Diki Lab',
        short_name: 'Diki Lab',
        description: 'Game-style scoreboard with a rotary knob and head-to-head mode, playable offline.',
        // Open on the main menu; Knob and Versus are reachable as shortcuts.
        start_url: './',
        scope: './',
        display: 'standalone',
        // "any" so the Versus page can rotate to landscape inside the installed app.
        orientation: 'any',
        background_color: '#0b0b0c',
        theme_color: '#0b0b0c',
        shortcuts: [
          {
            name: 'Knob scoreboard',
            short_name: 'Knob',
            url: './knob-page',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Versus match',
            short_name: 'Versus',
            url: './versus',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,mp3}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
      // The dev service worker breaks HMR regeneration with workbox-build,
      // so test offline behaviour with `npm run build && npm run preview`.
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
