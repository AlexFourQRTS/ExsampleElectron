import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@components': resolve('src/renderer/src/app/component'),
        '@services': resolve('src/renderer/src/services'),
        '@types': resolve('src/renderer/src/app/types'),
        '@utils': resolve('src/renderer/src/utils'),
        '@styles': resolve('src/renderer/src/app/style'),
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})