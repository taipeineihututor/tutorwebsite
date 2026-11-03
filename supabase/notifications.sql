-- Email alerts: tell the admin whenever a new teacher profile or job post arrives.
-- Run AFTER schema.sql and AFTER deploying the notify-admin edge function.
--
-- Replace the two placeholders below before running:
--   YOUR_PROJECT_URL  e.g. https://abcdxyz.supabase.co   (Project Settings -> API)
--   YOUR_ANON_KEY     the public "anon" key               (Project Settings -> API)
-- (The live project already has this applied.)

-- "notified_at" marks rows the admin has already been emailed about.
alter table public.teachers add column if not exists notified_at timestamptz;
alter table public.jobs     add column if not exists notified_at timestamptz;

-- Do not announce rows that already existed before alerts were switched on.
update public.teachers set notified_at = now() where notified_at is null;
update public.jobs     set notified_at = now() where notified_at is null;

-- Visitors must not be able to pre-set notified_at (that would silence the alert).
drop policy if exists "anyone can submit a teacher profile" on public.teachers;
create policy "anyone can submit a teacher profile" on public.teachers
  for insert to anon, authenticated
  with check (status = 'pending' and consent = true and notified_at is null);

drop policy if exists "anyone can submit a job" on public.jobs;
create policy "anyone can submit a job" on public.jobs
  for insert to anon, authenticated
  with check (status = 'pending' and consent = true and notified_at is null);

-- pg_net lets the database make a web request.
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_admin_of_submission()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  begin
    perform net.http_post(
      url     := 'YOUR_PROJECT_URL/functions/v1/notify-admin',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body    := jsonb_build_object('table', tg_table_name)
    );
  exception when others then
    null; -- never block a submission just because the alert could not be sent
  end;
  return new;
end;
$$;

revoke execute on function public.notify_admin_of_submission() from public, anon, authenticated;

drop trigger if exists notify_admin_on_teacher on public.teachers;
create trigger notify_admin_on_teacher
  after insert on public.teachers
  for each row execute function public.notify_admin_of_submission();

drop trigger if exists notify_admin_on_job on public.jobs;
create trigger notify_admin_on_job
  after insert on public.jobs
  for each row execute function public.notify_admin_of_submission();
