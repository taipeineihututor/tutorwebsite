-- Emails a school when the admin approves or rejects it (already applied to the live project).
-- Deploy the edge function supabase/functions/notify-school first (secret RESEND_API_KEY, verify_jwt on).
alter table public.schools add column if not exists decision_notified_status text;

-- Schools decided before this feature existed should not be emailed retroactively:
--   update public.schools set decision_notified_status = status where status in ('approved','rejected');

create or replace function public.reset_decision_notice()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'pending' then new.decision_notified_status := null; end if;
  return new;
end $$;

create or replace trigger zz_reset_decision_notice before update on public.schools
  for each row execute function public.reset_decision_notice();

create or replace function public.notify_school_of_decision()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.status in ('approved','rejected') and new.status is distinct from old.status then
    begin
      perform net.http_post(
        url     := 'YOUR_PROJECT_URL/functions/v1/notify-school',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR_ANON_KEY'),
        body    := jsonb_build_object('table', 'schools')
      );
    exception when others then
      null; -- never block the admin's decision because an email could not be sent
    end;
  end if;
  return new;
end $$;

revoke execute on function public.notify_school_of_decision() from public, anon, authenticated;

create or replace trigger notify_school_on_decision after update of status on public.schools
  for each row execute function public.notify_school_of_decision();
