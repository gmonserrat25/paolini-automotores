import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El sitio se publica en Vercel, en la raíz de https://paoliniautomotores.com/.
export default defineConfig({
  plugins: [react()],
})
