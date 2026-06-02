import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Import the new Tailwind plugin
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add the plugin to your Vite config
    tailwindcss(),
  ],
})
