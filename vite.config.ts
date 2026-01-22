import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/index.ts',
        vite: {
          build: { 
            outDir: 'dist/main',
          }

        }
      },
      preload: {
        input: 'src/preload/index.ts',
        vite: {
          build: {
            outDir: 'dist/preload'
          }
        }
      }
    }),
    renderer()
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, './src'),
      "@main": resolve(__dirname, './src/main'),
      "@renderer": resolve(__dirname, './src/renderer'),
      "@shared": resolve(__dirname, './src/shared'),
    }
  },
  server: {
    port: 5173
  }
})
