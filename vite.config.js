import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fork } from 'child_process'

function apiServerPlugin() {
  let serverProcess = null
  return {
    name: 'api-server',
    configureServer(server) {
      serverProcess = fork(resolve(__dirname, 'server/index.js'), [], {
        stdio: 'inherit',
        execArgv: []
      })
      server.httpServer?.once('close', () => {
        if (serverProcess) serverProcess.kill()
      })
    },
    closeBundle() {
      if (serverProcess) serverProcess.kill()
    }
  }
}

export default defineConfig({
  plugins: [vue(), apiServerPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true
      }
    }
  }
})
