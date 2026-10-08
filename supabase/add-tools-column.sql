alter table public.projects
add column if not exists tools text[] not null default '{}';
