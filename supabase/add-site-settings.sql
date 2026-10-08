create table if not exists public.site_settings (
  id text primary key default 'site',
  email text not null default 'hello@example.com',
  phone text not null default '+92 318 8895244',
  whatsapp_url text,
  linkedin_url text,
  dribbble_url text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

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
