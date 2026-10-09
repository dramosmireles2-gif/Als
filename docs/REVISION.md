# Revisión de dirección de arte: resultado (cambios 1 a 4)

Fecha: 9 de octubre de 2026. Base: `docs/REVISION-direccion-arte.md` (revisión con la skill direccion-arte-rmkt).
Capturas con Playwright (`scripts/capturas.mjs`), con fuentes de Google y datos de Supabase reales, a 375x812 y 1440x900:

| Página | Antes | Después |
|---|---|---|
| Inicio 375 | `revision/antes-inicio-375.png` | `revision/despues-inicio-375.png` |
| Inicio 1440 | `revision/antes-inicio-1440.png` | `revision/despues-inicio-1440.png` |
| Catálogo 375 | `revision/antes-catalogo-375.png` | `revision/despues-catalogo-375.png` |
| Catálogo 1440 | `revision/antes-catalogo-1440.png` | `revision/despues-catalogo-1440.png` |

Nota: en las capturas de página completa, la barra inferior y el aviso de cookies (fijos) aparecen a la altura de la primera pantalla.

## Conteo de señales genéricas (checklist de la skill)
| Señal | Antes | Después |
|---|---|---|
| Eyebrow en MAYÚSCULAS espaciadas | Sí (8 secciones + footer, menú, filtros, badges) | No |
| Cadenas "A · B · C" | Sí (hero, header, footer, confianza, ficha) | No |
| Palabra resaltada en el título | Sí (9 títulos en Allura) | No (Allura solo en la firma del footer) |
| Degradado decorativo | Sí (tarjetas de ocasión, fondo del hero, cierre) | No |
| Sombra idéntica en todo | Sí (sombra lila suave en todas las tarjetas) | Sí (sigue; ver pendientes) |
| Morado en botones | Justificado: sale del logo (no cuenta) | Igual |
| Resto de la lista (fuentes vetadas, hero centrado con badge, stats, "→", glows, glassmorphism, emojis, frases prohibidas) | No | No |
| **Total** | **4** | **1** (meta: 0 o 1) |

## Cambios (un commit cada uno)
1. `style(arte-1)`: sin eyebrows ni cadenas con "·"; etiquetas en sentence case; "en Reynosa" pasa a la frase del hero.
2. `style(arte-2)`: títulos sin palabra resaltada; Allura solo en "Als Dress" del footer (la firma).
3. `style(arte-3)`: aviso de cookies como franja compacta (~71 px) sobre la barra inferior en móvil; en el hero solo WhatsApp va lleno ("Ver colección" en contorno).
4. `style(arte-4)`: tarjetas de ocasión con fotos de `galeria_clientas` (XV "Damas lila", Boda "Boda Nestor", Gala "Vestido rojo"; Graduación "rosa" provisional con TODO-FOTO-REAL); sin degradados decorativos.

## Prueba de 5 segundos (hero móvil)
Qué vende (renta y venta de vestidos de fiesta), dónde (Reynosa, en el header y en la frase del hero) y cómo contactar (WhatsApp con número, visible sin scroll): sí.

## Pendientes
- **Hero (punto 5 de la revisión): HECHO.** Foto real de la tienda según el tamaño: `interior1` (horizontal, racks de color) en teléfono y tablet, con encuadre 3:2; `interior2` (vertical, pasillo con racks) en computadora, con encuadre cuadrado. Se descartó el carrusel: las fotos tienen orientaciones distintas, un hero que rota frena la carga y la skill pide un solo momento de movimiento. La imagen para compartir (og-image.jpg, 1200x630) también es de la tienda. Capturas: `revision/hero-tienda-375.png` y `revision/hero-tienda-1440.png`. Recomendación: una sesión de fotos en tienda (las actuales son de teléfono).
- **Graduación:** falta una foto real de una graduación.
- **Sombra única:** si se quiere llegar a 0 señales, quitar la sombra de las tarjetas sobre fondo blanco y dejarla solo en lo que flota (aviso, panel).
- **Galería:** la foto con id `1c1249c8…` apunta al panel de Supabase, no a una imagen.
- **Documentos de la skill** aún no creados: `BRIEF.md`, `REFERENCIAS.md`, `DESIGN.md` y la fila en el registro de estilos de RMKT.
- Confirmar si 4.9 y 89 reseñas siguen siendo los números actuales en Google.
