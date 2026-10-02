-- =============================================================
-- PROPUESTA 001: ocasión de cada vestido (NO EJECUTADA)
-- Para: filtro por ocasión en el inicio y en el catálogo.
--
-- Cómo aplicarla (cuando David lo decida):
--   Supabase → SQL Editor → pegar este archivo → Run.
--
-- Es segura para el panel admin (../AdminAls/sistema-als):
--   - La columna es opcional (puede quedar vacía), así que el
--     insert actual de agregar.js sigue funcionando igual.
--   - No renombra ni borra nada, ni toca estado_actual.
--   - La web solo la lee; si viene vacía, el filtro no se muestra.
--
-- Valores sugeridos: 'xv', 'graduacion', 'boda', 'gala'
-- (un vestido puede tener varias: {'xv','gala'}).
-- =============================================================

alter table public.inventario
  add column if not exists ocasion text[];

comment on column public.inventario.ocasion is
  'Ocasiones para las que sirve el vestido: xv, graduacion, boda, gala. Opcional.';

-- Índice para filtrar rápido por ocasión
create index if not exists inventario_ocasion_idx
  on public.inventario using gin (ocasion);

-- Ejemplo para marcar un vestido (cambiar el nombre):
-- update public.inventario set ocasion = array['xv','gala'] where nombre = 'Oro satin';
