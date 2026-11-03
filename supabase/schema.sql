-- TeachFormosa: database schema
-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- It is safe to read top to bottom; comments explain each part.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admins: any Supabase Auth user whose id is listed here can approve posts.
-- (See SETUP.md for the one-line insert that makes you an admin.)
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.admins enable row level security;
drop policy if exists "admins can see their own row" on public.admins;
create policy "admins can see their own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Teachers (applicant profiles)
-- ---------------------------------------------------------------------------
create table if not exists public.teachers (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  status           text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),

  -- PRIVATE (only admins can read these)
  full_name        text not null check (char_length(full_name) between 2 and 100),
  email            text not null check (char_length(email) between 5 and 200),
  phone            text check (char_length(phone) <= 60),

  -- Shown publicly once approved
  nationality      text not null check (char_length(nationality) <= 80),
  native_english   text check (native_english in ('yes', 'no')),
  education        text check (char_length(education) <= 80),
  certificates     text[] not null default '{}',
  experience       text check (char_length(experience) <= 20),
  subjects         text[] not null default '{}',
  bio              text check (char_length(bio) <= 1200),
  photo_url        text check (char_length(photo_url) <= 500),
  cities           text[] not null default '{}',
  in_taiwan        boolean not null,
  visa_status      text check (char_length(visa_status) <= 40),
  stay_until       date,
  arrival_date     date,
  needs_arc        text check (needs_arc in ('yes', 'no', 'unsure')),
  job_types        text[] not null default '{}',
  available_from   date,
  availability     jsonb not null default '{}'::jsonb,

  consent          boolean not null check (consent = true)
);

alter table public.teachers enable row level security;

-- Anyone may submit a profile, but only as "pending".
drop policy if exists "anyone can submit a teacher profile" on public.teachers;
create policy "anyone can submit a teacher profile" on public.teachers
  for insert to anon, authenticated
  with check (status = 'pending' and consent = true);

-- Admins can do everything.
drop policy if exists "admins manage teachers" on public.teachers;
create policy "admins manage teachers" on public.teachers
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Public display name: "Jane Smith" -> "Jane S."
create or replace function public.display_name(full text)
returns text
language sql
immutable
as $$
  select case
    when array_length(regexp_split_to_array(trim(full), '\s+'), 1) > 1 then
      (regexp_split_to_array(trim(full), '\s+'))[1] || ' ' ||
      upper(left((regexp_split_to_array(trim(full), '\s+'))[array_length(regexp_split_to_array(trim(full), '\s+'), 1)], 1)) || '.'
    else trim(full)
  end;
$$;

-- What the public website can see: approved profiles only, and NEVER the
-- full name, email or phone. (Views run with the owner's rights, so the
-- anonymous visitor can read this view even though they cannot read the table.)
create or replace view public.public_teachers as
  select
    id, created_at,
    public.display_name(full_name) as display_name,
    nationality, native_english, education, certificates, experience, subjects,
    bio, photo_url, cities, in_taiwan, visa_status, stay_until, arrival_date,
    needs_arc, job_types, available_from, availability
  from public.teachers
  where status = 'approved';

grant select on public.public_teachers to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Jobs (school recruiting ads)
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),

  school_name   text not null check (char_length(school_name) between 2 and 150),
  school_type   text check (char_length(school_type) <= 80),
  contact_name  text not null check (char_length(contact_name) <= 100),
  contact_email text not null check (char_length(contact_email) between 5 and 200),
  apply_link    text check (char_length(apply_link) <= 300),

  title         text not null check (char_length(title) between 3 and 150),
  city          text not null check (char_length(city) <= 80),
  district      text check (char_length(district) <= 80),
  job_type      text not null check (job_type in ('Full-Time', 'Part-Time', 'Full or Part-Time')),
  salary        text check (char_length(salary) <= 120),
  arc_offered   text not null check (arc_offered in ('yes', 'no')),
  start_date    date,
  schedule      text check (char_length(schedule) <= 300),
  description   text not null check (char_length(description) <= 4000),
  requirements  text check (char_length(requirements) <= 3000),

  consent       boolean not null check (consent = true)
);

alter table public.jobs enable row level security;

drop policy if exists "anyone can submit a job" on public.jobs;
create policy "anyone can submit a job" on public.jobs
  for insert to anon, authenticated
  with check (status = 'pending' and consent = true);

drop policy if exists "public can read approved jobs" on public.jobs;
create policy "public can read approved jobs" on public.jobs
  for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "admins manage jobs" on public.jobs;
create policy "admins manage jobs" on public.jobs
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Inquiries: a school asks to be introduced to a teacher. Only admins read them,
-- so teacher contact details are never exposed.
-- ---------------------------------------------------------------------------
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  teacher_id  uuid not null references public.teachers (id) on delete cascade,
  from_name   text not null check (char_length(from_name) between 2 and 100),
  school      text not null check (char_length(school) between 2 and 150),
  from_email  text not null check (char_length(from_email) between 5 and 200),
  message     text not null check (char_length(message) between 5 and 2000)
);

alter table public.inquiries enable row level security;

drop policy if exists "anyone can send an inquiry" on public.inquiries;
create policy "anyone can send an inquiry" on public.inquiries
  for insert to anon, authenticated
  with check (true);

drop policy if exists "admins manage inquiries" on public.inquiries;
create policy "admins manage inquiries" on public.inquiries
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Photo storage. Photos are resized in the browser before upload. File names
-- are random, and the bucket cannot be listed, so photos of people who are not
-- yet approved cannot be browsed.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone can upload a photo" on storage.objects;
create policy "anyone can upload a photo" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'photos');

drop policy if exists "admins manage photos" on storage.objects;
create policy "admins manage photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'photos' and public.is_admin())
  with check (bucket_id = 'photos' and public.is_admin());
