-- ============================================================
--  Sponsors / weekly flyers — run once in the Supabase SQL Editor.
-- ============================================================

create table if not exists sponsors (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  flyer_url     text not null,        -- Cloudinary image URL
  link_url      text,                 -- where the flyer links to (optional)
  active        boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

alter table sponsors enable row level security;

-- Public can read only active flyers
create policy "public read active sponsors" on sponsors
  for select using (active = true);

-- Only the admin can manage them
create policy "admin manage sponsors" on sponsors
  for all
  using      ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com');
