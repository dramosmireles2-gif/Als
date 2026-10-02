-- =============================================================
-- PROPUESTA 002: columnas foto2 y foto3 (APLICADA el 3 oct 2026 con el OK de David)
--
-- El panel admin (admin.js, modal de edición) YA intenta guardar
-- fotos extra en las columnas foto2 y foto3, pero esas columnas no
-- existen: hoy esa actualización falla sin avisar.
-- Con esta propuesta el admin empieza a funcionar tal como está escrito
-- y la página de cada vestido muestra hasta 3 fotos.
--
-- Es segura: columnas opcionales, no cambia nada de lo existente.
-- Aplicar en Supabase → SQL Editor → Run.
-- =============================================================

alter table public.inventario
  add column if not exists foto2 text,
  add column if not exists foto3 text;

comment on column public.inventario.foto2 is 'Segunda foto (URL de Supabase Storage). Opcional.';
comment on column public.inventario.foto3 is 'Tercera foto (URL de Supabase Storage). Opcional.';
