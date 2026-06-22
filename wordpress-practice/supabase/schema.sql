-- ============================================================
--  Gearheads Automotive — database schema
--  Run this in the Supabase SQL Editor (one time).
-- ============================================================

-- ---------- Tables ----------

create table if not exists authors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  bio        text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text unique not null,
  excerpt     text,
  body        text,
  cover_url   text,
  -- placeholder gradient used until a real cover image is uploaded
  gradient    text,
  read_time   text,
  category_id uuid references categories(id) on delete set null,
  author_id   uuid references authors(id) on delete set null,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  event_date text not null,          -- display string for now, e.g. "Sat, Jul 11"
  location   text,
  blurb      text,
  body       text,
  published  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------
-- Public visitors may READ published content and ADD a subscription.
-- Only authenticated users (your future admin) may write posts/events.

alter table posts       enable row level security;
alter table events      enable row level security;
alter table categories  enable row level security;
alter table authors     enable row level security;
alter table subscribers enable row level security;

-- Public read access
create policy "public read published posts"
  on posts for select using (published = true);

create policy "public read published events"
  on events for select using (published = true);

create policy "public read categories"
  on categories for select using (true);

create policy "public read authors"
  on authors for select using (true);

-- Anyone may subscribe (insert only); nobody can read the list publicly
create policy "anyone can subscribe"
  on subscribers for insert with check (true);

-- Admin (any logged-in user) can do everything
create policy "authenticated manage posts"
  on posts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated manage events"
  on events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated manage categories"
  on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated manage authors"
  on authors for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated read subscribers"
  on subscribers for select using (auth.role() = 'authenticated');

-- ---------- Seed data (the mockup content) ----------

insert into authors (name) values
  ('Sam Okoye'), ('Lena Marsh'), ('Dev Patel'),
  ('Marco Ruiz'), ('Aisha Bello')
on conflict do nothing;

insert into categories (name, slug) values
  ('Reviews', 'reviews'),
  ('Classics', 'classics'),
  ('Motorsport', 'motorsport'),
  ('Restorations', 'restorations'),
  ('Road Trips', 'road-trips'),
  ('Tech', 'tech'),
  ('Guides', 'guides')
on conflict (slug) do nothing;

insert into posts (title, slug, excerpt, gradient, read_time, category_id, author_id)
values
  ('Driving the future: a week with the all-electric Aurora GT',
   'aurora-gt-week',
   'We spent seven days living with the most talked-about EV of the year — the highs, the range anxiety, and whether it lives up to the hype.',
   'linear-gradient(135deg, #0f172a, #2563eb)', '8 min read',
   (select id from categories where slug = 'reviews'),
   (select id from authors where name = 'Sam Okoye')),

  ('The forgotten 90s coupes that deserve a comeback',
   'forgotten-90s-coupes',
   'Six affordable classics that are quietly climbing in value.',
   'linear-gradient(135deg, #7c2d12, #f59e0b)', '6 min read',
   (select id from categories where slug = 'classics'),
   (select id from authors where name = 'Lena Marsh')),

  ('Inside the pits: how F1 teams nail a 2-second stop',
   'f1-two-second-stop',
   'A breakdown of the choreography behind the fastest stops in racing.',
   'linear-gradient(135deg, #7f1d1d, #ef4444)', '5 min read',
   (select id from categories where slug = 'motorsport'),
   (select id from authors where name = 'Dev Patel')),

  ('Barn find: rescuing a 1968 fastback from 40 years of dust',
   'barn-find-1968-fastback',
   'Part one of our full restoration diary, sparks and all.',
   'linear-gradient(135deg, #064e3b, #34d399)', '10 min read',
   (select id from categories where slug = 'restorations'),
   (select id from authors where name = 'Marco Ruiz')),

  ('The ultimate coastal road trip, mapped mile by mile',
   'coastal-road-trip',
   'Where to stop, what to drive, and the corners worth the detour.',
   'linear-gradient(135deg, #155e75, #22d3ee)', '7 min read',
   (select id from categories where slug = 'road-trips'),
   (select id from authors where name = 'Aisha Bello')),

  ('Solid-state batteries: hype, hope and the real timeline',
   'solid-state-batteries',
   'What the next leap in EV tech actually means for drivers.',
   'linear-gradient(135deg, #4c1d95, #a78bfa)', '9 min read',
   (select id from categories where slug = 'tech'),
   (select id from authors where name = 'Sam Okoye'))
on conflict (slug) do nothing;

insert into events (name, event_date, location, blurb) values
  ('Cars & Coffee — Summer Meet', 'Sat, Jul 11', 'Riverside Car Park',
   'Coffee, classics and modern metal. All makes welcome.'),
  ('Track Day: Beginners Welcome', 'Sun, Jul 19', 'Highveld Circuit',
   'Instructor-led sessions for first-timers and veterans alike.'),
  ('Classic Car Concours', 'Sat, Aug 1', 'City Botanical Gardens',
   'A showcase of lovingly restored vehicles from every era.')
on conflict do nothing;
