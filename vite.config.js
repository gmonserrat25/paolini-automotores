import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El sitio se publica en https://gmonserrat25.github.io/paolini-automotores/,
// así que en producción los assets cuelgan de ese subdirectorio. En dev
// (npm run dev) la base sigue siendo la raíz.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/paolini-automotores/' : '/',
  plugins: [react()],
})
