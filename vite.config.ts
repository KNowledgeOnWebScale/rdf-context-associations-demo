import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "https://knowledgeonwebscale.github.io/rdf-context-associations-demo/",
  resolve: {
    alias: {
      stream: "stream-browserify"
    }
  },
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    include: ["stream"],
  }
})