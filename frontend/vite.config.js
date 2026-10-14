import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// host: true listens on every interface (IPv4 and IPv6), so http://localhost:5173,
// http://127.0.0.1:5173 and the LAN address all work. On Windows with recent Node,
// the default binds only to ::1, which breaks 127.0.0.1.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173, strictPort: false, proxy: { '/api': 'http://localhost:8000' } },
  preview: { host: true, port: 4173 },
})
