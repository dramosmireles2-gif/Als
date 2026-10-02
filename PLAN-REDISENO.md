# Plan de rediseño: alsdress.com.mx

> Este documento es para **Claude Code**. Léelo completo antes de tocar código, trabaja **por fases**, en orden, y al terminar cada fase detente para que David revise.
> Contexto de marca y reglas fijas: `CLAUDE.md`. Moodboard aprobado: artifact "Als Dress Moodboard" (paleta, tipografía y componentes descritos aquí abajo).

---

## 0. Contexto del negocio

- **Als Dress / Als Boutique**: negocio familiar de **renta y venta** de vestidos de fiesta en Reynosa, Tamaulipas. También tiene zapatos, bolsas y accesorios.
- **Clientas:** mujeres de 15 a 55 años. Ocasiones: XV años (la clienta y su mamá o madrina), graduaciones, bodas (invitadas, damas, mamá de los novios), posadas y cenas de fin de año, eventos de gala.
- **Cómo se renta hoy (de las FAQ actuales):** renta de 3 a 4 días, depósito del 50 % del valor, renta **solo presencial**, sí hacen ajustes, no hay reembolsos (en algunos casos queda como crédito).
- **Embudo real:** Meta Ads / Google Ads / Google Maps → sitio → **WhatsApp** (+52 899 194 7566) → visita y prueba en tienda → renta.
  Ya existe una agenda en Setmore (`alsdress.setmore.com`) con los servicios "Renta de vestidos", "Rentar vestido" y "Recoger vestidos".
- **Conversión principal:** clic a WhatsApp (ya se mide con Google Ads `AW-11262534800`). **Secundaria:** cita agendada y clic en "Cómo llegar".

### Análisis del nicho (Reynosa)
- Casi toda la competencia (SOSA, Elegance, Gabrielle, Dress to Go…) vive **solo en Facebook e Instagram**. Un sitio rápido, con catálogo filtrable por talla y disponibilidad real, ya es una ventaja. El objetivo es que el sitio **ahorre la pregunta "lo tienes en mi talla"** y lleve a la clienta al WhatsApp ya decidida.
- **Las objeciones de la clienta, en orden:** 1) que lo tengan en su talla, 2) cuánto cuesta, 3) si lo puede probar, 4) si le queda bien o se lo ajustan, 5) la confianza (depósito, estado de la prenda, que alguien más ya lo usó).
- **Temporadas:** graduaciones (may–jul), XV (todo el año, con pico en primavera), bodas (oct–dic y primavera), posadas y fin de año (nov–dic). El sitio debe poder cambiar su "campaña de temporada" sin rediseñar nada.
- **La compra es social:** la clienta manda opciones a su mamá o a sus amigas. Compartir un vestido por link o por WhatsApp tiene que ser muy fácil.

### Buenas prácticas UX que aplican (investigación)
- **Tallas como botones, no dropdowns**; información de tallas suficiente, en **cm**; productos **sobre modelo o maniquí**; fotos reales de clientas navegables (Baymard, apparel UX).
- En reservas, cada paso extra baja la conversión: **un solo CTA claro por pantalla** y nunca obligar a crear cuenta.
- Las transiciones nativas entre páginas (**View Transitions cross-document**) ya funcionan en Chrome/Edge 126+ y Safari 18.2+, y en Firefox simplemente no se ven. Se usan como mejora progresiva.

---

## 1. Diagnóstico del sitio actual

| Problema | Impacto |
|---|---|
| El rosa frambuesa `#C0275A` no sale del logo (que es negro + acuarela orquídea/lila) | Marca incoherente |
| Navegación con mezcla de anclas y rutas, y el menú móvil con varios fixes encima (commits recientes) | UX confusa, bugs en tablet |
| `style.css` de 4,300 líneas y `main.js` de 1,150 en un solo archivo | Difícil de mantener |
| `node_modules/` versionado en git; `generar_manual.py`, `manual-codigo.docx` y `flyer-ig.html` se publican con el sitio | Repo pesado, archivos internos expuestos |
| `motion@latest` desde CDN sin versión fija | Un update puede romper el sitio |
| PNG de ~2 MB conviviendo con los WebP | Peso innecesario |
| `aggregateRating` 4.9/100 escrito a mano en el JSON-LD | Google lo puede tratar como marcado engañoso. Quitarlo o ligarlo a datos reales |
| No hay ficha de producto individual: no se puede compartir un vestido | Se pierde la viralidad por WhatsApp |
| Faltan aviso de privacidad, aviso de cookies, robots.txt y sitemap.xml | Riesgo legal y SEO débil |
| Las fotos del catálogo vienen de URLs de AppSheet | Lentas, sin tamaños responsivos |

---

## 2. Decisiones de arquitectura

**Mantener:** HTML + CSS + JS vanilla, Supabase (tablas `inventario` y `galeria_clientas`), GitHub Pages, dominio `alsdress.com.mx`, Motion para animaciones.

**Cambiar:** pasar a **Vite multi-page** (el stack habitual de RamosMKT) para tener:
- Partials compartidos (header, footer, banner de cookies) sin copiar y pegar en 7 páginas: `vite-plugin-handlebars` o equivalente ligero.
- Imágenes optimizadas, CSS/JS minificados y dependencias con versión fija (`motion`, `@supabase/supabase-js` por npm, no por CDN).
- Deploy con **GitHub Actions → GitHub Pages** (workflow oficial `actions/deploy-pages`). `CNAME`, `robots.txt` y `sitemap.xml` van en `public/`.

> Si Vite complica el deploy, la alternativa aceptable es seguir estático con un `partials.js` que inyecte header y footer. **Pregunta a David antes de decidir.**

### Estructura objetivo
```
/
├─ index.html                 (Inicio)
├─ catalogo/index.html        (Catálogo con filtros)
├─ vestido/index.html         (Ficha: /vestido/?m=<slug>)
├─ como-rentar/index.html     (Proceso, políticas, guía de tallas)
├─ aviso-de-privacidad/index.html
├─ politica-de-cookies/index.html
├─ 404.html
├─ public/  (CNAME, robots.txt, sitemap.xml, favicon, og-image.jpg, imágenes)
├─ src/
│  ├─ styles/  tokens.css · base.css · layout.css · components/*.css · pages/*.css
│  ├─ js/      supabase.js · catalogo.js · vestido.js · mi-lista.js · whatsapp.js · tracking.js · consent.js · motion.js · nav.js
│  └─ partials/ header.hbs · footer.hbs · cookie-banner.hbs · bottom-bar.hbs
└─ .github/workflows/deploy.yml
```
Mover fuera del sitio publicado (a `/_interno/` en `.gitignore` o a otro repo): `generar_manual.py`, `manual-codigo.docx`, `flyer-ig.html`, `supabase-galeria.sql`, los PNG originales.

---

## 3. Sistema visual (del moodboard aprobado)

### Tokens: `src/styles/tokens.css`
```css
:root{
  --ink:#1A141C;        /* textos, trazo del logo */
  --orchid-700:#6E3A87; /* CTA principal, enlaces (AA sobre blanco) */
  --orchid-800:#4E2862; /* hover del CTA */
  --lila:#A873BB;       /* íconos, subrayados, detalles */
  --malva:#E3ACDA;      /* acentos sobre fondo oscuro, etiquetas */
  --lavanda:#B6A5E0;    /* secundario */
  --rubor:#F3E6EE;      /* fondos de sección */
  --champagne:#F2DDD1;  /* fondos de foto */
  --marfil:#FBF8F5;     /* fondo base */
  --noche:#2A1E30;      /* bloques oscuros */
  --muted:#5B5160;      /* texto secundario (AA) */
  --line:#E6DCE6;
  --wa:#1F8F55;         /* SOLO botón WhatsApp */

  --font-display:'Playfair Display',Georgia,serif;
  --font-body:'Lato',system-ui,sans-serif;
  --font-script:'Allura',cursive; /* 1–3 palabras máx., nunca párrafos */

  --radius-sm:12px; --radius:16px; --radius-lg:20px; --pill:999px;
  --shadow:0 8px 28px rgba(110,58,135,.08);
  --ease-out:cubic-bezier(.22,1,.36,1);
  --ease-soft:cubic-bezier(.25,.46,.45,.94);

  /* Tipografía fluida */
  --fs-h1:clamp(2.4rem,1.6rem + 3.6vw,4rem);
  --fs-h2:clamp(1.9rem,1.4rem + 2vw,2.6rem);
  --fs-body:clamp(1rem,.95rem + .2vw,1.125rem);
  --space-section:clamp(4rem,3rem + 5vw,8rem);
}
```
- **Eliminar todo rastro de `#C0275A`** (y la variable `--rose`).
- **Logo:** no se modifica, ni se recolorea, ni se recorta de forma distinta. Exportar `logo.svg` o un PNG con transparencia a partir de `Icono.jpg`, sin cambiar el diseño.
- Fuentes: Google Fonts con `display=swap` y solo los pesos que se usan (Playfair 400/400i/600, Lato 400/700, Allura). Preconnect y preload de la fuente del H1.

### Componentes base
Botón primario (orquídea, pill, 52 px de alto) · botón secundario (contorno orquídea) · botón WA (verde, con ícono) · chips de filtro · tarjeta de producto · badge "Disponible / Apartado" · acordeón FAQ · pasos 1-2-3 · tarjeta de testimonio · bottom sheet (filtros en móvil) · toast · banner de cookies.
Todos con estado `:focus-visible` (anillo de 2 px `--lila` + offset) y área táctil ≥ 44 px.

---

## 4. Mapa del sitio y navegación

**Header (desktop):** Logo · Catálogo · Cómo rentar · Opiniones · Visítanos · [♡ Mi lista (n)] · [WhatsApp]
- Header sticky que se compacta al hacer scroll (alto 88 → 64 px, fondo marfil translúcido con `backdrop-filter`).
- "Opiniones" y "Visítanos" son anclas del inicio. Desde otras páginas apuntan a `/#opiniones` y `/#visitanos`.

**Móvil (< 768 px):**
- Header mínimo: logo + ícono de menú.
- **Barra inferior fija** (bottom bar, respetando `env(safe-area-inset-bottom)`): `Catálogo` · `Mi lista` · `WhatsApp`. Reemplaza el botón flotante actual.
- Menú a pantalla completa con links grandes, horario, dirección y redes. Cierra con Esc, con el overlay y al navegar. Focus trap.

**Footer:** logo · dirección + "Cómo llegar" · horario `[PENDIENTE: horario real]` · WhatsApp · Instagram/Facebook · links a Aviso de privacidad y Política de cookies · "Configurar cookies" · crédito "Sitio por RamosMKT" (con link, sirve para captar clientes).

### Páginas

1. **Inicio `/`**
   1. **Hero:** "El vestido que *buscabas*." + subtítulo + CTA "Ver colección" + secundario "Agendar prueba" (Setmore). Debajo, una barra de búsqueda rápida: **Ocasión** [XV · Graduación · Boda · Gala] × **Talla** [chips] → abre `/catalogo` ya filtrado.
   2. **Prueba de confianza en una línea:** ★ calificación de Google `[PENDIENTE: dato real]` · "Ajustes incluidos" · "Pruébatelo en tienda".
   3. **Compra por ocasión:** 4 tarjetas grandes con foto (en lugar de "categorías por tipo de prenda").
   4. **Novedades / destacados:** carrusel con scroll-snap nativo, que se puede arrastrar, sin librería.
   5. **Cómo rentar en 3 pasos:** Elige en línea → Pruébatelo → Luce y devuelve. Link a `/como-rentar`.
   6. **Arma tu look:** vestido + zapatos + bolsa + accesorio (upsell; enlaza al catálogo filtrado).
   7. **Ellas ya lo lucieron (`#opiniones`):** galería de clientas (Supabase `galeria_clientas`) + reseñas reales de Google.
   8. **FAQ corta** (las 4 más importantes) + link a todas.
   9. **Visítanos (`#visitanos`):** mapa con lazy load (fachada estática; el iframe se carga al tocar), dirección, horario, botones "Cómo llegar" y "Agendar prueba".
   10. **CTA final** sobre fondo `--noche`: "Tu vestido te está esperando" + WhatsApp.

2. **Catálogo `/catalogo`**
   - Filtros: **Ocasión, Talla (chips), Color (swatches), Largo, Tipo (vestido/zapato/bolsa/accesorio), Solo disponibles (switch)**. En desktop van en sidebar sticky; en móvil, en un **bottom sheet** con contador "Ver 24 resultados".
   - Los filtros se guardan en la URL (`?ocasion=xv&talla=M&color=lila`) para que los links compartidos y los anuncios caigan ya filtrados.
   - Grid responsivo con `auto-fill, minmax(…)` y container queries en la tarjeta.
   - Tarjeta: foto 3:4 con `aspect-ratio` fijo (CLS 0), nombre, tallas disponibles, badge de estado, precio "Renta desde $[PRECIO]" si existe en la BD, ♡ para Mi lista.
   - Skeletons mientras carga y un estado vacío útil: "No hay en esa talla. Escríbenos, a veces llegan nuevos" + WA.
   - Paginación con "Cargar más" o scroll infinito con un sentinel.

3. **Ficha de vestido `/vestido/?m=<slug>`** *(nueva, muy importante para vender)*
   - Galería con swipe y zoom; tallas como botones (disponible / apartado); colores; precio; "Ideal para: XV, Graduación".
   - CTA principal: **"Preguntar por este vestido"** → WhatsApp con mensaje prellenado:
     `Hola, me interesa el vestido "<nombre>" en talla <talla>. Mi evento es el <fecha>. ¿Está disponible?` (campo de fecha opcional antes de enviar).
   - Secundarios: "Agendar prueba" (Setmore), "Añadir a Mi lista", **"Compartir"** (Web Share API; si no hay soporte, copiar link).
   - "Complétalo con…" (zapatos/bolsas) y "También te puede gustar".
   - Meta OG dinámicos no funcionan en un sitio estático, así que hay que generar en build un `og-image` genérico. *(Fase futura: generar páginas estáticas por vestido desde Supabase en build, para SEO.)*

4. **Cómo rentar `/como-rentar`**
   - Pasos detallados, políticas (duración 3–4 días, depósito 50 %, ajustes, daños, cancelaciones; copiar el texto **exacto** de las FAQ actuales), **guía de tallas en cm** `[PENDIENTE: tabla de medidas]`, FAQ completa con `FAQPage` schema, CTA "Agendar prueba".

5. **Aviso de privacidad `/aviso-de-privacidad`**: ver sección 7.
6. **Política de cookies `/politica-de-cookies`**: ver sección 7.
7. **404**: con buscador por ocasión y links a Catálogo y WhatsApp.

---

## 5. Funciones para destacar sobre la competencia

1. **Mi lista (favoritos):** en `localStorage` (con try/catch), contador en el header y la bottom bar. Botón **"Enviar mi lista por WhatsApp"**, que manda un solo mensaje con los 1–5 vestidos, tallas y links: *"Quiero probarme estos 3"*. Llegan leads de alta intención y la tienda prepara las prendas antes de la visita.
2. **Buscador por ocasión + talla** desde el hero, en dos toques.
3. **"Avísame cuando llegue en mi talla":** botón a WhatsApp con mensaje prellenado. Alimenta una lista de difusión de WhatsApp Business.
4. **Banner de temporada configurable:** un JSON o una fila en Supabase (`campanas`: texto, fecha_inicio, fecha_fin, link) controla un aviso discreto, por ejemplo "Graduaciones 2027: aparta con tiempo".
5. **Urgencia honesta:** si la fecha del evento que escribe la clienta es en menos de 7 días, el mensaje de WA agrega "(es urgente)". Nada de contadores falsos.
6. **Compartir con mamá o amigas:** Web Share API en la ficha y en Mi lista.

---

## 6. Animaciones, transiciones y efectos

Principio: **elegante y lento, nunca saltón**. Duraciones de 250–600 ms, `--ease-out`. Todo se desactiva con `prefers-reduced-motion: reduce` (ya existe la base en `main.js`; conservarla).

| Momento | Efecto | Implementación |
|---|---|---|
| Carga del hero | **"Telón de probador":** dos paneles color rubor se abren desde el centro y revelan la foto; luego el H1 entra palabra por palabra (fade + 12 px) | CSS `clip-path` + Motion `stagger(.06)`. Solo la primera visita de la sesión (`sessionStorage`) |
| Firma de marca | **Líneas de abanico** de la falda del logo, dibujadas como SVG `stroke-dashoffset` detrás de títulos de sección | SVG inline, trazo `--lila` al 40 %, se dibuja al entrar al viewport |
| Scroll | Reveal suave (opacity + translateY 16 px) por sección, con stagger en grids | `animation-timeline: view()` con `@supports`; si no hay soporte, IntersectionObserver + Motion |
| Hover de tarjeta (solo `@media (hover:hover)`) | Foto con zoom 1.04, segunda foto en crossfade si existe, ♡ aparece | CSS transitions |
| Ícono de gancho | Micro-animación de **gancho que se balancea** al añadir a Mi lista; el contador hace un "pop" | Motion spring |
| Catálogo → ficha | **Morph de la foto** de la tarjeta a la galería de la ficha | View Transitions cross-document: `@view-transition{navigation:auto}` + `view-transition-name` único por foto. Mejora progresiva |
| Filtros | Las tarjetas se reacomodan con animación FLIP | Motion `animate` sobre las posiciones |
| Header | Se compacta al bajar; se oculta al bajar rápido y reaparece al subir (solo en móvil) | IntersectionObserver / scroll pasivo con rAF |
| Bottom sheet de filtros | Slide-up con spring, se cierra arrastrando hacia abajo | Motion + pointer events |
| Botón WA | Pulso sutil **una sola vez** a los 8 s (no en loop) | CSS keyframes |

Prohibido: parallax pesado en móvil, autoplay de video con sonido, animar `width`/`height`/`top` (solo `transform` y `opacity`), cursores personalizados.

---

## 7. Legal, cookies y medición

> David no es abogado y Claude tampoco: los textos legales se entregan como **borrador** para que la familia (y de preferencia un abogado o contador) los revise.

**Aviso de privacidad (LFPDPPP, publicada en el DOF el 20 de marzo de 2025):**
- Identidad y domicilio del responsable `[PENDIENTE: nombre o razón social, domicilio]`.
- Datos que se recaban: nombre, teléfono/WhatsApp, talla y medidas, fecha del evento, identificación o comprobante al rentar `[CONFIRMAR qué piden en tienda]`.
- Finalidades **primarias** (renta, apartado, ajustes, contacto) y **secundarias** (promociones, aviso de novedades), con la forma de negarse a las secundarias.
- Transferencias (si las hay), medios para ejercer derechos **ARCO**, mecanismo para revocar el consentimiento, uso de cookies (link a la política) y cómo se avisan los cambios.
- Autoridad: desde 2025 las funciones del INAI las tiene la **Secretaría Anticorrupción y Buen Gobierno**. Mencionarla de forma genérica.
- Versión **simplificada** en el banner o en el footer + versión **integral** en la página.

**Política de cookies:** lista de cookies reales (Google Ads/gtag: `_gcl_au` y otras; `localStorage` de Mi lista y del consentimiento), para qué sirven, duración y cómo rechazarlas.

**Banner de cookies + Google Consent Mode v2:**
- Para datos no sensibles, México permite el consentimiento tácito (aviso + opción de rechazar). Banner discreto abajo: "Usamos cookies para medir nuestros anuncios. [Aceptar] [Rechazar] [Más info]".
- `gtag('consent','default',{ad_storage, ad_user_data, ad_personalization, analytics_storage})` **antes** de cargar `gtag.js`, y después `gtag('consent','update',…)` con la elección. Guardar la elección en `localStorage` y ofrecer "Configurar cookies" en el footer.

**Conversiones (no romper lo que ya funciona):**
- Conservar `AW-11262534800` y la conversión al hacer clic en WhatsApp (`trackWAClick` actual), **y verificar con Tag Assistant después del deploy**.
- Centralizar en `tracking.js`: `track(evento, params)`. Eventos nuevos: `click_whatsapp` (con `origen`: header/ficha/lista/bottom-bar), `agendar_prueba`, `enviar_lista_wa`, `agregar_lista`, `ver_vestido`, `filtro_aplicado`, `click_como_llegar`, `click_llamar`.
- Recomendado: agregar el **Meta Pixel** (David usa Meta Ads) con el mismo consentimiento. `[CONFIRMAR ID]`.

**robots.txt** (`public/robots.txt`):
```
User-agent: *
Allow: /
Sitemap: https://alsdress.com.mx/sitemap.xml
```
**sitemap.xml:** `/`, `/catalogo/`, `/como-rentar/`, `/aviso-de-privacidad/`, `/politica-de-cookies/`, con `lastmod`. Generarlo en build si se puede.

---

## 8. Responsive: todos los dispositivos

- **Mobile-first.** Breakpoints por contenido: `480 · 768 · 1024 · 1280 · 1536`. Probar en **360×740, 390×844, 414×896, 768×1024, 820×1180, 1024×768 (tablet horizontal), 1280×800, 1440×900, 1920×1080**, y teléfonos en horizontal (alto ≤ 450 px: el hero no puede ocupar 100vh).
- Usar `100dvh`/`svh` en lugar de `100vh`; `env(safe-area-inset-*)` para el notch y la barra inferior.
- Tipografía y espaciado con `clamp()`; **container queries** en la tarjeta de producto; grids con `minmax()`.
- Imágenes: `<picture>` con AVIF y WebP, `srcset` 480/800/1200/1600, `sizes` correcto, `width`/`height` explícitos, `loading="lazy"` excepto el hero (`fetchpriority="high"`).
- Hover solo con `@media (hover:hover) and (pointer:fine)`; en táctil todo funciona con tap.
- Accesibilidad: contraste AA, `:focus-visible`, `lang="es-MX"`, landmarks, alt descriptivos ("Vestido largo lila con abertura, talla M"), acordeón con `aria-expanded` y lightbox con focus trap (ya existe; conservarlo).

---

## 9. Rendimiento y SEO

- **Metas:** LCP < 2.5 s en 4G, INP < 200 ms, CLS < 0.1, Lighthouse móvil ≥ 90 en las cuatro categorías.
- Mapa de Google con fachada (imagen y botón) en lugar del iframe al cargar.
- Fotos de inventario: *(fase futura)* migrar de AppSheet a **Supabase Storage** con image transformations para tener tamaños responsivos.
- **SEO local:** `<title>` y description únicos por página (por ejemplo "Renta de vestidos de noche en Reynosa | Als Boutique"), un H1 por página, canonical, OG/Twitter con `og-image.jpg` 1200×630.
  JSON-LD `ClothingStore` con dirección completa, `openingHoursSpecification` `[PENDIENTE]`, `sameAs` (Instagram, Facebook, Google Maps). **Quitar el `aggregateRating` inventado.** `FAQPage` en Cómo rentar, `BreadcrumbList` en las páginas internas.
- Palabras clave objetivo: renta de vestidos Reynosa, vestidos de noche Reynosa, vestidos de XV, damas, graduación y gala en Reynosa.

---

## 10. Fases de trabajo para Claude Code

**Se trabaja directo en `main`, en local (Claude Code en la PC de David). No crear ramas.**
- Ojo: GitHub Pages publica desde `main`, así que **cada `git push` publica el sitio en vivo**. Haz commits locales pequeños con mensajes claros, revisa en el servidor local (`npx serve -p 5500 .`, o `npm run dev` / `npm run preview` desde la fase 1) y **nunca hagas `git push` sin el OK explícito de David**.
- Antes de empezar cada sesión, corre `git pull` para traer cualquier cambio hecho desde otro lado.
- Las fases 0–1 cambian la forma de publicar (Vite + GitHub Actions). El primer push con Vite y el cambio en *Settings → Pages → Source: GitHub Actions* se hacen **juntos y con David presente**. Si no, el sitio queda en blanco.
- Mientras no se haga push, el sitio en vivo sigue igual. Se puede trabajar varias fases localmente y publicar cuando el inicio y el catálogo estén listos (fase 5).

| Fase | Entregable | Criterio de "listo" |
|---|---|---|
| **0. Limpieza** | `.gitignore` (node_modules, _interno, .DS_Store); sacar del repo `node_modules` y los archivos internos; inventario de lo que se borra o mueve | `git status` limpio, el sitio actual sigue funcionando igual |
| **1. Base Vite + deploy** | Vite MPA, partials, workflow de Pages, `public/CNAME` | Build verde; preview local idéntico al actual |
| **2. Tokens + componentes** | `tokens.css`, base, botones, chips, tarjetas, formularios; página `/_estilos` interna (no indexada) para revisar componentes | Cero `#C0275A`; contraste AA verificado |
| **3. Header, nav, footer, bottom bar** | Navegación nueva en todas las páginas | Funciona en los 9 tamaños; teclado y lector de pantalla OK |
| **4. Inicio** | Las 10 secciones | Lighthouse móvil ≥ 90 |
| **5. Catálogo + ficha + Mi lista** | Filtros en URL, ficha, WhatsApp prellenado, compartir | Un link filtrado abre filtrado; la lista se envía por WA |
| **6. Cómo rentar, legales, 404, robots, sitemap** | Páginas + banner de cookies con Consent Mode v2 | Textos marcados como borrador; consent verificado en DevTools |
| **7. Animaciones** | Telón del hero, líneas de abanico, view transitions, FLIP | Todo se apaga con reduced-motion; sin CLS |
| **8. QA + medición** | Pruebas en dispositivos, Tag Assistant, Search Console (enviar sitemap) | Conversión WA registrada en Google Ads; 0 errores en consola |

### Datos que hacen falta (pedírselos a David; nunca inventarlos)
Horario · dirección completa · razón social para el aviso · precios o rangos de renta (¿se muestran?) · tabla de tallas en cm · links de Instagram y Facebook · ID del Meta Pixel · calificación y número real de reseñas en Google · ¿hay columnas de `ocasion`, `color`, `precio`, `largo` en la tabla `inventario` de Supabase? (si no existen, proponer la migración SQL, **sin ejecutarla**).

---

## 11. Relación con el panel admin (`../AdminAls/sistema-als`)

Hay un panel admin aparte (repo `sistema-als`, HTML + JS + Supabase, PWA) con el que David da de alta vestidos, los publica u oculta en la web (`publicado`), marca destacados (`destacado`), cambia su estado (Disponible / Rentado…) y registra rentas y clientes. **La web y el admin comparten el mismo proyecto de Supabase.** El admin es la fuente de verdad del catálogo.

**Contrato que la web NO puede romper (solo lectura desde la web):**
- Tabla `inventario`: `id_articulo, codigo, nombre, tipo, talla, color, precio_base, estado_actual, foto, publicado, destacado`. La web filtra `publicado = true` y agrupa por `nombre` (un modelo con varias tallas = varias filas).
- `foto` puede ser un **nombre de archivo de AppSheet** (fotos viejas) o una **URL pública de Supabase Storage** (bucket `fotos`, vestidos nuevos). Conservar la lógica de `obtenerUrlFoto()` que maneja ambos casos.
- Tabla `galeria_clientas` (`foto_url, nombre, descripcion, activa`).
- **No renombrar ni borrar columnas, ni cambiar valores de `estado_actual`.** La web no escribe nada en Supabase.

**Si el rediseño necesita datos nuevos** (para filtros por ocasión, largo o varias fotos):
1. Proponer la migración SQL con columnas **opcionales** (nullable o con default), por ejemplo `ocasion text[]`, `largo text`, `fotos_extra text[]`, `slug text unique`. **No ejecutarla**: David la aplica.
2. Así el `insert` actual de `agregar.js` sigue funcionando sin cambios.
3. Después, agregar esos campos al formulario del admin (cambio pequeño en `agregar.html/js` y en el modal de `admin.js`) en una tarea aparte, en el repo del admin.
4. La web debe funcionar aunque esos campos vengan vacíos: si no hay `ocasion`, ese filtro no se muestra.

**Links de fichas:** el slug sale de `nombre`. Si David renombra un vestido en el admin, el link compartido se rompe, así que conviene la columna `slug` (punto 1) o hacer que la ficha acepte `?id=<id_articulo>` como respaldo.

**Seguridad (revisar en el dashboard de Supabase antes de publicar):** la key publishable está en el frontend público, así que las tablas `clientes` y `rentas` (datos personales) **deben tener RLS que niegue la lectura a `anon`**. `inventario` y `galeria_clientas` solo deben permitir `SELECT` público. Escribir solo con usuario autenticado (como ya está en `galeria_clientas`). Esto también lo exige el aviso de privacidad.

**Idea a futuro:** `rentas` ya guarda `fecha_evento`, `fecha_entrega` y `fecha_retorno`. Con una **vista o función RPC** que exponga solo `id_articulo` y fechas ocupadas (nunca datos de clientes) se puede hacer "¿Disponible para tu fecha?" en la ficha. Es un diferenciador fuerte para una fase posterior.

## 12. Oportunidades de negocio (para RamosMKT)
- Campañas de Meta Ads por ocasión que caigan en `/catalogo?ocasion=xv` (mensaje y página iguales = más conversión).
- El caso Als (antes y después, más métricas de conversión de WhatsApp) sirve como **portafolio** para venderles a otras boutiques, salones de eventos y tiendas de ropa de la región.
- Producto replicable: "Catálogo con disponibilidad + Mi lista por WhatsApp" como plantilla para otras rentas (trajes, vestidos de novia, mobiliario para eventos).
