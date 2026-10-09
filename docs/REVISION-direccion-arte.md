# Revisión con la skill direccion-arte-rmkt — rediseño Als Dress

Fecha: 9 de octubre de 2026. Revisado: commit `ca579be` (fases 0 a 6, sin push).
Capturas: build local a 375x812 y 1440x900 (`docs/revision/`).
Límite de la revisión: desde el entorno de revisión no cargaron Google Fonts ni Supabase, así que las capturas
muestran fuentes de respaldo y el catálogo/destacados vacíos. Tipografía real y catálogo: revisar en local con Playwright.

## Veredicto
Buena base: el plan es sólido (embudo real, objeciones de la clienta, tú, WhatsApp prellenado, Mi lista,
legales, sin aggregateRating inventado, fotos reales del local, reseñas reales enlazadas a Google).
Pero el inicio todavía se lee como "plantilla de boutique": **4 señales genéricas** (meta: 0 o 1) y
**imágenes que no son de la tienda** en lugares clave.

## Señales genéricas encontradas (checklist de la skill)
| # | Señal | Dónde | Corrección |
|---|---|---|---|
| 1 | Eyebrows en MAYÚSCULAS espaciadas | 8 secciones ("COMPRA POR OCASIÓN", "ASÍ DE FÁCIL", "OPINIONES"…) y etiquetas del footer | Quitarlas. Si una sección necesita contexto, que lo diga el título en sentence case |
| 2 | Cadenas "A · B · C" | "ALS BOUTIQUE · REYNOSA, TAMAULIPAS", "REYNOSA · RENTA Y VENTA" | Una frase normal: "Renta y venta de vestidos en Reynosa" |
| 3 | Palabra resaltada en el título | "buscabas.", "lucieron", "look", "esperando" (4 veces) | Dejar Allura en **un solo lugar** del sitio (la firma), no en cada título |
| 4 | Degradados decorativos | Tarjetas de ocasión sin foto (rubor→malva, lila) | Fotos reales por ocasión (ver abajo) |

No aparecen: hero centrado con badge, "→" en botones, glows, glassmorphism fuerte, emojis como íconos,
frases prohibidas, fade-in en cada sección. Los pasos 1-2-3 sí son una secuencia real: se quedan.
El morado orquídea en botones está justificado porque sale del logo.

## Imágenes (el cambio de mayor impacto)
- **Hero** (4 mujeres en vestidos sobre fondo rosa) y **"Arma tu look"** (vestido en maniquí, zapatos, bolsas,
  accesorios): parecen foto de catálogo de proveedor o generadas, no de la tienda. La skill pide foto real
  primero y stock solo temporal con `TODO-FOTO-REAL`. Confirmar de dónde salen.
- La tienda real tiene identidad propia que hoy no se usa: paredes rosas, racks llenos de color,
  probadores grises con el logo de luna, plantas. Las 3 fotos de interior solo aparecen abajo en Visítanos.
- Tarjetas de ocasión: usar fotos de clientas reales de `galeria_clientas` (XV, graduación, boda, gala), con permiso.

## Conversión
- **Móvil:** el banner de cookies tapa el texto del hero en la primera pantalla. Hacerlo una franja compacta
  abajo (sobre la barra inferior) o pasarlo a un aviso pequeño; el botón de WhatsApp de la barra sí se ve.
- **Escritorio:** el hero tiene dos botones llenos (WhatsApp verde y "Ver colección" orquídea) más "Agendar"
  y 7 chips de talla. Un solo primario por pantalla: WhatsApp lleno; "Ver colección" en contorno.
- **Prueba de 5 segundos (móvil):** qué vende y dónde, sí; cómo contactar, sí (barra inferior).

## Tipografía
Playfair Display + Lato es la pareja más usada en plantillas de boutique. No está prohibida y el moodboard
ya la aprobó: mantenerla, pero ganar carácter con jerarquía (H1 más grande en móvil, Playfair en itálica
solo en la firma) en lugar de colorear palabras.

## Cambios en orden de prioridad
1. Quitar eyebrows en mayúsculas y cadenas "A · B · C" en todo el sitio.
2. Quitar la palabra resaltada de los títulos; dejar Allura en un solo lugar.
3. Banner de cookies compacto en móvil; un solo botón primario en el hero.
4. Tarjetas de ocasión con fotos reales de clientas; quitar degradados.
5. Decisión de David (9 oct): las imágenes generadas son ilustrativas. "Arma tu look" (categorías) se queda así. El **hero** cambia a foto real: `interior2` (racks de la tienda) de inmediato, o foto de clientas de `galeria_clientas` con permiso, o sesión de fotos en tienda. Marcar el hero actual con `TODO-FOTO-REAL` mientras tanto.
6. Revisar tipografía y catálogo en local con Playwright (fuentes y Supabase reales).

## Pendiente de confirmar con David
- Fotos generadas: confirmado por David, son ilustrativas (ver punto 5).
- ¿El 4.9 y las 89 reseñas siguen siendo los números actuales en Google?
