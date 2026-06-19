import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes every built asset path relative, so the app runs unchanged
// at http://localhost:5173/, at https://<user>.github.io/battleship-bingo/, or
// behind a custom domain at the root. Any link/QR the app produces is built from
// window.location at runtime (see src/lib/url.ts) rather than a baked-in URL.
export default defineConfig({
  base: './',
  plugins: [react()],
})
