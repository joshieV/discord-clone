import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' so built asset paths are relative — required for the build to
// load correctly under Electron's file:// protocol, not just from a web root.
export default defineConfig({
  plugins: [react()],
  base: './',
})
