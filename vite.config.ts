import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Funciona bajo /nombre-del-repositorio/ y con dominio propio.
  base: './',
  build: { outDir: 'dist' },
});
