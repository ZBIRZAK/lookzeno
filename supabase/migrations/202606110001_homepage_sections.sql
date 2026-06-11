create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  product_ids uuid[] not null default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.homepage_sections enable row level security;

drop policy if exists "homepage sections storefront read" on public.homepage_sections;
create policy "homepage sections storefront read" on public.homepage_sections
for select using (is_active = true);

drop policy if exists "homepage sections admin read" on public.homepage_sections;
create policy "homepage sections admin read" on public.homepage_sections
for select using (auth.role() = 'authenticated');

drop policy if exists "homepage sections admin insert" on public.homepage_sections;
create policy "homepage sections admin insert" on public.homepage_sections
for insert with check (auth.role() = 'authenticated');

drop policy if exists "homepage sections admin update" on public.homepage_sections;
create policy "homepage sections admin update" on public.homepage_sections
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "homepage sections admin delete" on public.homepage_sections;
create policy "homepage sections admin delete" on public.homepage_sections
for delete using (auth.role() = 'authenticated');
