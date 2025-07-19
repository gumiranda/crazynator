import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  mode: process.env.NODE_ENV || 'development',
  root: __dirname,
  build: {
    outDir: 'dist/main',
    lib: {
      entry: 'src/main/main.ts',
      formats: ['cjs'],
      fileName: () => 'main.js'
    },
    rollupOptions: {
      external: [
        'electron',
        'electron-store',
        'electron-updater',
        'electron-window-state',
        'node-pty',
        'tree-kill',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`)
      ]
    },
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development'
  },
  resolve: {
    alias: {
      '@': __dirname + '/src'
    }
  }
});