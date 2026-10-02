import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

const root = import.meta.dirname;

// Variables que reciben los partials según la página
const paginas = {
  '/index.html':          { esInicio: true },
  '/catalogo/index.html': { esCatalogo: true },
};

export default defineConfig({
  appType: 'mpa',
  plugins: [
    handlebars({
      partialDirectory: resolve(root, 'src/partials'),
      context: (pagePath) => paginas[pagePath] ?? {},
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        inicio:   resolve(root, 'index.html'),
        catalogo: resolve(root, 'catalogo/index.html'),
        404:      resolve(root, '404.html'),
      },
    },
  },
  server:  { port: 5173 },
  preview: { port: 4173 },
});
