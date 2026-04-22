# Supabase Backend Setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In project settings, copy:
   - Project URL
   - anon public key
4. Create `.env` from `.env.example` and fill values.
5. Restart dev server.

## Create Admin User (Dashboard Login)

1. Go to `Authentication -> Users` in Supabase.
2. Click `Add user`.
3. Create an email/password account.
4. Use this account in `/dashboard` login form.

## Product Image Upload

- Dashboard uploads product images to storage bucket: `product-images`.
- The SQL script creates bucket + policies automatically.
- If you use another bucket name, set:
  - `REACT_APP_SUPABASE_PRODUCT_BUCKET=your-bucket-name`
- The same bucket is used for homepage hero slide images (`hero/` folder).

## Optional seed query

```sql
insert into public.categories (name, slug, description)
values
('T-Shirts','t-shirts','Best-selling graphic and embroidered tees'),
('Hoodies','hoodies','Oversized fits and premium fleece'),
('Casquettes','casquettes','Minimal caps with premium embroidery')
on conflict (slug) do nothing;

insert into public.tags (name, slug)
values
('Best Seller','best-seller'),
('New','new'),
('Limited','limited')
on conflict (slug) do nothing;

insert into public.products (slug, name, category, price, image_url, badge, is_featured, is_active)
values
('shutter-speed','Shutter Speed Tee','T-Shirts',29,'', 'Best Seller', true, true),
('production-tee','Production Tee','T-Shirts',29,'', 'New', true, true),
('reverb-tee','Reverb Tee','T-Shirts',29,'', 'Popular', true, true),
('studio-casquette','Studio Casquette','Casquettes',24,'', 'New', true, true)
on conflict (slug) do nothing;
```

## Notes

- Checkout sends WhatsApp order and also saves order to Supabase.
- Custom Print requests are inserted into `custom_print_requests`.
- Dashboard write actions (products/categories/tags) require authenticated user login.
