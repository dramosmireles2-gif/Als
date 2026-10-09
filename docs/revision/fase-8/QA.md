# QA Fase 8: antes de publicar (9 de octubre de 2026)

Build de producción (`npm run build` + `npm run preview`, puerto 4173), Chromium de Playwright 1.56.1.
Scripts usados: `_interno/qa-f8.mjs`, `qa-reducido.mjs`, `qa-conversion.mjs`, `qa-rechazo.mjs` (carpeta interna, no se sube).

## 1. Capturas
7 páginas (inicio, catálogo, vestido `?m=lentejuela-camel`, cómo rentar, aviso, cookies, 404) a 375, 768, 1024 y 1440 px,
página completa: `docs/revision/fase-8/<pagina>-<ancho>.png`. Hero con la foto de las clientas: `hero-375/768/1440.png`.

## 2. Consola, links e imágenes
| Revisión | Resultado |
|---|---|
| Errores de consola (28 combinaciones página × ancho) | **0** |
| Peticiones fallidas propias | **0** (antes: la foto de galería que apuntaba al panel de Supabase; ahora se filtra) |
| Links internos (34) | **0 rotos** |
| Links externos (Setmore, Instagram, Facebook, Maps, reseñas, RamosMKT, Google) | todos responden 200 |
| Imágenes visibles sin `width`/`height` o sin `alt` | **0** (se arregló el `<img>` del visor de fotos) |
| Desborde horizontal | **0** en todos los anchos |

Las únicas peticiones "abortadas" son de Google Analytics/Ads al cambiar de página: es normal.

## 3. Lighthouse móvil (`--throttling.cpuSlowdownMultiplier=1`, esta PC tiene benchmarkIndex 370–770)
| Página | Performance | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| Inicio | 83–89 | 100 | 79 | 100* |
| Catálogo | 79–84 | 100 | 79 | 100 |

\* En una corrida salió 92 porque Lighthouse no alcanzó a bajar robots.txt; el archivo sí se sirve (200).
Buenas prácticas = 79 por las cookies de Google Ads (terceros); no se puede quitar sin quitar la medición.

Performance no llega a 90 en esta PC. Lo que se corrigió:
- La fuente de respaldo de Allura buscaba "Georgia Italic" (no existe) y frenaba el primer layout.
- nav.js leía `scrollY` al cargar y forzaba el layout dentro del script.
- Lo que falta en el catálogo depende de las fotos: el LCP es una foto de AppSheet de tamaño completo
  (Lighthouse estima 1.2 MB de ahorro). Se resuelve al correr `node scripts/migrar-fotos.mjs --aplicar`.
- La medición que vale es PageSpeed Insights ya publicado.

## 4. prefers-reduced-motion
Con `reducedMotion: 'reduce'`: 0 animaciones o transiciones de más de 20 ms en las 7 páginas, al abrir/cerrar filtros,
al guardar con ♡ (sin rebote) y al ir a un vestido (sin View Transition). No hay telón.
CLS: inicio 0.0001, catálogo 0.0009, vestido 0, cómo rentar 0, cookies 0, 404 0.002, aviso 0.05–0.06.
- Se corrigió: la tarjeta de carga de "Piezas destacadas" medía 17 px menos que la real; la galería de clientas
  ahora se pide antes (1600 px) para no empujar las reseñas.
- El 0.05 del aviso no es animación: es el cambio de Arial a Lato en un texto largo. Está en "bueno" (< 0.1).
  Opción si se quiere 0: cargar Lato con `display=optional`.

## 5. WhatsApp y conversión (Consent Mode v2)
- Todos los links a wa.me llevan mensaje prellenado según la página (header, menú, barra inferior, footer, hero, cierre,
  catálogo, vestido, Mi lista, cómo rentar, aviso, 404). Los del vestido y Mi lista se arman con el modelo, la talla y la fecha.
- Decisión de David (9 oct): se queda el **consentimiento tácito** (válido en México): se mide salvo que toquen "Rechazar".

Cómo se verificó: Playwright escuchó las peticiones a `pagead/conversion` y `viewthroughconversion` de `11262534800`
con la etiqueta `_Ri3CMHfnrwcEJDJsvop` después de tocar el botón de WhatsApp del hero.
| Escenario | Conversión enviada | `gcs` | Cookies `_ga`/`_gcl` |
|---|---|---|---|
| Sin tocar el aviso | sí | G111 (todo permitido) | sí |
| Tocó "Aceptar" | sí | G111 | sí |
| Tocó "Rechazar" | solo aviso anónimo | G100 (denegado) | **ninguna** |
| Rechazó y cambió de página | `consent default = denied`, el aviso ya no aparece | | ninguna |

Pendiente después de publicar: confirmar con Tag Assistant y en Google Ads → Conversiones que entra el clic.

## 6. [PENDIENTE] que siguen en el sitio
1. **Aviso de privacidad:** `[PENDIENTE: nombre completo o razón social del responsable]` (se ve en la página).
2. Aviso de privacidad y política de cookies marcados como **BORRADOR**: revisar con abogado o contador.
3. Foto de **graduación** provisional en "¿Para qué es tu vestido?" (TODO-FOTO-REAL).
4. Confirmar calificación **4.9 con 89 reseñas** en Google.
5. Fotos del catálogo aún en AppSheet: correr el script de migración.
6. Galería de clientas: corregir la fila `1c1249c8…` que apunta al panel de Supabase (ya no se muestra).
7. Supabase: apagar registros nuevos y activar la protección de contraseñas filtradas.
