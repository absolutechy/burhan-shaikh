create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  description text,
  role text,
  platform text,
  focus text,
  duration text,
  tags text[] not null default '{}',
  tools text[] not null default '{}',
  palette text[] not null default '{}',
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt text,
  caption text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id text primary key default 'site',
  email text not null default 'hello@example.com',
  phone text not null default '+92 318 8895244',
  whatsapp_url text,
  linkedin_url text,
  dribbble_url text,
  updated_at timestamptz not null default now()
);

create index if not exists projects_published_sort_idx on public.projects (published, sort_order);
create index if not exists project_images_project_sort_idx on public.project_images (project_id, sort_order);

alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
on public.projects for select
using (published = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated admins manage projects" on public.projects;
create policy "Authenticated admins manage projects"
on public.projects for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read images for published projects" on public.project_images;
create policy "Public can read images for published projects"
on public.project_images for select
using (
  exists (
    select 1 from public.projects
    where projects.id = project_images.project_id
    and (projects.published = true or auth.role() = 'authenticated')
  )
);

drop policy if exists "Authenticated admins manage images" on public.project_images;
create policy "Authenticated admins manage images"
on public.project_images for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
using (true);

drop policy if exists "Authenticated admins manage site settings" on public.site_settings;
create policy "Authenticated admins manage site settings"
on public.site_settings for all
to authenticated
using (true)
with check (true);

insert into public.site_settings (id, email, phone, whatsapp_url, linkedin_url, dribbble_url)
values ('site', 'hello@example.com', '+92 318 8895244', 'https://wa.me/923188895244', '#', '#')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read project image files" on storage.objects;
create policy "Public can read project image files"
on storage.objects for select
using (bucket_id = 'project-images');

drop policy if exists "Authenticated admins manage project image files" on storage.objects;
create policy "Authenticated admins manage project image files"
on storage.objects for all
to authenticated
using (bucket_id = 'project-images')
with check (bucket_id = 'project-images');
