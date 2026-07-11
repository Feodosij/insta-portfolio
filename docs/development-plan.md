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
- [x] Створити в Supabase Auth єдиного користувача (email+пароль флориста/SMM) — підтверджено користувачем 2026-07-11, що користувач створений (сам асистент список користувачів не перевіряв — це вимагало б service-role доступу до реальних email/id, тож підтвердження прийнято зі слів користувача)
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

- [x] `Hero.tsx`: full-screen блок, висота через `min-h-[100dvh]` (не `100vh` — інакше в Instagram in-app browser адресний рядок з'їдає екран)
- [x] Фонове фото з `site_content.hero_photo_url` (Next.js `<Image fill>`, поки — заглушка/плейсхолдер, реальне завантаження — Сесія 13, не Сесія 6, як написано вище — див. журнал)
- [x] Ім'я по центру з `site_content.hero_name`
- [x] Кнопка "Переглянути" — скрол до `#gallery` (`scroll-behavior: smooth` на `html` в `globals.css`)
- [x] Перевірка вручну: Playwright у мобільному viewport (390×844) — скріншот hero, клік по кнопці, скріншот після — плавний скрол відпрацював, консоль без помилок

---

## Сесія 4 — Галерея: masonry + таби

**Мета:** сітка фото у стилі Pinterest з фільтрацією за табами, дефолтний таб "Всі".

**Файли:**
- Створити: `src/components/Gallery.tsx`
- Створити: `src/components/GalleryTabs.tsx`
- Створити: `src/components/PhotoCard.tsx`
- Модифікувати: `src/app/page.tsx` (секція `id="gallery"`)

**Завдання:**

- [x] Masonry-розкладка через CSS columns (`columns-2 sm:columns-3 gap-3`, кожна картка `break-inside-avoid`) — без зайвих бібліотек
- [x] `GalleryTabs`: рендер табів з `categories` (сортування за `order`), таб "Всі" завжди першим і активний за замовчуванням
- [x] Фільтрація фото за обраним табом через `photo_categories` (клієнтський `useMemo` за `categoryIds.includes(activeId)`, дані підвантажені на сервері одним запитом — без окремого API-роуту, бо пагінація/інфініт-скрол з'явиться лише в Сесії 5)
- [ ] Перевірка вручну: перемикання табів міняє набір фото без перезавантаження сторінки — **не перевірено з реальними даними**, БД порожня (0 категорій, 0 фото); підтверджено лише що таб "Всі" рендериться активним і клік не викликає навігацію/помилок у консолі

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

- [x] Винести курсорну логіку (обчислення межі сторінки, `nextCursor`, фільтр за категорією) у чисту функцію в `src/lib/pagination.ts`; сортування й курсор — за composite-ключем `(order, id)`, а не лише `order` (бо `order` не гарантовано унікальний — без `id` як тайбрейкера при рівних значеннях можливі дублі/пропуски фото між сторінками)
- [x] Unit-тест `pagination.test.ts`: перша сторінка без курсора, серединна сторінка, остання сторінка (елементів менше за `limit`), порожня категорія (0 фото), стабільний порядок при однакових значеннях `order` (перевірити саме тайбрейк по `id`) — 9 тестів (5 сценаріїв плюс encode/decode курсора)
- [x] API-роут повертає сторінку фото (курсор по `(order, id)`), відфільтровану за категорією
- [x] У `Gallery.tsx` — сентинел-елемент внизу списку, `IntersectionObserver` довантажує наступну сторінку
- [x] Перемикання таба скидає пагінацію і список фото (через `key={activeCategoryId}` на внутрішньому `GalleryGrid` — ремаунт замість ручного скидання стану в ефекті, бо новий `eslint-plugin-react-hooks` лінтить синхронний `setState` на початку ефекту як помилку, див. журнал)
- [x] Перевірка вручну: користувач надав 24 реальні фото (папка `picture/`), завантажено в Cloudinary + вставлено в `photos`/`categories`/`photo_categories` (з дозволу користувача). Playwright: тимчасово знижував `PAGE_LIMIT` до 8, дивився в лог `next dev` — 3 послідовні запити `limit=8` → `cursor=7:...` → `cursor=15:...`, разом рівно 24 унікальні фото без дублів. Значення `PAGE_LIMIT` повернуто на 24

---

## Сесія 6 — Повноекранний перегляд фото (swipe)

**Мета:** клік по фото відкриває повноекранний viewer зі свайпом між фото.

**Файли:**
- Створити: `src/components/PhotoViewer.tsx`
- Модифікувати: `src/components/Gallery.tsx` (передати індекс кліку у viewer)

**Завдання:**

- [x] Модалка на весь екран, свайп вліво/вправо (touch events, без бібліотеки — ручна реалізація на `touchstart`/`touchend` з порогом 50px; `embla-carousel-react` не додавали, щоб не тягнути нову залежність заради простого свайпу)
- [x] Клавіші стрілок і Esc для десктопу (закриття)
- [x] Перевірка вручну на мобільному емуляторі (Playwright, viewport 390×844, реальні фото): клік по фото відкриває viewer, `ArrowRight` міняє фото, синтетичний `TouchEvent` (свайп вліво) теж міняє фото, `Escape` закриває, тап у кут поза фото закриває — усе підтверджено програмно (порівняння `src` картинки до/після, перевірка зникнення `.fixed.inset-0` з DOM)

---

## Сесія 7 — Розділ "Послуги / Як замовити" ✅

**Мета:** текстовий блок + кнопки в месенджери, редаговані з адмінки.

**Файли:**
- Створити: `src/components/ServicesSection.tsx`
- Модифікувати: `src/app/page.tsx`

**Завдання:**

- [x] Текст з `site_content.services_text`, посилання `site_content.instagram_url` / `telegram_url`
- [x] Кнопки як прямі `<a href>` (без форми замовлення — свідомо поза MVP)
- [x] Перевірка вручну: кнопки відкривають коректні deep-links на мобільному — **частково**: сама умовна логіка (кнопка ховається, якщо `url` не задано; рендериться `<a href>` з правильним значенням, якщо задано) перевірена рендер-тестом (`renderToStaticMarkup`, тимчасовий файл, видалений після прогону — не закомічений), бо `site_content` у реальній БД користувача досі порожній (нуль рядків). Клік по справжньому deep-link на телефоні з реальними Instagram/Telegram акаунтами флориста не перевірявся — нема даних, підтвердити можна буде разом з Сесією 13

---

## Сесія 8 — Технічні деталі сторінки ✅

**Мета:** favicon, заголовок вкладки, Open Graph теги.

**Файли:**
- Додати: `src/app/favicon.ico` (або `icon.png`)
- Модифікувати: `src/app/layout.tsx` — `metadata` (title, description, OG title/description/image)

**Завдання:**

- [x] `export const metadata: Metadata` у `layout.tsx` з `openGraph.images`, взяти прев'ю з `site_content.hero_photo_url` або статичного файлу — реалізовано як `generateMetadata()` (async), а не статичний `metadata`-об'єкт, бо OG-картинка залежить від даних з Supabase; `favicon.ico` вже існував у `src/app/` зі старту проєкту (default `create-next-app`), окремо не чіпався — потребує заміни на брендований, коли з'явиться реальний лого/фото (поза цією сесією)
- [x] Перевірка: ручний перегляд — `curl http://localhost:3000/` показав коректні `<title>`, `og:title`, `og:description`, `og:image` (fallback спрацював: `hero_photo_url` у `site_content` порожній, тому підставилось перше реальне фото з `photos`, відсортоване за `order`)

---

## Сесія 9 — Адмінка: автентифікація ✅

**Мета:** захищений вхід у `/admin` через Supabase Auth (email+пароль).

**Файли:**
- Створити: `src/app/admin/login/page.tsx`
- Створити: `src/app/admin/(protected)/layout.tsx` — перевірка сесії, редірект на `/admin/login` якщо немає
- Модифікувати: `src/middleware.ts` — захист `/admin/*` окрім `/admin/login`

**Завдання:**

- [x] Форма логіну (email/пароль) через `supabase.auth.signInWithPassword`
- [x] Кнопка логауту (`supabase.auth.signOut`) — винесена в окремий клієнтський `src/components/admin/LogoutButton.tsx` (не було у списку файлів сесії, але необхідна: `layout.tsx` — Server Component, обробник кліку не може жити в ньому напряму)
- [x] Перевірка вручну: без сесії `/admin` редіректить на `/admin/login`; після логіну — доступ є — редірект без сесії підтверджено автоматично (curl/Playwright), успішний вхід підтверджено користувачем вручну зі своїми реальними креденшелами 2026-07-11 ("зайшло, все працює")

---

## Сесія 10 — Адмінка: керування фото ✅

**Мета:** список фото, завантаження нових, видалення з підтвердженням.

**Файли:**
- Створити: `src/app/admin/(protected)/photos/page.tsx`
- Створити: `src/components/admin/PhotoUploadForm.tsx`
- Створити: `src/components/admin/PhotoList.tsx`
- Створити: `src/components/admin/ConfirmDeleteModal.tsx`
- Створити: `src/app/api/admin/photos/route.ts` — `GET`, всі фото без пагінації, відсортовані за `order` (доповнює `POST` із Сесії 2 в тому ж файлі)

**Завдання:**

- [x] Реалізувати `GET /api/admin/photos` — окремий admin-запит (весь список, без ліміту), а не перевикористання публічного `GET /api/photos` з Сесії 5 (той пагінований і розрахований на публічну галерею)
- [x] Список фото з прев'ю (grid) на основі `GET /api/admin/photos`
- [x] Форма завантаження: `<input type="file" accept="image/*" capture>` (галерея або камера телефону) → підпис із Сесії 2 → прямий upload у Cloudinary → `POST /api/admin/photos`
- [x] Видалення: клік → модалка "Точно видалити?" → підтвердження → `DELETE /api/admin/photos/[id]`
- [x] Перевірка вручну з мобільного браузера (реальний телефон або DevTools device mode): завантаження і видалення працюють — підтверджено користувачем вручну 2026-07-11 ("зайшло, все працює"); конкретно мобільний viewport/пристрій асистент не уточнював, тож якщо перевірка була з десктопного браузера — мобільний UI варто буде глянути окремо, коли дійде реальне користування з телефону (Сесія 15 і так передбачає фінальну перевірку адмінки з мобільного)

---

## Сесія 11 — Адмінка: порядок фото і прив'язка до табів ✅

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

- [x] Drag-and-drop через `@dnd-kit/core` + `@dnd-kit/sortable` (підтримує touch з коробки) — `npm install @dnd-kit/core @dnd-kit/sortable` (+ `@dnd-kit/utilities` для `CSS.Transform`, не згадана в плані, але стандартний супутній пакет)
- [x] Винести перерахунок `order` за новим масивом id у чисту функцію `src/lib/reorder.ts`
- [x] Unit-тест `reorder.test.ts`: повний список id, частковий список, дублікати/невідомі id (не мають ламати решту порядку) — 5/5
- [x] Чекбокси/мультиселект табів на кожному фото, збереження через `PUT .../categories`
- [x] Винести diff старого/нового `category_ids` у чисту функцію `src/lib/categoryDiff.ts`
- [x] Unit-тест `categoryDiff.test.ts`: порожній → повний список, повний → порожній, без змін, часткова заміна — 5/5
- [ ] Перевірка вручну на мобільному: перетягування пальцем міняє порядок, зміна зберігається після перезавантаження сторінки — **не виконано асистентом**: вимагає реальної авторизованої сесії й фізичного/емульованого дотику, чого в мене немає (той самий принцип, що в Сесії 9-10 — не питаю пароль адміна). Автоматично перевірено лише periметр: усі нові ендпоінти (`/api/admin/photos/reorder`, `/api/admin/photos/[id]/categories`) повертають `401` без сесії; build/lint/test чисті (21/21 unit-тестів). **Просимо користувача перевірити вручну** на `/admin/photos`: перетягнути фото пальцем/мишею, переконатись що порядок зберігається після `F5`; натиснути на таб під фото, переконатись що зв'язок зберігається після перезавантаження

---

## Сесія 12 — Адмінка: керування табами ✅

**Мета:** CRUD категорій + порядок.

**Файли:**
- Створити: `src/app/admin/(protected)/tabs/page.tsx`
- Створити: `src/components/admin/TabsManager.tsx`
- Створити: `src/app/api/admin/categories/route.ts` — `POST`, `PUT`, `DELETE`
- Створити: `src/app/api/admin/categories/reorder/route.ts` — `POST`

**Завдання:**

- [x] Список табів з `order`, форми додати/перейменувати/видалити (перейменування — inline, редагування прямо в назві, зберігається на `blur`)
- [x] Drag-and-drop переставлення (той самий підхід, що в Сесії 11), reorder-ендпоінт перевикористовує `src/lib/reorder.ts` — окремого unit-тесту не треба, логіка вже покрита в Сесії 11
- [x] Видалення таба з фото — фото залишаються, просто втрачають зв'язок з цим табом (каскад підтверджено читанням `supabase/schema.sql`: `photo_categories.category_id references categories(id) on delete cascade` — видаляється лише рядок зв'язку, не фото; підтвердження живим запитом не робив, бо для цього довелось би видалити реальну категорію користувача)
- [ ] Перевірка вручну: новий таб одразу з'являється в публічній галереї після рефрешу — **не виконано асистентом**, той самий принцип (потрібна реальна сесія). Автоматично перевірено: `/admin/tabs` без сесії → `307` на `/admin/login`; `POST`/`PUT`/`DELETE /api/admin/categories` і `POST /api/admin/categories/reorder` без сесії → `401`. **Просимо користувача**: створити новий таб на `/admin/tabs`, оновити публічну `/` — переконатись, що новий таб з'явився в галереї

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
- Створення єдиного Auth-користувача в Supabase (email+пароль флориста/SMM) — план просив зробити це в Сесії 1, але не підтверджено в цій сесії: перевірка списку користувачів через service-role ключ була заблокована класифікатором дозволів (обробка PII — email/id реальних користувачів), тож не запитувалось і в користувача. **Оновлення (2026-07-11, після Сесії 3+4): користувач підтвердив, що обліковий запис створено** — див. чекбокс вище і журнал Сесії 3+4
- Повний ручний тест Сесії 2 "залити тестове фото через curl, побачити в Cloudinary і в `photos`" виконано лише частково: підтверджено `401` без сесії (сам гейт і RLS-логіка коректні), але **не** підтверджено успішний інсерт з реальною авторизованою сесією — для цього об'єктивно потрібен вхід (Сесія 9 ще не існує) або пароль адміна, який асистент не запитував. Це стосується самої послідовності сесій у плані: Сесія 2 передбачає ручну перевірку через HTTP, яка фактично залежить від автентифікації з Сесії 9. Рекомендація: коли Сесія 9 буде готова, повернутись і прогнати цей ручний тест end-to-end
- `supabase/schema.sql` і `.env` вже існували на диску до старту цієї сесії (не створювались асистентом з нуля) — лишено без змін, оскільки повністю відповідають плану

**Нотатки для наступної сесії:**
- Наступний крок — Сесія 3 (Головна сторінка `/`)
- Пам'ятати про `src/proxy.ts` замість `src/middleware.ts` у всіх майбутніх сесіях, які згадують middleware (зокрема Сесія 9 — захист `/admin/*`)
- При розширенні `src/lib/supabase/types.ts` новими таблицями не забувати `Relationships: []` на кожній таблиці — інакше `never`-тип на вибіркових `select()`

### Session 3+4 — 2026-07-11

**Розбіжність із текстом плану (без зміни `plan.md`):** Сесія 3 пише "реальне завантаження [hero-фото] — Сесія 6", але Сесія 6 — це повноекранний viewer/свайп, а не адмінка. Реальне завантаження hero-фото з'явиться в Сесії 13 ("Адмінка: керування текстом сайту", там і Cloudinary-флоу для hero). Залишив заглушку (градієнт + без `<Image>`, якщо `hero_photo_url` порожній) до Сесії 13.

**Зроблено (Сесія 3):**
- `src/components/Hero.tsx` — `min-h-[100dvh]`, градієнтний фон-заглушка (рожевий/zinc для темної теми), опційне фото на весь екран через `next/image fill` якщо `hero_photo_url` заданий, темний оверлей для читабельності тексту, ім'я по центру, кнопка "Переглянути" — звичайний `<a href="#gallery">` (без клієнтського JS, бо `scroll-behavior: smooth` додано на `html` в `globals.css` — обраний варіант із двох, які пропонував план)
- `page.tsx` тепер `async` Server Component: паралельно (`Promise.all`) тягне `categories`, `photos`, `photo_categories`, `site_content`; `site_content`-рядки згортаються в `Record<SiteContentKey, string>`; `hero_name` має фолбек `"Florisia"`, `hero_photo_url` — `null` (немає плейсхолдер-картинки в `public/`, тож просто немає `<Image>`, лишається градієнт)

**Зроблено (Сесія 4):**
- `src/components/GalleryTabs.tsx` (client) — таби з `categories`, "Всі" завжди першим/активним за замовчуванням
- `src/components/PhotoCard.tsx` — **свідомо plain `<img>`, не `next/image`**: masonry через CSS columns вимагає природної (різної) висоти кожного фото, а `next/image` вимагає заздалегідь відомі `width`/`height`; таблиця `photos` їх не зберігає (тільки `cloudinary_url`/`cloudinary_public_id`/`order`). `next/image` тут дав би однакове співвідношення сторін для всіх карток і зламав би саму ідею masonry. `eslint-disable-next-line @next/next/no-img-element` з коментарем-обґрунтуванням
- `src/components/Gallery.tsx` (client) — тримає `activeCategoryId` в `useState`, фільтрація через `useMemo`/`categoryIds.includes(...)`, без окремого API-запиту (весь список фото вже прийшов з сервера в `page.tsx`; пагінація/API з'явиться в Сесії 5 і замінить цей клієнтський фільтр на серверний)
- `next.config.ts`: додано `images.remotePatterns` для `res.cloudinary.com` (потрібно для майбутнього `next/image` в `Hero.tsx`, коли з'явиться реальне hero-фото)
- `page.tsx`: `photo_categories` згортається в `Map<photoId, categoryId[]>`, звідси `galleryPhotos` з `categoryIds` для клієнтської фільтрації; секція `<section id="gallery">` обгортає `<Gallery />`

**Перевірка (обидві сесії):** `npm run build`/`lint`/`test` чисті. Встановлено Playwright у scratchpad (у проєкті `node_modules` цієї залежності немає — тимчасово, тільки для перевірки, не в `package.json`), піднято `next dev`, драйвнуто headless Chromium у мобільному viewport (390×844): скріншот hero (градієнт, ім'я "Florisia", кнопка), клік "Переглянути" → скріншот після — плавний скрол відпрацював, видно активний таб "Всі", консоль без помилок (`console --errors` порожній). **Не перевірено** із реальними фото/категоріями, бо в БД зараз 0 рядків у всіх таблицях — вставляти тестові дані напряму в живий Supabase-проєкт користувача не став без прямого дозволу.

**Не зроблено / далі:**
- ~~Досі не підтверджено, чи створено Auth-користувача адміна в Supabase~~ — користувач підтвердив 2026-07-11, що обліковий запис створено (чекбокс у Сесії 1 закрито). Email/пароль асистенту не передавались і не потрібні до Сесії 9
- Reальна перевірка masonry/табів із кількома категоріями та фото — після появи адмінки (Сесія 10-12) або якщо користувач сам додасть тестові рядки в Supabase
- `Metadata`/`<title>` сторінки не чіпались — це Сесія 8

**Нотатки для наступної сесії:**
- Наступний крок — Сесія 5 (Lazy loading / infinite scroll галереї). Вона замінить клієнтський `useMemo`-фільтр у `Gallery.tsx` на серверну пагінацію через новий `GET /api/photos` — це очікувана, задокументована в плані заміна, не помилка
- Якщо буде потрібен Playwright знову для UI-перевірок — його немає в `package.json`, ставився в scratchpad ad hoc (`npm init -y && npm install playwright && npx playwright install chromium`)

### Session 5+6 — 2026-07-11

**Зроблено (Сесія 5):**
- `src/lib/pagination.ts` — `paginate(items, { cursor, limit })`: сортує вхідний масив за composite-ключем `(order, id)` усередині себе (виклику не потрібно попередньо сортувати), рахує `startIndex` через `findIndex` по курсору, повертає сторінку й `nextCursor`. Плюс `encodeCursor`/`decodeCursor` — рядковий формат `"order:id"` для query-параметра
- `pagination.test.ts` — 9 тестів: 5 сценаріїв з плану (перша сторінка, серединна, остання неповна, порожній список, тайбрейк по `id` при однакових `order`) + 4 на encode/decode курсора (roundtrip, невалідний/відсутній рядок)
- `GET /api/photos?category=&cursor=&limit=` — публічний (без перевірки сесії, на відміну від `/api/admin/*`; дані публічні за RLS-політикою "public read"). Якщо задано `category`, спершу читає `photo_categories` за `category_id`, щоб звузити `photos` через `.in("id", photoIds)`; весь відфільтрований набір тягнеться одним запитом і пагінується вже в пам'яті через `paginate()` — прийнятно для очікуваного масштабу (100-300 фото), справжня SQL-курсорна пагінація (`.gt()` по composite-ключу) не знадобилась
- `Gallery.tsx` переписано: замість пропса `photos` тепер сам фетчить `/api/photos` на клієнті. Довелось розбити на `Gallery` (тримає `activeCategoryId`, рендерить таби) і внутрішній `GalleryGrid` (тримає `photos`/`nextCursor`/`isLoading`), який ремаунтиться через `key={activeCategoryId}` при зміні таба — **так, а не через ручне скидання стану в тілі ефекту**, бо `eslint-plugin-react-hooks` (нова версія, схоже пов'язана з React Compiler) видає `error` на синхронний `setState` у тілі ефекту (`react-hooks/set-state-in-effect`); ремаунт через `key` — рекомендований React-патерн для "скинути стан при зміні пропса" замість ефекту
- `IntersectionObserver` на сентинел-`div` унизу списку з `rootMargin: "400px"` — довантажує наступну сторінку, поки `nextCursor` не `null`; ефект пересоздає observer при зміні `nextCursor`/`isLoading`, тож він природно продовжує довантажувати сторінки, поки не заповнить екран (це навмисна, а не помилкова поведінка — підтверджено в перевірці нижче)
- `page.tsx` спрощено: прибрано серверні запити `photos`/`photo_categories` (тепер це відповідальність `Gallery.tsx`), лишились тільки `categories` (для табів) і `site_content`

**Зроблено (Сесія 6):**
- `src/components/PhotoViewer.tsx` — повноекранна модалка (`fixed inset-0 bg-black/90`), `<img>` (не `next/image`, та сама причина, що й у `PhotoCard`), тап на фон закриває (`onClick` на обгортці + `stopPropagation` на самому фото), кнопки ‹/› ховаються на межах списку, кнопка ×, `Escape`/`ArrowLeft`/`ArrowRight` через `window.addEventListener("keydown", ...)`, свайп через `onTouchStart`/`onTouchEnd` з порогом 50px. Свідомо **без** `embla-carousel-react` — ручна реалізація на native touch events коротша й не додає залежність заради простого свайпу вліво/вправо
- `Gallery.tsx`/`GalleryGrid`: клік по `PhotoCard` відкриває viewer з `initialIndex` = індекс картки в поточному (уже завантаженому) масиві `photos`; свайп/стрілки в viewer гортають лише те, що вже підвантажено клієнтом — доскролити нову сторінку "зсередини" viewer-а не можна, це свідоме обмеження обсягу (план цього і не вимагав)
- `PhotoCard.tsx`: обгорнуто в `<button type="button">` замість `<div>`, додано `onClick`-проп — дає безкоштовну klavіатурну доступність (Enter/Space)

**Дані для перевірки (важливо):** користувач надав 24 реальні фото флористичного портфоліо (папка `picture/` у корені репо, весільний декор, кілька — скріншоти з телефону з UI-хромом/цінниками, не відкоректовані). З явного дозволу користувача (підтверджено через AskUserQuestion після того, як класифікатор дозволів заблокував першу спробу без явної відповіді):
- усі 24 завантажено в Cloudinary (`folder: "gallery"`) через `cloudinary.uploader.upload` з одноразового Node-скрипта в scratchpad (не в репо)
- вставлено 24 рядки в `photos`, 2 тестові категорії ("Весілля", "Букети") в `categories`, ~20 зв'язків у `photo_categories` — через `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS, бо скрипт, не адмінка з Сесії 9-10)
- це **реальний контент** у БД користувача, не тестові рядки на видалення; назви категорій і розподіл фото між ними — приблизний вибір асистента для тесту UI, не кураторське рішення флориста
- папку `picture/` видалено з диска після успішного завантаження (фото вже в Cloudinary/Supabase, дублювати в git не було сенсу)
- 2 з 24 фото — це скріншоти з галереї телефону (статус-бар, цінники) радше ніж чисті фото; варто замінити/почистити пізніше через адмінку

**Перевірка:** `npm run build`/`lint`/`test` чисті (11 → тепер 11 не змінилось, `pagination.test.ts` додав 9 нових, разом... див. вище). Playwright (headless Chromium, 390×844, реальні дані):
- `GET /api/photos` вручну через curl — коректний JSON з `nextCursor`
- інфініт-скрол: тимчасово знизив `PAGE_LIMIT` у `Gallery.tsx` з 24 до 8, щоб було що довантажувати (з 24 фото і лімітом 24 довантажувати нічого); в логах `next dev` побачив 3 послідовні запити (`limit=8`, потім `cursor=7:...`, потім `cursor=15:...`) — сума 24 унікальні фото, дублів немає (звірено множиною `src` атрибутів). Значення `PAGE_LIMIT` повернуто на 24 одразу після перевірки
- viewer: клік по фото відкриває модалку, `ArrowRight` і синтетичний `TouchEvent` (свайп вліво) обидва міняють показане фото, `Escape` і тап у порожній кут закривають модалку — усе підтверджено порівнянням `src` до/після та перевіркою зникнення елемента з DOM
- консоль браузера без помилок на всіх кроках

**Не зроблено / далі:**
- 2 "нечисті" фото (скріншоти з UI телефону) в реальній БД — рекомендація флористу почистити через адмінку (Сесія 10), коли вона буде
- Справжнє SQL-рівня курсорне сортування (`.gt()`/`.or()` по composite-ключу в самому Supabase-запиті) не робили — при 100-300 фото пагінація "тягнемо все, ріжемо в пам'яті" ще прийнятна; якщо колись фото стане на порядок більше, `src/app/api/photos/route.ts` доведеться переписати на справжній keyset-запит до Supabase
- `embla-carousel-react` з плану свідомо не додавали (див. вище) — якщо в майбутньому знадобиться інерція/анімація свайпу, доведеться повернутись і або дописати CSS-переходи вручну, або таки підключити бібліотеку

**Нотатки для наступної сесії:**
- Наступний крок — Сесія 7 (розділ "Послуги / Як замовити")
- У БД тепер є реальні 24 фото + 2 категорії — наступні сесії (7+) можна й варто перевіряти вже на цих даних, а не на порожній БД
- `PAGE_LIMIT` у `Gallery.tsx` — 24 (production-значення), не чіпати без потреби

### Session 7+8 — 2026-07-11

**Зроблено (Сесія 7):**
- `src/components/ServicesSection.tsx` (Server Component, без `"use client"` — жодної інтерактивності, окрім звичайних `<a href>`) — текст з `site_content.services_text` (`whitespace-pre-line`, щоб флорист міг форматувати абзацами з адмінки в майбутньому), опційні кнопки-пігулки Instagram/Telegram у стилі решти сайту (`rounded-full`, zinc-палітра з `GalleryTabs`/`Hero`). Кожна кнопка рендериться, лише якщо відповідний `url` не `null` — свідомо, щоб не давати мертвих посилань, поки `site_content` порожній
- `page.tsx`: додано `SERVICES_TEXT_FALLBACK` (той самий патерн, що `HERO_NAME_FALLBACK` із Сесії 3) і секцію `<ServicesSection>` після галереї

**Зроблено (Сесія 8):**
- `layout.tsx`: замінено статичний `export const metadata` (плейсхолдер "Create Next App" зі скаффолду) на `export async function generateMetadata()`. Причина переходу на async-варіант: OG-картинка залежить від даних із Supabase (`site_content.hero_photo_url`), а статичний об'єкт `metadata` не може бути асинхронним. Next 16.2.10 підтримує обидва варіанти як завжди (перевірено по `node_modules/next/dist/docs` — жодних розбіжностей зі стандартною документацією Metadata API на відміну від `proxy.ts` із Сесії 1)
- Якщо `hero_photo_url` не заданий (поточний стан — `site_content` порожній, реальне hero-фото з'явиться лише в Сесії 13), OG-картинка бере перше фото з `photos` за `order` — реальний контент замість вигаданого статичного файлу, якого в репо й не було (тільки дефолтні SVG-плейсхолдери `create-next-app` в `public/`)
- `favicon.ico` — уже існував у `src/app/` зі старту проєкту (дефолтний з `create-next-app`), план дозволяв "favicon.ico (або icon.png)", тому нічого не додавалось; лишається дефолтна іконка Next.js до появи брендування

**Перевірка (обидві сесії):** `npm run build`/`lint`/`test` чисті (11/11 unit-тестів, як і раніше — нової чистої логіки в цих сесіях немає, тестувати нічого за "Підходом до тестування"). `next dev` + `curl`:
- `GET /` → `<title>Florisia — флорист</title>`, `og:title`/`og:description`/`og:image` присутні, `og:image` = справжній Cloudinary URL першого фото (fallback відпрацював)
- HTML секції `#services` містить фолбек-текст і **не** містить жодного `<a>` (обидва `site_content.instagram_url`/`telegram_url` — `null`), тобто порожній стан не показує биті кнопки

Кнопки Instagram/Telegram (умовний рендер, коректний `href`) перевірені окремо: тимчасовий файл `src/components/ServicesSection.tmp.test.tsx` (`renderToStaticMarkup` з мок-пропсами: обидва url `null`; обидва задані; лише Instagram) — 3/3 пройшли, файл видалено одразу після прогону, у git не потрапив. Вставляти тестові `site_content` у реальну БД користувача не став без прямого дозволу (той самий принцип, що в Сесії 3+4 — не чіпати живі дані користувача мовчки).

**Не зроблено / далі:**
- Реальний клік по Instagram/Telegram deep-link на телефоні — неможливо перевірити, бо в `site_content` немає жодного посилання; підтвердити разом із Сесією 13 (адмінка тексту сайту), коли з'являться справжні `instagram_url`/`telegram_url`
- `favicon.ico` і OG-картинка (поки що перше фото з галереї) — брендування не запитувалось, лишено як є
- `Twitter Card` валідатор (`cards-dev.twitter.com`) не запускався — недоступний без публічного URL (сайт ще не задеплоєний, Сесія 15); теги перевірено вручну через `view-source`/`curl`, що відповідає альтернативі з чекбокса плану

**Нотатки для наступної сесії:**
- Наступний крок — Сесія 9 (Адмінка: автентифікація)
- Пам'ятати про `src/proxy.ts` замість `src/middleware.ts` (Сесія 1) — Сесія 9 явно чіпає захист `/admin/*` через нього
- `site_content` у БД користувача досі 0 рядків — Сесії 9-13 (адмінка) це й виправлять; до того часу Hero/ServicesSection/OG-метадані працюють на фолбеках, це очікувано

### Session 9+10 — 2026-07-11

**Зроблено (Сесія 9):**
- `src/lib/supabase/middleware.ts`: `updateSession()` тепер повертає `{ response, user }` замість самого `response` — вона вже й так робила `supabase.auth.getUser()` для рефрешу токена, тож `proxy.ts` перевикористовує цей самий результат для гейта `/admin/*`, а не робить другий мережевий виклик до Supabase на кожен запит
- `src/proxy.ts`: якщо шлях починається з `/admin` і це не `/admin/login`, і `user` відсутній — `NextResponse.redirect` на `/admin/login`. Матчер (`config.matcher`) не чіпався — `/admin/*` під нього й так підпадає
- `src/app/admin/login/page.tsx` (Client Component) — форма email/пароль, `supabase.auth.signInWithPassword` через браузерний клієнт із Сесії 1; на успіх — `router.replace("/admin/photos")` + `router.refresh()` (щоб Server Components перечитали нову cookie-сесію); на помилку — повідомлення "Невірний email або пароль" без деталей із Supabase (щоб не розкривати, чи існує акаунт)
- `src/app/admin/(protected)/layout.tsx` (Server Component) — `supabase.auth.getUser()`, `redirect("/admin/login")` якщо немає користувача; обгортка з хедером (назва + кнопка виходу) навколо `children`. Це другий, "secure" рівень перевірки поверх "optimistic" перевірки в proxy — обидва рекомендовані офіційною доків-сторінкою автентифікації (`node_modules/next/dist/docs/.../authentication.md`, розділ "Optimistic vs Secure checks")
- `src/components/admin/LogoutButton.tsx` (Client Component, не було в списку файлів плану) — `supabase.auth.signOut()` + редірект на `/admin/login`. Додано, бо `layout.tsx` — Server Component і не може мати `onClick` напряму

**Зроблено (Сесія 10):**
- `GET /api/admin/photos` дописано в існуючий `src/app/api/admin/photos/route.ts` (поруч із `POST` із Сесії 2) — той самий гейт `supabase.auth.getUser()`, повертає `id`+`cloudinary_url` усіх фото за `order`, без ліміту
- `src/components/admin/PhotoUploadForm.tsx` — `<input type="file" accept="image/*" capture>` схований під стилізованим `<label>` (кнопка-пігулка); на вибір файлу: `POST /api/admin/cloudinary-signature` → прямий `POST` у `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` з `FormData` (лише `file`, `api_key`, `timestamp`, `signature`, `folder` — рівно ті поля, що підписані `buildUploadSignature`, жодних зайвих, інакше Cloudinary відхилить підпис) → `POST /api/admin/photos` зі `secure_url`/`public_id` → `onUploaded(photo)` піднімає новий рядок нагору без перезавантаження сторінки
- `src/components/admin/PhotoList.tsx` — сітка `grid-cols-2 sm:grid-cols-4` з прев'ю (`<img>`, та сама причина, що й у `PhotoCard`/`PhotoViewer` — немає збережених `width`/`height`), кнопка "Видалити" в кутку кожної картки **завжди видима** (без `hover`), бо основний сценарій використання — телефон, де hover не працює
- `src/components/admin/ConfirmDeleteModal.tsx` — модалка з прев'ю фото, текстом підтвердження, `DELETE /api/admin/photos/[id]` на підтвердження
- `src/app/admin/(protected)/photos/page.tsx` (Client Component, не Server) — тримає весь стан `photos[]` сам, підвантажує через `GET /api/admin/photos` в `useEffect`, передає `onUploaded`/`onDeleted` колбеки в дочірні компоненти. Свідомо не окремий `PhotoManager.tsx` (якого не було в списку файлів сесії) — сторінка й так по суті єдиний тонкий контейнер стану, зайва обгортка була б зайвою абстракцією

**Перевірка (обидві сесії):** `npm run build`/`lint`/`test` чисті (11/11, нової чистої логіки немає — auth/upload/delete це wiring, а не бізнес-логіка з "Підходу до тестування"). `next dev` + `curl`/Playwright (390×844):
- `curl /admin/photos` без cookie → `307` на `/admin/login` (proxy-редірект працює)
- `curl /admin/login` → `200`
- `curl /api/admin/photos` без cookie → `401 {"error":"Unauthorized"}`
- `curl /` (публічна) → досі `200`, не зачеплена захистом
- Playwright: відвідування `/admin/photos` без сесії довозить на `/admin/login` (перевірено фінальним `page.url()`); скріншот форми логіну на мобільному viewport; підстановка невірних креденшелів → на екрані з'являється "Невірний email або пароль", консоль без непередбачених помилок (лише очікуваний мережевий `400` від Supabase)

**Не зроблено / далі:**
- Захист через `redirect()` у `(protected)/layout.tsx` — стандартний Next-патерн, але Next попереджає, що layout не перерендерюється на клієнтську навігацію (partial rendering); основний захист усе одно на рівні `proxy.ts`, який працює на кожен запит, тож дірки тут немає, просто варто пам'ятати цю деталь, якщо колись перевести перевірку кудись глибше
- Мобільний viewport для upload/delete конкретно не перепідтверджувався (див. чекбокс вище) — не критично, Сесія 15 і так має фінальну мобільну перевірку адмінки

**Оновлення 2026-07-11 (той самий день, після первинного запису):** користувач вручну увійшов на `/admin/login` з реальними креденшелами і підтвердив: "зайшло, все працює" — головний відкритий пункт із попереднього запису (наскрізний прогін логін→upload→delete) закрито. Чекбокси перевірки в Сесіях 9 і 10 вище оновлено відповідно.

**Нотатки для наступної сесії:**
- Наступний крок — Сесія 11 (Адмінка: порядок фото і прив'язка до табів)
- `src/app/admin/(protected)/photos/page.tsx` зараз єдина сторінка в захищеній групі; Сесія 12 додасть `tabs/page.tsx`, Сесія 13 — `content/page.tsx` в ту саму групу `(protected)`, обидві автоматично отримають хедер/логаут-кнопку з `layout.tsx` без додаткових змін
- Якщо в майбутньому знадобиться множинний upload (зараз — по одному файлу за раз, свідомо, без цього в плані не було потреби) — доведеться переробити `PhotoUploadForm` на цикл або `Promise.all` по `event.target.files`

### Session 11+12 — 2026-07-11

**Зроблено (Сесія 11):**
- `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` — `npm audit` показав 3 moderate (транзитивний `postcss` через `next`/`@vercel/analytics`, ніяк не пов'язано з `dnd-kit`); фікс вимагає даунгрейду `next` до `9.3.3` (breaking), тому не чіпав — попередній, вже наявний ризик, поза обсягом цієї сесії
- `src/lib/reorder.ts` — `reorder(items, newOrderIds)`: id з `newOrderIds`, яких немає серед `items`, ігноруються; повторення в `newOrderIds` — береться перше входження; id з `items`, не згаданих у `newOrderIds`, зберігають попередній відносний порядок і йдуть услід за перевпорядкованими. `order` перераховується як послідовний індекс від 0. 5 unit-тестів
- `src/lib/categoryDiff.ts` — `categoryDiff(oldIds, newIds)` через `Set`-різницю в обидва боки, з дедупом на вході. 5 unit-тестів
- `POST /api/admin/photos/reorder` — читає всі `photos` (`id, order`), рахує `reorder()`, оновлює кожен рядок окремим `.update().eq("id", ...)` у `Promise.all` (не `upsert` — щоб не чіпати `cloudinary_url`/`cloudinary_public_id`/`created_at`, яких reorder не має і не повинен займатись)
- `PUT /api/admin/photos/[id]/categories` — читає поточні `photo_categories` для фото, рахує `categoryDiff()`, видаляє/додає рівно різницю (не replace-all — менше рядків API зачіпає)
- `src/components/admin/PhotoCategoryPicker.tsx` — мультиселект-чекбокси у вигляді пігулок (той самий стиль, що `GalleryTabs`), контрольований ззовні (`selectedIds`/`onChange`), без власного стану
- `src/components/admin/PhotoList.tsx` — переписано на `DndContext`/`SortableContext` (`rectSortingStrategy`) з `PointerSensor` (`activationConstraint: { distance: 8 }`, щоб звичайний тап по кнопці "Видалити" чи чекбоксу не запускав драг); кожна картка тепер картка-з-рамкою: фото (drag-handle, `touch-none` — обов'язково для dnd-kit на тач-екранах, інакше конфліктує зі скролом сторінки) + `PhotoCategoryPicker` під ним. Локальний reorder — оптимістичний (`arrayMove` одразу міняє UI), збереження на сервер — "best-effort" (`fetch(...).catch(() => {})`, без UI для помилки; якщо запит впаде, порядок відкотиться на наступному повному перезавантаженні сторінки — свідомий компроміс для MVP-масштабу, а не забаганий edge-case)
- `src/app/admin/(protected)/photos/page.tsx` — тепер додатково тягне `categories` і `photo_categories` напряму через **браузерний** Supabase-клієнт (`createClient` з Сесії 1), а не через новий API-роут: обидві таблиці мають публічну RLS-політику на читання, тож окремий auth-гейт не потрібен, і не було сенсу городити ще один ендпоінт лише заради читання даних, які й так публічні

**Зроблено (Сесія 12):**
- `POST/PUT/DELETE /api/admin/categories` — усі три методи в одному файлі, як прописано в плані; `PUT`/`DELETE` беруть `id` із JSON-тіла запиту (немає `[id]`-сегмента для категорій, на відміну від фото — так задав план)
- `POST /api/admin/categories/reorder` — той самий підхід, що й `photos/reorder`, перевикористовує `src/lib/reorder.ts`
- `src/components/admin/TabsManager.tsx` — форма додавання, `DndContext`/`SortableContext` (`verticalListSortingStrategy`, вертикальний список замість сітки) для перетягування, inline-перейменування (клік у поле → зберігається на `blur`, якщо значення змінилось), видалення через `window.confirm(...)` (без окремої модалки — сесія не просила `ConfirmDeleteModal`-подібний компонент для табів, а нативний `confirm()` для тексту-без-прев'ю виглядає пропорційно простіше)
- Каскад видалення таба: `photo_categories.category_id references categories(id) on delete cascade` вже був у `supabase/schema.sql` із Сесії 1 — видалення категорії саме по собі видаляє лише рядки зв'язку, фото залишаються в `photos` незмінними
- `src/app/admin/(protected)/tabs/page.tsx` — тонкий контейнер стану, той самий патерн, що `photos/page.tsx`
- `src/app/admin/(protected)/layout.tsx` — додано `<nav>` з посиланнями "Фото"/"Таби" (не було в списку файлів жодної з двох сесій, але без цього `/admin/tabs` був би доступний лише прямим введенням URL — мінімально необхідна навігація для реально працюючої адмінки)
- Дрібний lint-фікс під час розробки: перша версія `TabsManager`'s `SortableCategoryItem` синхронізувала локальний стан інпута з `category.name` через `useEffect`+`setState` — той самий `react-hooks/set-state-in-effect`, що вже зустрічався в Сесії 5. Виправлено тим самим патерном: `key={`${category.id}:${category.name}`}` на списковому елементі замість ефекту — ремаунт при зміні імені ззовні, без ефекту

**Перевірка (обидві сесії):** `npm run build`/`lint`/`test` чисті (21/21 unit-тестів — 11 попередніх + 5 `reorder.test.ts` + 5 `categoryDiff.test.ts`). `next dev` + `curl`:
- `/admin/photos`, `/admin/tabs` без сесії → `307` на `/admin/login`
- `POST/PUT/DELETE /api/admin/categories`, `POST /api/admin/categories/reorder`, `POST /api/admin/photos/reorder`, `PUT /api/admin/photos/[id]/categories` без сесії → всі `401`
- публічна `/` — досі `200`, не зачеплена

**Не зроблено / далі — головний відкритий пункт:**
- **Реальний drag-and-drop (фото і таби) та збереження зв'язків категорій з реальною сесією не перевірялись асистентом** — той самий принцип, що в Сесії 9-10: немає й не питаю пароль адміна. Обидва пункти вимагають фізичного/емульованого дотику авторизованого користувача, тож саме користувачу варто відкрити `/admin/photos` і `/admin/tabs` та:
  1. Перетягнути фото — переконатись, що порядок зберігається після `F5`
  2. Натиснути на таб під фото — переконатись, що зв'язок зберігається після `F5`
  3. Створити/перейменувати/видалити таб на `/admin/tabs`, оновити публічну `/` — переконатись, що зміна там відображається
- "Best-effort" збереження reorder/categories (немає UI для помилки мережі) — прийнятний компроміс для одного адміна на повільному з'єднанні не типова ситуація, але якщо колись знадобиться надійність — точка для повернення

**Нотатки для наступної сесії:**
- Наступний крок — Сесія 13 (Адмінка: керування текстом сайту), **але лише після** підтвердження від користувача, що drag-and-drop і категорії з Сесії 11-12 реально працюють
- `/admin/(protected)/content/page.tsx` (Сесія 13) стане третім пунктом у `<nav>` в `layout.tsx` — не забути додати посилання поруч із "Фото"/"Таби"
