# Als Dress: alsdress.com.mx

Sitio de **Als Boutique**, negocio familiar de renta y venta de vestidos de fiesta en Reynosa, Tamaulipas. Proyecto de RamosMKT (David Ramos).

**Estamos en pleno rediseño. Lee y sigue `PLAN-REDISENO.md` por fases.**

## Reglas fijas
- **El logo no se cambia** (ni colores, ni forma, ni recorte creativo).
- Paleta del moodboard aprobado: tinta `#1A141C`, orquídea `#6E3A87` (CTA), lila `#A873BB`, malva `#E3ACDA`, lavanda `#B6A5E0`, rubor `#F3E6EE`, champagne `#F2DDD1`, marfil `#FBF8F5`, noche `#2A1E30`, WhatsApp `#1F8F55`. **No usar `#C0275A`.**
- Tipografía: Playfair Display (títulos), Lato (texto), Allura (acentos de 1–3 palabras).
- Tono: de **tú**, cálido y cercano. Nada de "estimada clienta".
- **No romper la medición:** Google Ads `AW-11262534800` y la conversión al hacer clic en WhatsApp.
- WhatsApp: `https://wa.me/528991947566`. Agenda: `https://alsdress.setmore.com`.
- Nunca inventes precios, horarios, reseñas ni datos legales: usa `[PENDIENTE: …]` y pregúntale a David.
- Supabase: tablas `inventario` (filtro `publicado = true`) y `galeria_clientas`. Solo se usa la key publishable en el frontend. Los cambios de esquema se proponen como SQL y **no se ejecutan** sin permiso.
- **El catálogo se administra desde otro repo, `../AdminAls/sistema-als`** (mismo Supabase). La web solo lee: no renombrar ni borrar columnas, no cambiar valores de `estado_actual` y conservar `obtenerUrlFoto()` (fotos de AppSheet y de Supabase Storage). Ver la sección 11 del plan.
- Mobile-first, accesible (AA, foco visible, áreas táctiles ≥ 44 px), respetar `prefers-reduced-motion`.
- Se trabaja **directo en `main`, en local, sin crear ramas**. GitHub Pages publica desde `main`, así que **`git push` = publicar en vivo**: haz solo commits locales y **nunca hagas push sin el OK explícito de David**. Corre `git pull` al iniciar cada sesión.
- Servidor local: `npx serve -p 5500 .` (actual) o `npm run dev` (después de la fase 1).
