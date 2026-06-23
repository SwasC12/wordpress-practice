-- ============================================================
--  Lock admin writes to a single admin email: swasteerc@gmail.com
--  Run this once in the Supabase SQL Editor.
-- ============================================================

-- Drop the old "any authenticated user can write" policies
drop policy if exists "authenticated manage posts"       on posts;
drop policy if exists "authenticated manage events"      on events;
drop policy if exists "authenticated manage categories"  on categories;
drop policy if exists "authenticated manage authors"     on authors;
drop policy if exists "authenticated read subscribers"   on subscribers;

-- Recreate them restricted to your admin email only.
-- (auth.jwt() ->> 'email' is the logged-in user's email from their token.)

create policy "admin manage posts" on posts
  for all
  using      ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com');

create policy "admin manage events" on events
  for all
  using      ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com');

create policy "admin manage categories" on categories
  for all
  using      ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com');

create policy "admin manage authors" on authors
  for all
  using      ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com');

create policy "admin read subscribers" on subscribers
  for select
  using ((auth.jwt() ->> 'email') = 'swasteerc@gmail.com');

-- Public read + public subscribe policies are unchanged and still apply.
