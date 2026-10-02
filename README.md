# Als Dress: alsdress.com.mx

Sitio de Als Boutique (renta y venta de vestidos de fiesta en Reynosa). Vite multi-page + Supabase, publicado en GitHub Pages con GitHub Actions.

## Comandos

```bash
npm install       # instala dependencias (versiones fijas)
npm run dev       # servidor local en http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/ en http://localhost:4173
npm run imagenes  # regenera las fotos responsivas de public/img/
```

## Estructura

```
index.html              Inicio (10 secciones)
catalogo/index.html     Catálogo
_estilos/index.html     Sistema visual (interno, no indexado)
404.html                Redirige rutas viejas (/beneficios…) a /?p=…
public/                 Se copia tal cual a dist/ (CNAME, íconos, fotos)
public/img/             Fotos en AVIF/WebP en varios tamaños (npm run imagenes)
src/partials/           Bloques compartidos: head-comun, gtag, header, menú, footer, barra inferior, horario
src/styles/             tokens.css → style.css (heredado) → base.css → components/ → pages/
src/js/main.js          Común: medición de WhatsApp, catálogo, lightbox, galería
src/js/inicio.js        Inicio: destacados y mapa
src/js/nav.js           Header, menú y contador de Mi lista
src/js/carrusel.js      Carruseles que avanzan solos (con botón Pausar)
src/js/contraste.js     Revisión de contraste WCAG (se usa en /_estilos)
docs/sql/               Propuestas de cambios a Supabase (no ejecutadas)
scripts/imagenes.mjs    Genera las fotos responsivas con sharp
.github/workflows/      Publicación automática a GitHub Pages
```

## Publicación

Cada push a `main` ejecuta `.github/workflows/deploy.yml`, que construye `dist/` y lo publica. Requiere **Settings → Pages → Source: GitHub Actions** (el primer push se hace junto con ese cambio).

El rediseño se sigue en `PLAN-REDISENO.md`; las reglas del proyecto están en `CLAUDE.md`.
