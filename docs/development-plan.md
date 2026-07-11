# План реалізації MVP — портфоліо флориста

Джерело вимог: [`../plan.md`](../plan.md). Цей файл — робочий план для розробки по сесіях + журнал прогресу. **Кожна сесія оновлює розділ "Журнал прогресу" в кінці файлу перед завершенням** (що зроблено, що залишилось, на чому зупинились, відомі проблеми).

Стек: Next.js 15 (App Router, TypeScript, src/), Tailwind CSS, Supabase (Postgres + Auth), Cloudinary, Vercel, Vitest (unit-тести критичної логіки).

## Підхід до тестування

Юніт-тестами (Vitest) свідомо покриваємо лише "чисту" бізнес-логіку, яка легко ламається мовчки і важко перевіряється на око: курсорна пагінація, перерахунок `order` при drag-and-drop, diff категорій, підпис Cloudinary. Ця логіка винесена в окремі функції в `src/lib/`, щоб тестуватись без підняття Next-сервера чи БД. UI-компоненти і сторінки залишаються на ручній перевірці (вже описана в кожній сесії) — для MVP такого масштабу повне покриття компонентів не окупається.

---

## Як користуватись цим файлом (для кожної нової сесії)

1. Прочитати розділ "Журнал прогресу" внизу — там стан на кінець попередньої сесії.
2. Знайти першу не позначену `[ ]` сесію нижче й виконати її завдання по порядку.
3. Перед комітом кожного завдання запускати `npm run build` (або хоча б `npm run lint`), а для сесій із unit-тестами — ще й `npm run test`.
4. Комітити маленькими логічними шматками (`git commit`), не одним велетенським комітом на сесію.
5. В кінці сесії дописати запис у "Журнал прогресу": дата, що зроблено, що не встигли, нотатки/пастки для наступної сесії.
6. Якщо в процесі роботи виявляється розбіжність з `plan.md` — не змінювати `plan.md` мовчки, зафіксувати рішення в журналі прогресу.

---

## Сесія 0 — Підготовка репозиторію ✅

- [x] Ініціалізовано git, підключено `origin` → `https://github.com/Feodosij/insta-portfolio.git`
- [x] Згенеровано Next.js застосунок (`create-next-app`: TypeScript, Tailwind, App Router, `src/`, alias `@/*`, ESLint)
- [x] Встановлено залежності: `@supabase/supabase-js`, `@supabase/ssr`, `@vercel/analytics`, `cloudinary`
- [x] `.gitignore` доповнено (env-файли вже покриті шаблоном Next.js, додано IDE/Supabase CLI темп-файли)
- [x] Створено `.env.example` з переліком змінних середовища
- [x] Створено цей файл плану

Деталі виконання — див. "Журнал прогресу" нижче, запис Session 0.

---

## Сесія 1 — Supabase: схема даних і клієнт

**Мета:** робоча БД і типізований клієнт, готовий до використання з публічної частини та адмінки.

**Файли:**
- Створити: `src/lib/supabase/client.ts` — браузерний клієнт (`createBrowserClient` з `@supabase/ssr`)
- Створити: `src/lib/supabase/server.ts` — серверний клієнт для Server Components/Route Handlers (`createServerClient`, робота з cookies через `next/headers`)
- Створити: `src/lib/supabase/middleware.ts` — helper для оновлення сесії в middleware
- Створити: `src/middleware.ts` — виклик helper'а для refresh сесії на кожен запит
- Створити: `supabase/schema.sql` — SQL-схема (тримати в репо як джерело правди, застосовувати вручну через Supabase SQL Editor)
- Створити: `src/lib/supabase/types.ts` — типи рядків таблиць (вручну або згенеровані `supabase gen types typescript`)

**Завдання:**

- [x] Створено проєкт у Supabase, ключі записано в `.env` (не `.env.local` — див. журнал; не комітиться, вже покрито `.gitignore`)
- [x] Написати `supabase/schema.sql`:

```sql
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
```

- [x] Застосувати `schema.sql` у Supabase SQL Editor, перевірити таблиці в UI (уже було застосовано до старту сесії; перевірено запитом `select count(*)` по всіх 4 таблицях через анон-ключ — 0 рядків, RLS не блокує читання)
- [ ] Створити в Supabase Auth єдиного користувача (email+пароль флориста/SMM) — **не перевірено цією сесією**, дивись нотатку в журналі
- [x] Реалізувати `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `src/proxy.ts` (стандартна SSR-схема Supabase для Next.js App Router; файл-конвенція `src/middleware.ts` перейменована на `src/proxy.ts` — див. журнал)
- [x] Написати `src/lib/supabase/types.ts` з типами `Category`, `Photo`, `SiteContentKey`
- [x] Перевірка: тестовий Server Component робить `select` з `categories` і рендерить результат без помилок RLS

---

## Сесія 2 — Cloudinary: завантаження фото

**Мета:** серверний ендпоінт для підписаного завантаження фото з адмінки напряму в Cloudinary.

**Файли:**
- Створити: `src/lib/cloudinary.ts` — конфіг SDK (`cloudinary.config` з env) + чиста функція `buildUploadSignature` (параметри → підпис)
- Створити: `src/lib/cloudinary.test.ts`
- Створити: `src/app/api/admin/cloudinary-signature/route.ts` — `POST`, повертає підпис для клієнтського upload widget/unsigned-safe upload
- Створити: `src/app/api/admin/photos/route.ts` — `POST` (зберегти запис фото в `photos` після успішного завантаження в Cloudinary)
- Створити: `src/app/api/admin/photos/[id]/route.ts` — `DELETE` (видалити з Cloudinary + з БД)

**Завдання:**

- [x] Створено акаунт/фолдер у Cloudinary, ключі вже були в `.env` на старті сесії
- [x] Встановити `vitest` (`npm install -D vitest`), додати скрипт `"test": "vitest run"` у `package.json`, базовий `vitest.config.ts`
- [x] Винести генерацію підпису (`cloudinary.utils.api_sign_request`) у чисту функцію `buildUploadSignature` в `src/lib/cloudinary.ts`, ендпоінт `cloudinary-signature` лише викликає її
- [x] Unit-тест `cloudinary.test.ts`: однакові параметри → однаковий підпис; зміна `timestamp`/`folder`/`public_id` → інший підпис (4/4 проходять)
- [x] Реалізувати `POST /api/admin/photos` — приймає `cloudinary_url`, `cloudinary_public_id`, зберігає рядок у `photos` з `order` = max+1
- [x] Реалізувати `DELETE /api/admin/photos/[id]` — видаляє з Cloudinary (`cloudinary.uploader.destroy`) і з БД
- [ ] Перевірка: вручну через curl/Postman залити тестове фото — **частково**: підтверджено, що всі 3 ендпоінти віддають 401 без сесії (RLS/auth-гейт працює); повний прогін зі справжнім завантаженням у Cloudinary не зроблено, бо потребує авторизованої сесії адміна (див. журнал)

---

## Сесія 3 — Головна сторінка (`/`)

**Мета:** hero-секція з фото на весь екран, плавний перехід до галереї.

**Файли:**
- Модифікувати: `src/app/page.tsx`
- Створити: `src/components/Hero.tsx`

**Завдання:**

- [ ] `Hero.tsx`: full-screen блок, висота через `min-h-[100dvh]` (не `100vh` — інакше в Instagram in-app browser адресний рядок з'їдає екран)
- [ ] Фонове фото з `site_content.hero_photo_url` (Next.js `<Image fill>`, поки — заглушка/плейсхолдер, реальне завантаження — Сесія 6)
- [ ] Ім'я по центру з `site_content.hero_name`
- [ ] Кнопка "Переглянути" — скрол до `#gallery` (`scroll-behavior: smooth` на `html` в `globals.css`, або програмний scrollIntoView)
- [ ] Перевірка вручну: відкрити на мобільному екрані (DevTools responsive), клік по кнопці плавно скролить вниз

---

## Сесія 4 — Галерея: masonry + таби

**Мета:** сітка фото у стилі Pinterest з фільтрацією за табами, дефолтний таб "Всі".

**Файли:**
- Створити: `src/components/Gallery.tsx`
- Створити: `src/components/GalleryTabs.tsx`
- Створити: `src/components/PhotoCard.tsx`
- Модифікувати: `src/app/page.tsx` (секція `id="gallery"`)

**Завдання:**

- [ ] Masonry-розкладка через CSS columns (`columns-2 sm:columns-3 gap-3`, кожна картка `break-inside-avoid`) — без зайвих бібліотек
- [ ] `GalleryTabs`: рендер табів з `categories` (сортування за `order`), таб "Всі" завжди першим і активний за замовчуванням
- [ ] Фільтрація фото за обраним табом через `photo_categories`
- [ ] Перевірка вручну: перемикання табів міняє набір фото без перезавантаження сторінки

Порожні стани (таб без фото, сайт без жодного фото) свідомо винесені окремо в Сесію 14 — тут `Gallery.tsx` поки просто рендерить порожню сітку для табу без фото.

---

## Сесія 5 — Lazy loading / infinite scroll галереї

**Мета:** порційне довантаження фото при скролі (100-300 фото не рендеряться одразу).

**Файли:**
- Створити: `src/lib/pagination.ts` — чиста функція побудови курсорної сторінки (вхід: повний відсортований список/query-параметри, вихід: `{ items, nextCursor }`)
- Створити: `src/lib/pagination.test.ts`
- Створити: `src/app/api/photos/route.ts` — `GET` з пагінацією (`?category=&cursor=&limit=`), використовує `src/lib/pagination.ts`
- Модифікувати: `src/components/Gallery.tsx` — інфініт скрол через `IntersectionObserver`

**Завдання:**

- [ ] Винести курсорну логіку (обчислення межі сторінки, `nextCursor`, фільтр за категорією) у чисту функцію в `src/lib/pagination.ts`; сортування й курсор — за composite-ключем `(order, id)`, а не лише `order` (бо `order` не гарантовано унікальний — без `id` як тайбрейкера при рівних значеннях можливі дублі/пропуски фото між сторінками)
- [ ] Unit-тест `pagination.test.ts`: перша сторінка без курсора, серединна сторінка, остання сторінка (елементів менше за `limit`), порожня категорія (0 фото), стабільний порядок при однакових значеннях `order` (перевірити саме тайбрейк по `id`)
- [ ] API-роут повертає сторінку фото (курсор по `(order, id)`), відфільтровану за категорією
- [ ] У `Gallery.tsx` — сентинел-елемент внизу списку, `IntersectionObserver` довантажує наступну сторінку
- [ ] Перемикання таба скидає пагінацію і список фото
- [ ] Перевірка вручну: наповнити тестові дані (20+ фото), проскролити — довантаження відбувається плавно, без дублів

---

## Сесія 6 — Повноекранний перегляд фото (swipe)

**Мета:** клік по фото відкриває повноекранний viewer зі свайпом між фото.

**Файли:**
- Створити: `src/components/PhotoViewer.tsx`
- Модифікувати: `src/components/Gallery.tsx` (передати індекс кліку у viewer)

**Завдання:**

- [ ] Модалка на весь екран, свайп вліво/вправо (touch events або невелика бібліотека типу `embla-carousel-react`)
- [ ] Клавіші стрілок і Esc для десктопу (закриття)
- [ ] Перевірка вручну на мобільному емуляторі: свайп працює, закриття по тапу поза фото/по Esc

---

## Сесія 7 — Розділ "Послуги / Як замовити"

**Мета:** текстовий блок + кнопки в месенджери, редаговані з адмінки.

**Файли:**
- Створити: `src/components/ServicesSection.tsx`
- Модифікувати: `src/app/page.tsx`

**Завдання:**

- [ ] Текст з `site_content.services_text`, посилання `site_content.instagram_url` / `telegram_url`
- [ ] Кнопки як прямі `<a href>` (без форми замовлення — свідомо поза MVP)
- [ ] Перевірка вручну: кнопки відкривають коректні deep-links на мобільному

---

## Сесія 8 — Технічні деталі сторінки

**Мета:** favicon, заголовок вкладки, Open Graph теги.

**Файли:**
- Додати: `src/app/favicon.ico` (або `icon.png`)
- Модифікувати: `src/app/layout.tsx` — `metadata` (title, description, OG title/description/image)

**Завдання:**

- [ ] `export const metadata: Metadata` у `layout.tsx` з `openGraph.images`, взяти прев'ю з `site_content.hero_photo_url` або статичного файлу
- [ ] Перевірка: `https://cards-dev.twitter.com/validator` або ручний перегляд `view-source` — теги присутні

---

## Сесія 9 — Адмінка: автентифікація

**Мета:** захищений вхід у `/admin` через Supabase Auth (email+пароль).

**Файли:**
- Створити: `src/app/admin/login/page.tsx`
- Створити: `src/app/admin/(protected)/layout.tsx` — перевірка сесії, редірект на `/admin/login` якщо немає
- Модифікувати: `src/middleware.ts` — захист `/admin/*` окрім `/admin/login`

**Завдання:**

- [ ] Форма логіну (email/пароль) через `supabase.auth.signInWithPassword`
- [ ] Кнопка логауту (`supabase.auth.signOut`)
- [ ] Перевірка вручну: без сесії `/admin` редіректить на `/admin/login`; після логіну — доступ є

---

## Сесія 10 — Адмінка: керування фото

**Мета:** список фото, завантаження нових, видалення з підтвердженням.

**Файли:**
- Створити: `src/app/admin/(protected)/photos/page.tsx`
- Створити: `src/components/admin/PhotoUploadForm.tsx`
- Створити: `src/components/admin/PhotoList.tsx`
- Створити: `src/components/admin/ConfirmDeleteModal.tsx`
- Створити: `src/app/api/admin/photos/route.ts` — `GET`, всі фото без пагінації, відсортовані за `order` (доповнює `POST` із Сесії 2 в тому ж файлі)

**Завдання:**

- [ ] Реалізувати `GET /api/admin/photos` — окремий admin-запит (весь список, без ліміту), а не перевикористання публічного `GET /api/photos` з Сесії 5 (той пагінований і розрахований на публічну галерею)
- [ ] Список фото з прев'ю (grid) на основі `GET /api/admin/photos`
- [ ] Форма завантаження: `<input type="file" accept="image/*" capture>` (галерея або камера телефону) → підпис із Сесії 2 → прямий upload у Cloudinary → `POST /api/admin/photos`
- [ ] Видалення: клік → модалка "Точно видалити?" → підтвердження → `DELETE /api/admin/photos/[id]`
- [ ] Перевірка вручну з мобільного браузера (реальний телефон або DevTools device mode): завантаження і видалення працюють

---

## Сесія 11 — Адмінка: порядок фото і прив'язка до табів

**Мета:** drag-and-drop сортування (touch-friendly) + вибір категорій для фото.

**Файли:**
- Модифікувати: `src/components/admin/PhotoList.tsx`
- Створити: `src/components/admin/PhotoCategoryPicker.tsx`
- Створити: `src/lib/reorder.ts` — чиста функція перерахунку `order` за новим масивом id (перевикористовується в Сесії 12 для табів)
- Створити: `src/lib/reorder.test.ts`
- Створити: `src/lib/categoryDiff.ts` — чиста функція diff старого/нового списку `category_ids` (що додати, що видалити)
- Створити: `src/lib/categoryDiff.test.ts`
- Створити: `src/app/api/admin/photos/reorder/route.ts` — `POST`, приймає новий порядок id, батч-апдейт `order` через `src/lib/reorder.ts`
- Створити: `src/app/api/admin/photos/[id]/categories/route.ts` — `PUT`, замінює зв'язки в `photo_categories` через `src/lib/categoryDiff.ts`

**Завдання:**

- [ ] Drag-and-drop через `@dnd-kit/core` + `@dnd-kit/sortable` (підтримує touch з коробки) — `npm install @dnd-kit/core @dnd-kit/sortable`
- [ ] Винести перерахунок `order` за новим масивом id у чисту функцію `src/lib/reorder.ts`
- [ ] Unit-тест `reorder.test.ts`: повний список id, частковий список, дублікати/невідомі id (не мають ламати решту порядку)
- [ ] Чекбокси/мультиселект табів на кожному фото, збереження через `PUT .../categories`
- [ ] Винести diff старого/нового `category_ids` у чисту функцію `src/lib/categoryDiff.ts`
- [ ] Unit-тест `categoryDiff.test.ts`: порожній → повний список, повний → порожній, без змін, часткова заміна
- [ ] Перевірка вручну на мобільному: перетягування пальцем міняє порядок, зміна зберігається після перезавантаження сторінки

---

## Сесія 12 — Адмінка: керування табами

**Мета:** CRUD категорій + порядок.

**Файли:**
- Створити: `src/app/admin/(protected)/tabs/page.tsx`
- Створити: `src/components/admin/TabsManager.tsx`
- Створити: `src/app/api/admin/categories/route.ts` — `POST`, `PUT`, `DELETE`
- Створити: `src/app/api/admin/categories/reorder/route.ts` — `POST`

**Завдання:**

- [ ] Список табів з `order`, форми додати/перейменувати/видалити
- [ ] Drag-and-drop переставлення (той самий підхід, що в Сесії 11), reorder-ендпоінт перевикористовує `src/lib/reorder.ts` — окремого unit-тесту не треба, логіка вже покрита в Сесії 11
- [ ] Видалення таба з фото — фото залишаються, просто втрачають зв'язок з цим табом (перевірити каскад `photo_categories`)
- [ ] Перевірка вручну: новий таб одразу з'являється в публічній галереї після рефрешу

---

## Сесія 13 — Адмінка: керування текстом сайту

**Мета:** редагування `site_content` (ім'я, hero-фото, текст послуг, посилання).

**Файли:**
- Створити: `src/app/admin/(protected)/content/page.tsx`
- Створити: `src/components/admin/SiteContentForm.tsx`
- Створити: `src/app/api/admin/content/route.ts` — `PUT`, upsert по `key`

**Завдання:**

- [ ] Форма з полями: ім'я, текст послуг, Instagram URL, Telegram URL, завантаження hero-фото (той самий Cloudinary-флоу, що й для галереї)
- [ ] Перевірка вручну: зміна імені в адмінці одразу відображається на публічній головній після рефрешу

---

## Сесія 14 — Порожні стани публічної частини

**Мета:** заглушки замість пустої сітки/галереї на перших запусках.

**Файли:**
- Створити: `src/components/EmptyState.tsx`
- Модифікувати: `src/components/Gallery.tsx`, `src/app/page.tsx`

**Завдання:**

- [ ] Заглушка "фото ще немає" на рівні таба без фото
- [ ] Заглушка на рівні всього сайту, якщо взагалі 0 фото в БД
- [ ] Перевірка вручну: тимчасово видалити всі фото з тестової БД, переконатись що немає пустих/зламаних блоків

---

## Сесія 15 — Деплой на Vercel і аналітика

**Мета:** робочий MVP на публічному URL, підключена базова аналітика.

**Файли:**
- Модифікувати: `src/app/layout.tsx` — підключити `<Analytics />` з `@vercel/analytics/react`
- Створити: `vercel.json` (за потреби — редіректи/заголовки)

**Завдання:**

- [ ] Підключити репозиторій до Vercel (Import Project), прописати env-змінні з `.env.example` у Vercel Dashboard
- [ ] `<Analytics />` в root layout
- [ ] Деплой, перевірка на реальному телефоні через посилання з Instagram (in-app browser) — саме той сценарій, під який робився `100dvh`-фікс
- [ ] Перевірити: hero, галерея з табами, infinite scroll, viewer, розділ послуг, OG-прев'ю при шарінгу лінка
- [ ] Фінальна перевірка адмінки з мобільного: логін, завантаження фото, drag-and-drop, редагування тексту

---

## Бэклог поза MVP (навмисно не плануємо зараз)

Форма замовлення на сайті, багатомовність, кілька адмін-користувачів/ролі, свій домен, автоматичне стиснення фото в адмінці, блок "Про флориста" — див. `plan.md`, розділ "Поза межами MVP".

---

## Журнал прогресу

### Session 0 — 2026-07-11

**Зроблено:**
- Прочитано `plan.md`, узгоджено стек: Next.js 15 (App Router, TS, `src/`), Tailwind, Supabase, Cloudinary, Vercel
- `git init`, `git remote add origin https://github.com/Feodosij/insta-portfolio.git` (репозиторій на GitHub був порожній — перевірено `git ls-remote` перед будь-яким пушем)
- Згенеровано Next.js застосунок через `create-next-app` (TypeScript, Tailwind, App Router, `src/`, alias `@/*`, ESLint), файли перенесені в корінь поряд з `plan.md`
- Встановлено пакети: `@supabase/supabase-js`, `@supabase/ssr`, `@vercel/analytics`, `cloudinary`
- Доповнено згенерований `.gitignore` (IDE-папки, Supabase CLI темп-файли; env-файли й так покриті шаблоном Next.js)
- Створено `.env.example` з переліком очікуваних змінних середовища (Supabase, Cloudinary)
- Створено цей файл (`docs/development-plan.md`) з планом по сесіях і журналом прогресу

**Не зроблено / далі:**
- Немає жодного реального проєкту Supabase чи Cloudinary — акаунти й ключі треба створити на Сесії 1 і 2
- Початковий комміт ще не зроблено на момент запису (буде зроблено одразу після цього запису, разом з пушем у `origin/main`)

**Нотатки для наступної сесії:**
- Наступний крок — Сесія 1 (Supabase: схема даних і клієнт)
- Точний текст/фото для hero і фінальний список табів-категорій ще не надані флористом/SMM (див. `plan.md`, "Відкриті питання") — до їх отримання використовувати плейсхолдери
- 2026-07-11: у план додано unit-тестування (Vitest) критичної логіки — див. розділ "Підхід до тестування" вище. `vitest` встановлюється на початку Сесії 2 (перше місце, де з'являється чиста логіка — підпис Cloudinary). Сесії 5, 11, 12 містять додаткові unit-тести (пагінація, reorder, diff категорій). Сесія 1 не змінена — Supabase-клієнти це в основному wiring, тестувати нічого
- 2026-07-11: перед стартом Сесії 1 знайдено й виправлено 4 неточності в самому плані сесій (без змін `plan.md`): (1) Сесія 2 — `DELETE` фото винесено в окремий файл `photos/[id]/route.ts`, бо файл-список і завдання розходились; (2) Сесія 4/14 — прибрано дублювання порожнього стану таба, лишили це виключно за Сесією 14; (3) Сесія 10 — зафіксовано окремий `GET /api/admin/photos` (весь список без пагінації) замість невизначеного "публічний ендпоінт або окремий запит"; (4) Сесія 5 — курсор пагінації уточнено як composite `(order, id)`, бо `order` сам по собі не унікальний

### Session 1+2 — 2026-07-11

**Важлива розбіжність із очікуваннями плану (не з `plan.md`, а з середовища):** локальний `next` у `node_modules` — це нестандартна збірка Next.js 16.2.10, де файл-конвенція `middleware.ts` перейменована на **`proxy.ts`** (експортована функція називається `proxy`, не `middleware`; `matcher` — без змін). `AGENTS.md` прямо наказує звіряти такі речі з `node_modules/next/dist/docs/` перед кодингом — так і зроблено (`docs/01-app/01-getting-started/16-proxy.md`, `docs/01-app/02-guides/authentication.md`). Тому:
- Helper з чистою логікою оновлення сесії лишився `src/lib/supabase/middleware.ts` (назва файлу не є Next-конвенцією, тому не перейменовувався)
- Спеціальний файл-конвенція Next створено як `src/proxy.ts` (замість `src/middleware.ts` з плану), він імпортує helper і експортує `proxy()` + `config.matcher`
- Перевірено в `next dev`: лог запиту показує `proxy.ts: Nms`, тобто Next дійсно підхопив файл

**Зроблено (Сесія 1):**
- Виявлено, що `.env` (не `.env.local`, як писав план) вже містив робочі ключі Supabase + Cloudinary, а `supabase/schema.sql` вже існував і **точно відповідав** тексту з плану — схему хтось (користувач) уже застосував заздалегідь. Перевірено `select count(*)` через анон-ключ по всіх 4 таблицях (`categories`, `photos`, `photo_categories`, `site_content`) — усі повернули `0`, RLS публічного читання працює
- Створено `src/lib/supabase/client.ts` (браузерний клієнт), `server.ts` (серверний, cookies через `next/headers`, generic `Database` тип), `middleware.ts` (helper `updateSession`), `src/proxy.ts` (виклик helper'а)
- Створено `src/lib/supabase/types.ts` — `Category`, `Photo`, `PhotoCategory`, `SiteContent(Key)` + generic `Database` для типізації `supabase-js`. Важлива деталь: щоб `.select("колонка")` коректно типізувався (а не виводився як `never`), `Database` **обов'язково** повинен містити `__InternalSupabase.PostgrestVersion` і порожні `Views`/`Functions`/`Enums`/`CompositeTypes` на рівні схеми — самих `Tables` з `Row/Insert/Update/Relationships` недостатньо для типового виводу postgrest-js v2. Відтворено мінімальним репро й перевірено виправлення окремим `tsc --noEmit` до застосування в проєкті
- Перевірка з плану ("тестовий Server Component робить `select` з `categories`") виконана: тимчасово додано `await supabase.from("categories").select("*")` у `page.tsx`, піднято `next dev`, отримано `200` і `categories: [] error: null` в логах, після чого зміну відкачено — `page.tsx` лишився в стані зі сесії 0

**Зроблено (Сесія 2):**
- Встановлено `vitest` (`^4.1.10`), додано скрипт `test`, `vitest.config.ts` (`environment: "node"`)
- `src/lib/cloudinary.ts`: `cloudinary.config()` з env + чиста `buildUploadSignature(paramsToSign, apiSecret?)` через `cloudinary.utils.api_sign_request`
- `cloudinary.test.ts`: 4 тести (стабільність підпису; зміна `timestamp`/`folder`/`public_id` → інший підпис) — усі проходять
- `POST /api/admin/cloudinary-signature`, `POST /api/admin/photos`, `DELETE /api/admin/photos/[id]` — усі три вимагають активної Supabase-сесії (`supabase.auth.getUser()` через cookie-клієнт із Сесії 1); без сесії повертають `401`. `POST /api/admin/photos` рахує `order` як `max+1`; `DELETE` спершу читає `cloudinary_public_id`, викликає `cloudinary.uploader.destroy`, потім видаляє рядок
- `npm run build` і `npm run lint` — чисто; `npm run dev` вручну: усі три ендпоінти без cookie повертають `401` (перевірено curl'ом)

**Не зроблено / далі:**
- Створення єдиного Auth-користувача в Supabase (email+пароль флориста/SMM) — план просив зробити це в Сесії 1, але не підтверджено в цій сесії: перевірка списку користувачів через service-role ключ була заблокована класифікатором дозволів (обробка PII — email/id реальних користувачів), тож не запитувалось і в користувача. **Наступній сесії потрібно уточнити в користувача, чи створено цього користувача**
- Повний ручний тест Сесії 2 "залити тестове фото через curl, побачити в Cloudinary і в `photos`" виконано лише частково: підтверджено `401` без сесії (сам гейт і RLS-логіка коректні), але **не** підтверджено успішний інсерт з реальною авторизованою сесією — для цього об'єктивно потрібен вхід (Сесія 9 ще не існує) або пароль адміна, який асистент не запитував. Це стосується самої послідовності сесій у плані: Сесія 2 передбачає ручну перевірку через HTTP, яка фактично залежить від автентифікації з Сесії 9. Рекомендація: коли Сесія 9 буде готова, повернутись і прогнати цей ручний тест end-to-end
- `supabase/schema.sql` і `.env` вже існували на диску до старту цієї сесії (не створювались асистентом з нуля) — лишено без змін, оскільки повністю відповідають плану

**Нотатки для наступної сесії:**
- Наступний крок — Сесія 3 (Головна сторінка `/`)
- Пам'ятати про `src/proxy.ts` замість `src/middleware.ts` у всіх майбутніх сесіях, які згадують middleware (зокрема Сесія 9 — захист `/admin/*`)
- При розширенні `src/lib/supabase/types.ts` новими таблицями не забувати `Relationships: []` на кожній таблиці — інакше `never`-тип на вибіркових `select()`
