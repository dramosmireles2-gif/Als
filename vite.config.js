import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

const root = import.meta.dirname;

// sitemap.xml con la fecha de cada build (las páginas de cada vestido se arman en el navegador)
const PAGINAS_SITEMAP = ['/', '/catalogo/', '/como-rentar/', '/aviso-de-privacidad/', '/politica-de-cookies/'];
const SALTO = String.fromCharCode(10);
function sitemapPlugin() {
  return {
    name: 'als-sitemap',
    apply: 'build',
    generateBundle() {
      const hoy = new Date().toISOString().slice(0, 10);
      const urls = PAGINAS_SITEMAP.map(p => `  <url><loc>https://alsdress.com.mx${p}</loc><lastmod>${hoy}</lastmod></url>`).join(SALTO);
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
      });
    },
  };
}

// Variables que reciben los partials según la página
const paginas = {
  '/index.html':          { esInicio: true },
  '/catalogo/index.html': { esCatalogo: true },
  '/como-rentar/index.html': { esComoRentar: true },
};

export default defineConfig({
  appType: 'mpa',
  plugins: [
    sitemapPlugin(),
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
        vestido:  resolve(root, 'vestido/index.html'),
        comoRentar: resolve(root, 'como-rentar/index.html'),
        privacidad: resolve(root, 'aviso-de-privacidad/index.html'),
        cookies:  resolve(root, 'politica-de-cookies/index.html'),
        404:      resolve(root, '404.html'),
        estilos:  resolve(root, '_estilos/index.html'),
      },
    },
  },
  // No vigilar las carpetas de build: en Windows el vigilante las deja bloqueadas
  server:  { port: 5173, watch: { ignored: ['**/dist/**', '**/dist-local/**', '**/_interno/**'] } },
  preview: { port: 4173 },
});
