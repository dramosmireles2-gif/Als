-- =============================================================
-- 004: mejoras de rendimiento del asesor de Supabase
-- (APLICADA el 3 oct 2026 con el OK de David). No cambia permisos.
-- =============================================================

-- Misma regla (solo con sesión), evaluada una vez por consulta
alter policy clientes_admin on public.clientes using ((select auth.role()) = 'authenticated');
alter policy rentas_admin on public.rentas using ((select auth.role()) = 'authenticated');
alter policy detalle_admin on public.detalle_renta using ((select auth.role()) = 'authenticated');

-- Galería: lectura la cubre galeria_publica; el admin solo escribe
drop policy if exists galeria_admin_auth on public.galeria_clientas;
create policy galeria_insert_auth on public.galeria_clientas for insert to authenticated with check (true);
create policy galeria_update_auth on public.galeria_clientas for update to authenticated using (true) with check (true);
create policy galeria_delete_auth on public.galeria_clientas for delete to authenticated using (true);

-- Índices de llaves foráneas
create index if not exists rentas_id_cliente_idx on public.rentas (id_cliente);
create index if not exists rentas_id_articulo_idx on public.rentas (id_articulo);
create index if not exists detalle_renta_id_renta_idx on public.detalle_renta (id_renta);
create index if not exists detalle_renta_id_articulo_idx on public.detalle_renta (id_articulo);
