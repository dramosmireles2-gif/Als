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
vestido/index.html      Página de cada vestido
como-rentar/index.html  Cómo rentar + preguntas frecuentes
aviso-de-privacidad/    Aviso de privacidad (borrador)
politica-de-cookies/    Política de cookies (borrador)
_estilos/index.html     Sistema visual (interno, no indexado)
404.html                Redirige rutas viejas (/beneficios…) a /?p=…
public/                 Se copia tal cual a dist/ (CNAME, íconos, fotos)
public/img/             Fotos en AVIF/WebP en varios tamaños (npm run imagenes)
src/partials/           Bloques compartidos: head-comun, gtag, header, menú, footer, barra inferior, horario
src/styles/             tokens.css → style.css (heredado) → base.css → components/ → pages/
src/js/main.js          Común: medición de WhatsApp, lightbox y galería de clientas
src/js/datos.js         Lectura de Supabase (solo lectura, llave pública) y obtenerUrlFoto()
src/js/catalogo.js      Catálogo con filtros en la URL
src/js/vestido.js       Página de cada vestido (/vestido/?m=slug)
src/js/mi-lista.js      Mi lista (favoritos) y envío por WhatsApp
src/js/consent.js       Aviso de cookies (Consent Mode v2)
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
