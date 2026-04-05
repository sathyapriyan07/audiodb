-- Musics schema (PostgreSQL / Supabase)
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Media tables
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  profile_image jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artists_name_unique unique (name)
);

create trigger artists_set_updated_at
before update on public.artists
for each row execute function public.set_updated_at();

create index if not exists artists_name_trgm on public.artists using gin (name gin_trgm_ops);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  -- Kept for backward compatibility / “primary artist” (optional). For multi-artist, use `album_artists`.
  artist_id uuid references public.artists(id) on delete set null,
  cover_image jsonb,
  release_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If the project was created with an older version where `albums.artist_id` was NOT NULL,
-- drop the NOT NULL constraint (best-effort).
do $$
begin
  begin
    alter table public.albums alter column artist_id drop not null;
  exception when undefined_column then
    -- ignore
  when insufficient_privilege then
    raise notice 'Skipping alter albums.artist_id (insufficient_privilege).';
  end;
end $$;

create trigger albums_set_updated_at
before update on public.albums
for each row execute function public.set_updated_at();

create index if not exists albums_title_trgm on public.albums using gin (title gin_trgm_ops);
create index if not exists albums_artist_id_idx on public.albums (artist_id);

create table if not exists public.album_artists (
  album_id uuid not null references public.albums(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  role text,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (album_id, artist_id)
);

create index if not exists album_artists_artist_id_idx on public.album_artists (artist_id);
create unique index if not exists album_artists_order_unique on public.album_artists (album_id, "order");

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  duration integer,
  release_date date,
  album_id uuid references public.albums(id) on delete set null,
  cover_image jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger songs_set_updated_at
before update on public.songs
for each row execute function public.set_updated_at();

create index if not exists songs_title_trgm on public.songs using gin (title gin_trgm_ops);
create index if not exists songs_album_id_idx on public.songs (album_id);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger playlists_set_updated_at
before update on public.playlists
for each row execute function public.set_updated_at();

create index if not exists playlists_title_trgm on public.playlists using gin (title gin_trgm_ops);

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platforms_name_unique unique (name)
);

create trigger platforms_set_updated_at
before update on public.platforms
for each row execute function public.set_updated_at();

-- Join tables
create table if not exists public.song_artists (
  song_id uuid not null references public.songs(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  primary key (song_id, artist_id)
);

create index if not exists song_artists_artist_id_idx on public.song_artists (artist_id);

create table if not exists public.song_streaming_links (
  song_id uuid not null references public.songs(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now(),
  primary key (song_id, platform_id)
);

create table if not exists public.album_streaming_links (
  album_id uuid not null references public.albums(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now(),
  primary key (album_id, platform_id)
);

create table if not exists public.playlist_songs (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (playlist_id, song_id)
);

create unique index if not exists playlist_songs_order_unique on public.playlist_songs (playlist_id, "order");

-- Home sections (admin-controlled)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'entity_type') then
    create type public.entity_type as enum ('songs', 'albums', 'artists', 'playlists');
  end if;
end $$;

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  entity_type public.entity_type not null,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger home_sections_set_updated_at
before update on public.home_sections
for each row execute function public.set_updated_at();

create unique index if not exists home_sections_one_featured on public.home_sections (is_featured) where is_featured;

create table if not exists public.home_section_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.home_sections(id) on delete cascade,
  entity_type public.entity_type not null,
  entity_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists home_section_items_order_unique on public.home_section_items (section_id, sort_order);
create unique index if not exists home_section_items_entity_unique on public.home_section_items (section_id, entity_type, entity_id);

-- External IDs (dedupe + re-import safety)
create table if not exists public.external_entity_links (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  entity_type public.entity_type not null,
  external_id text not null,
  local_id uuid not null,
  created_at timestamptz not null default now(),
  constraint external_entity_links_provider_chk check (provider in ('deezer')),
  constraint external_entity_links_unique unique (provider, entity_type, external_id)
);

create index if not exists external_entity_links_local_id_idx on public.external_entity_links (local_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.albums enable row level security;
alter table public.songs enable row level security;
alter table public.playlists enable row level security;
alter table public.platforms enable row level security;
alter table public.song_artists enable row level security;
alter table public.album_artists enable row level security;
alter table public.song_streaming_links enable row level security;
alter table public.album_streaming_links enable row level security;
alter table public.playlist_songs enable row level security;
alter table public.home_sections enable row level security;
alter table public.home_section_items enable row level security;
alter table public.external_entity_links enable row level security;

-- Profiles
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Public read + admin write policies
do $$
declare
  t text;
begin
  foreach t in array array[
    'artists','albums','songs','playlists','platforms',
    'song_artists','album_artists','song_streaming_links','album_streaming_links','playlist_songs',
    'home_sections','home_section_items','external_entity_links'
  ]
  loop
    execute format('drop policy if exists "public read" on public.%I;', t);
    execute format('create policy "public read" on public.%I for select using (true);', t);

    execute format('drop policy if exists "admin write" on public.%I;', t);
    execute format('create policy "admin write" on public.%I for insert with check (public.is_admin());', t);
    execute format('drop policy if exists "admin update" on public.%I;', t);
    execute format('create policy "admin update" on public.%I for update using (public.is_admin()) with check (public.is_admin());', t);
    execute format('drop policy if exists "admin delete" on public.%I;', t);
    execute format('create policy "admin delete" on public.%I for delete using (public.is_admin());', t);
  end loop;
end $$;

-- Storage
-- Note: On some environments you may not be the owner of `storage.objects`, which will cause
-- "must be owner of table objects". This block is best-effort and will skip with a NOTICE if
-- you lack privileges. The app still works with external image URLs; uploads require Storage policies.
do $$
begin
  begin
    insert into storage.buckets (id, name, public)
    values ('media', 'media', true)
    on conflict (id) do nothing;
  exception when insufficient_privilege then
    raise notice 'Skipping bucket create (insufficient_privilege). Create bucket "media" manually in Storage.';
  end;

  begin
    -- Usually already enabled in Supabase, but kept for completeness.
    alter table storage.objects enable row level security;
  exception when insufficient_privilege then
    raise notice 'Skipping storage.objects RLS enable (insufficient_privilege).';
  end;

  begin
    drop policy if exists "media public read" on storage.objects;
    create policy "media public read"
    on storage.objects
    for select
    using (bucket_id = 'media');

    drop policy if exists "media admin write" on storage.objects;
    create policy "media admin write"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'media' and public.is_admin());

    drop policy if exists "media admin update" on storage.objects;
    create policy "media admin update"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'media' and public.is_admin())
    with check (bucket_id = 'media' and public.is_admin());

    drop policy if exists "media admin delete" on storage.objects;
    create policy "media admin delete"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'media' and public.is_admin());
  exception when insufficient_privilege then
    raise notice 'Skipping storage.objects policies (insufficient_privilege). Configure Storage policies in Supabase Studio.';
  end;
end $$;
