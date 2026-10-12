-- Base del panel de Paolini. Se corre una sola vez en Supabase:
-- SQL Editor → pegar todo → Run.
--
-- Quién puede entrar: sólo usuarios con sesión iniciada (rol "authenticated").
-- Como el registro está apagado y las cuentas las crea el administrador, eso
-- equivale a "los dueños". Sin sesión (rol "anon") no se puede leer nada.

create table if not exists public.autos (
  id             uuid primary key default gen_random_uuid(),
  patente        text not null unique,
  marca          text not null,
  modelo         text not null,
  tipo           text not null default 'Auto',
  combustible    text not null default 'Nafta',
  color          text,
  anio           integer,
  km             integer,
  precio         bigint,
  estado         text not null default 'disponible'
                 check (estado in ('disponible', 'reservado', 'vendido')),
  foto_path      text,                 -- ruta dentro del bucket privado "autos"
  reconocido_por text,                 -- cómo se asoció la foto con el Excel
  creado         timestamptz not null default now()
);

alter table public.autos enable row level security;

drop policy if exists "autos: ver" on public.autos;
drop policy if exists "autos: cargar" on public.autos;
drop policy if exists "autos: editar" on public.autos;
drop policy if exists "autos: borrar" on public.autos;

create policy "autos: ver"    on public.autos for select to authenticated using (true);
create policy "autos: cargar" on public.autos for insert to authenticated with check (true);
create policy "autos: editar" on public.autos for update to authenticated using (true) with check (true);
create policy "autos: borrar" on public.autos for delete to authenticated using (true);

-- Fotos: bucket privado (sin URL pública). El panel pide enlaces firmados que
-- vencen a la hora.
insert into storage.buckets (id, name, public)
values ('autos', 'autos', false)
on conflict (id) do update set public = false;

drop policy if exists "fotos: ver" on storage.objects;
drop policy if exists "fotos: subir" on storage.objects;
drop policy if exists "fotos: reemplazar" on storage.objects;
drop policy if exists "fotos: borrar" on storage.objects;

create policy "fotos: ver"        on storage.objects for select to authenticated using (bucket_id = 'autos');
create policy "fotos: subir"      on storage.objects for insert to authenticated with check (bucket_id = 'autos');
create policy "fotos: reemplazar" on storage.objects for update to authenticated using (bucket_id = 'autos');
create policy "fotos: borrar"     on storage.objects for delete to authenticated using (bucket_id = 'autos');
