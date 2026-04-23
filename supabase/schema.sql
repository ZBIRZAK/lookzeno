-- Run in Supabase SQL editor
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  cta_text text not null default 'Shop Now',
  cta_url text not null default '/products',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  category text not null,
  price numeric(10,2) not null,
  image_url text,
  media_video_url text,
  detail_image_url text,
  detail_section_title text,
  detail_section_text text,
  badge text,
  description text,
  info_sections jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  sizes text[] not null default '{S,M,L,XL,2XL}',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  variant_label text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_images_sort_order_idx on public.product_images(product_id, sort_order);
create unique index if not exists product_images_single_primary_idx
on public.product_images(product_id) where is_primary = true;

-- Backward-compatible upgrades if table already exists
alter table public.products add column if not exists description text;
alter table public.products add column if not exists media_video_url text;
alter table public.products add column if not exists detail_image_url text;
alter table public.products add column if not exists detail_section_title text;
alter table public.products add column if not exists detail_section_text text;
alter table public.products add column if not exists info_sections jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists tags text[] not null default '{}';
alter table public.products add column if not exists sizes text[] not null default '{S,M,L,XL,2XL}';

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  subtotal numeric(10,2) not null,
  total_items integer not null,
  channel text not null default 'whatsapp',
  status text not null default 'new',
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_name text not null,
  product_slug text,
  size text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_print_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  product_type text not null,
  quantity integer not null check (quantity > 0),
  logo_name text,
  design_json jsonb not null,
  status text not null default 'pending',
  note text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.hero_slides enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_print_requests enable row level security;

-- Drop legacy permissive policies
drop policy if exists "products public read" on public.products;
drop policy if exists "products public insert" on public.products;
drop policy if exists "products public update" on public.products;
drop policy if exists "products public delete" on public.products;
drop policy if exists "categories public read" on public.categories;
drop policy if exists "categories public insert" on public.categories;
drop policy if exists "categories public update" on public.categories;
drop policy if exists "categories public delete" on public.categories;
drop policy if exists "tags public read" on public.tags;
drop policy if exists "tags public insert" on public.tags;
drop policy if exists "tags public update" on public.tags;
drop policy if exists "tags public delete" on public.tags;
drop policy if exists "orders public read" on public.orders;
drop policy if exists "order items public read" on public.order_items;
drop policy if exists "custom print public read" on public.custom_print_requests;
drop policy if exists "product images storefront read" on public.product_images;
drop policy if exists "product images admin read" on public.product_images;
drop policy if exists "product images admin insert" on public.product_images;
drop policy if exists "product images admin update" on public.product_images;
drop policy if exists "product images admin delete" on public.product_images;
drop policy if exists "hero slides storefront read" on public.hero_slides;
drop policy if exists "hero slides admin read" on public.hero_slides;
drop policy if exists "hero slides admin insert" on public.hero_slides;
drop policy if exists "hero slides admin update" on public.hero_slides;
drop policy if exists "hero slides admin delete" on public.hero_slides;

-- Public storefront read
drop policy if exists "products storefront read" on public.products;
create policy "products storefront read" on public.products
for select using (is_active = true);

drop policy if exists "categories storefront read" on public.categories;
create policy "categories storefront read" on public.categories
for select using (true);

drop policy if exists "tags storefront read" on public.tags;
create policy "tags storefront read" on public.tags
for select using (true);

create policy "hero slides storefront read" on public.hero_slides
for select using (is_active = true);

create policy "product images storefront read" on public.product_images
for select using (is_active = true);

-- Admin dashboard read/write (requires signed in Supabase user)
drop policy if exists "products admin read" on public.products;
create policy "products admin read" on public.products
for select using (auth.role() = 'authenticated');

drop policy if exists "products admin insert" on public.products;
create policy "products admin insert" on public.products
for insert with check (auth.role() = 'authenticated');

drop policy if exists "products admin update" on public.products;
create policy "products admin update" on public.products
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "products admin delete" on public.products;
create policy "products admin delete" on public.products
for delete using (auth.role() = 'authenticated');

drop policy if exists "categories admin read" on public.categories;
create policy "categories admin read" on public.categories
for select using (auth.role() = 'authenticated');

drop policy if exists "categories admin insert" on public.categories;
create policy "categories admin insert" on public.categories
for insert with check (auth.role() = 'authenticated');

drop policy if exists "categories admin update" on public.categories;
create policy "categories admin update" on public.categories
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "categories admin delete" on public.categories;
create policy "categories admin delete" on public.categories
for delete using (auth.role() = 'authenticated');

drop policy if exists "tags admin read" on public.tags;
create policy "tags admin read" on public.tags
for select using (auth.role() = 'authenticated');

drop policy if exists "tags admin insert" on public.tags;
create policy "tags admin insert" on public.tags
for insert with check (auth.role() = 'authenticated');

drop policy if exists "tags admin update" on public.tags;
create policy "tags admin update" on public.tags
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "tags admin delete" on public.tags;
create policy "tags admin delete" on public.tags
for delete using (auth.role() = 'authenticated');

drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders
for select using (auth.role() = 'authenticated');

drop policy if exists "order items admin read" on public.order_items;
create policy "order items admin read" on public.order_items
for select using (auth.role() = 'authenticated');

drop policy if exists "custom print admin read" on public.custom_print_requests;
create policy "custom print admin read" on public.custom_print_requests
for select using (auth.role() = 'authenticated');

create policy "product images admin read" on public.product_images
for select using (auth.role() = 'authenticated');

create policy "product images admin insert" on public.product_images
for insert with check (auth.role() = 'authenticated');

create policy "product images admin update" on public.product_images
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "product images admin delete" on public.product_images
for delete using (auth.role() = 'authenticated');

create policy "hero slides admin read" on public.hero_slides
for select using (auth.role() = 'authenticated');

create policy "hero slides admin insert" on public.hero_slides
for insert with check (auth.role() = 'authenticated');

create policy "hero slides admin update" on public.hero_slides
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "hero slides admin delete" on public.hero_slides
for delete using (auth.role() = 'authenticated');

-- Public insert for checkout + custom requests
drop policy if exists "orders public insert" on public.orders;
create policy "orders public insert" on public.orders
for insert with check (true);

drop policy if exists "order items public insert" on public.order_items;
create policy "order items public insert" on public.order_items
for insert with check (true);

drop policy if exists "custom print public insert" on public.custom_print_requests;
create policy "custom print public insert" on public.custom_print_requests
for insert with check (true);

-- Storage bucket for product images (dashboard upload)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Storage policies for admin image management + public read
drop policy if exists "product images public read" on storage.objects;
drop policy if exists "product images admin write" on storage.objects;

create policy "product images public read" on storage.objects
for select using (bucket_id = 'product-images');

create policy "product images admin write" on storage.objects
for all using (bucket_id = 'product-images' and auth.role() = 'authenticated')
with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
