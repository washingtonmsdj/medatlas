import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appBase = process.env.VITE_APP_BASE || '/'

export default defineConfig({
  base: appBase,
  plugins: [react()],
})
