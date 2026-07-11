create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  cloudinary_url text not null,
  cloudinary_public_id text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create table photo_categories (
  photo_id uuid not null references photos(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (photo_id, category_id)
);

create table site_content (
  key text primary key,
  value text not null
);

-- ключі, які очікує публічна частина (заповнити вручну або через адмінку):
-- 'hero_name', 'hero_photo_url', 'services_text', 'instagram_url', 'telegram_url'

alter table categories enable row level security;
alter table photos enable row level security;
alter table photo_categories enable row level security;
alter table site_content enable row level security;

-- публічне читання всім (сайт без логіну)
create policy "public read categories" on categories for select using (true);
create policy "public read photos" on photos for select using (true);
create policy "public read photo_categories" on photo_categories for select using (true);
create policy "public read site_content" on site_content for select using (true);

-- запис тільки автентифікованим (єдиний адмін-користувач)
create policy "auth write categories" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write photos" on photos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write photo_categories" on photo_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write site_content" on site_content for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
