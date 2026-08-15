import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['xp.svg'],
      manifest: {
        name: 'X岛匿名版',
        short_name: 'X岛',
        description: 'X岛匿名版 PWA 客户端',
        theme_color: '#16171d',
        background_color: '#16171d',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: 'xp.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        importScripts: ['auto-preload-optout.js'],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.nmb.best/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const h = req.headers['x-userhash']
            if (typeof h === 'string' && h) {
              proxyReq.setHeader('Cookie', `userhash=${h}`)
              proxyReq.removeHeader('x-userhash')
            }
          })
        },
      },
      '/image': {
        target: 'https://image.nmb.best/image',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/image/, ''),
      },
      '/thumb': {
        target: 'https://image.nmb.best/thumb',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/thumb/, ''),
      },
      '/post': {
        target: 'https://www.nmbxd1.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/post/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const h = req.headers['x-userhash']
            if (typeof h === 'string' && h) {
              proxyReq.setHeader('Cookie', `userhash=${h}`)
              proxyReq.removeHeader('x-userhash')
            }
          })
        },
      },
    },
  },
})
