-- =============================================================
-- PROPUESTA 003: proteger inventario y galería (NO EJECUTADA)
--
-- Problema encontrado (3 oct 2026, solo lectura):
--   * inventario: RLS DESACTIVADO. Con la llave pública que está en el
--     código del sitio, cualquiera podría crear, cambiar, ocultar o borrar
--     vestidos sin iniciar sesión.
--   * galeria_clientas: la regla "galeria_admin" permite a cualquiera
--     (sin sesión) crear, cambiar o borrar fotos de la galería.
--
-- Qué hace esta propuesta:
--   * El sitio (sin sesión) solo puede LEER: vestidos publicados y la galería.
--   * El panel admin (siempre entra con correo y contraseña = "authenticated")
--     conserva todo lo que hace hoy: leer todo, agregar, editar, publicar,
--     destacar, cambiar estado y borrar vestidos.
--   * El panel de Supabase y los scripts con la llave service_role no se
--     ven afectados (esa llave ignora estas reglas).
--
-- Cómo aplicarla: Supabase → SQL Editor → pegar → Run.
-- Cómo revertirla: al final del archivo.
-- =============================================================
begin;

-- ---- INVENTARIO ----
alter table public.inventario enable row level security;

-- Quitar la regla que dejaba escribir a cualquiera
drop policy if exists inventario_escritura on public.inventario;

-- El sitio solo ve los vestidos publicados
drop policy if exists inventario_lectura_publica on public.inventario;
create policy inventario_lectura_web on public.inventario
  for select to anon using (publicado = true);

-- El admin (con sesión) ya tiene: allow_select_auth, allow_insert_auth,
-- allow_update_auth. Falta borrar (admin.js lo usa al eliminar un vestido):
drop policy if exists allow_delete_auth on public.inventario;
create policy allow_delete_auth on public.inventario
  for delete to authenticated using (true);

-- ---- GALERÍA DE CLIENTAS ----
-- Quitar la regla que dejaba escribir a cualquiera
drop policy if exists galeria_admin on public.galeria_clientas;
-- Solo con sesión se puede agregar, editar o borrar
create policy galeria_admin_auth on public.galeria_clientas
  for all to authenticated using (true) with check (true);
-- "galeria_publica" (lectura para todos) se queda igual.

commit;

-- =============================================================
-- REVERTIR (solo si algo del admin dejara de funcionar):
-- begin;
--   drop policy if exists inventario_lectura_web on public.inventario;
--   drop policy if exists allow_delete_auth on public.inventario;
--   create policy inventario_lectura_publica on public.inventario for select to public using (true);
--   create policy inventario_escritura on public.inventario for all to public using (true) with check (true);
--   alter table public.inventario disable row level security;
--   drop policy if exists galeria_admin_auth on public.galeria_clientas;
--   create policy galeria_admin on public.galeria_clientas for all to public using (true);
-- commit;
-- =============================================================
