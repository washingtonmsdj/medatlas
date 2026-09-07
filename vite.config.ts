import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const HUMAN_ATLAS_SHA = '1c38bf35c254a891200d3cedecfd57abebe83d8d'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/atlas-assets': {
        target: 'https://raw.githubusercontent.com',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/atlas-assets/,
            `/ashemag/human-atlas/${HUMAN_ATLAS_SHA}/public/models`,
          ),
      },
    },
  },
})
