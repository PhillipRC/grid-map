import {
  defineConfig,
  loadEnv,
} from 'vite'

import { VitePWA } from 'vite-plugin-pwa'


// https://vitejs.dev/config/
export default defineConfig(
  ({ mode }) => {

    process.env = {
      ...process.env,
      ...loadEnv(
        mode,
        process.cwd()
      )
    }

    return {
      base: process.env.VITE_PUBLIC_URL,
      plugins: [
        VitePWA(
          {

            registerType: 'prompt',
            injectRegister: false,

            pwaAssets: {
              disabled: false,
              config: true,
            },

            manifest: {
              name: 'Map',
              short_name: 'Map',
              description: 'Display and Generate Maps',
              theme_color: '#333333',
            },

            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
              cleanupOutdatedCaches: true,
              clientsClaim: true,
            },

            devOptions: {
              enabled: false,
              navigateFallback: 'index.html',
              suppressWarnings: true,
              type: 'module',
            },

          }
        ),
      ]
    }
  }
)