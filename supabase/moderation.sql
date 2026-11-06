-- Automatic moderation + visitor reports (already applied on the live project).
--
-- 1. Content filter: new/edited teacher profiles and new job posts are checked against
--    public.moderation_patterns. A hit puts the item on hold (status 'pending', so it is not public)
--    and emails the admin. Teachers are also checked for contact details (email, phone, link, chat IDs),
--    because those would bypass "contact details for verified schools only".
--    When the owner edits the text and it is clean again, the profile goes live again by itself.
-- 2. Reports: anyone can report a job or profile (rpc report_item). 2 different reporters put it on hold.
--    The admin page shows the reasons; approving it again clears the reports.
-- Edit the word list any time in the table moderation_patterns (kind 'block' or 'contact', POSIX regex, case-insensitive).

alter table public.teachers add column if not exists flag_reason text;
alter table public.jobs     add column if not exists flag_reason text;

create table if not exists public.moderation_patterns (
  id      bigint generated always as identity primary key,
  kind    text not null check (kind in ('block', 'contact')),
  pattern text not null
);
alter table public.moderation_patterns enable row level security;
create policy "admins manage patterns" on public.moderation_patterns for all using (public.is_admin()) with check (public.is_admin());
revoke all on public.moderation_patterns from anon;

insert into public.moderation_patterns (kind, pattern) values
  ('block', '\m(fuck(ing|er|ers|ed)?|motherfucker|shit(ty|head)?|bullshit|bitch(es)?|asshole|cunt|dickhead|bastard|whore|slut)\M'),
  ('block', '\m(nigger|niggers|nigga|faggot|fag|retard|retarded|chink|spic|kike)\M'),
  ('block', '\m(porn|porno|pornhub|nudes?|escorts?|hookups?|onlyfans|sexting|blowjob)\M'),
  ('block', '\m(casino|gambling|bitcoin|crypto(currency)?|forex|viagra|western union|wire transfer|get rich|send me money|payday loan)\M'),
  ('block', '\m(kill yourself|kys)\M'),
  ('block', '(幹你|幹妳|操你|操妳|他媽的|他妈的|傻逼|傻屄|婊子|約炮|约炮|援交|色情|賭博|赌博|博彩|百家樂|百家乐|去死|肏)'),
  ('contact', '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}'),
  ('contact', '(https?://|www\.)'),
  ('contact', '\m[[:alnum:]-]+\.(com|net|org|tw|io|co|info)\M'),
  ('contact', '([+]?[0-9][ .()-]?){9,}'),
  ('contact', '\m(whatsapp|wechat|telegram|messenger|skype|line ?id)\M');

-- Returns 'blocked', 'contact' or null.
create or replace function public.moderation_check(p_text text, p_contact boolean)
returns text language plpgsql stable security definer set search_path = public as $$
begin
  if p_text is null or btrim(p_text) = '' then return null; end if;
  if exists (select 1 from public.moderation_patterns where kind = 'block' and p_text ~* pattern) then return 'blocked'; end if;
  if p_contact and exists (select 1 from public.moderation_patterns where kind = 'contact' and p_text ~* pattern) then return 'contact'; end if;
  return null;
exception when others then
  return null;  -- never block anyone because of a bad pattern
end $$;

create or replace function public.moderation_note(p_reason text) returns text language sql immutable as $$
  select case p_reason
    when 'contact' then 'Automatic check: your text seems to contain an email address, phone number, chat ID or web link. Verified schools already see your contact details, so please remove it from your text and save again. We will also look at it shortly.'
    else 'Automatic check: your text contains wording that is not allowed on TeachFormosa. Please edit it and save again. We will also look at it shortly.'
  end $$;

-- Let the moderation code change the status of a row without protect_teacher_fields undoing it.
create or replace function public.protect_teacher_fields() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if public.is_admin() or coalesce(auth.role(), '') not in ('anon', 'authenticated')
     or coalesce(current_setting('app.moderation', true), '') = 'on' then return new; end if;
  new.user_id := old.user_id;
  new.admin_note := old.admin_note;
  new.notified_at := old.notified_at;
  new.created_at := old.created_at;
  new.last_active_at := old.last_active_at;
  new.reminded_at := old.reminded_at;
  new.flag_reason := old.flag_reason;
  new.consent := true;
  new.status := old.status;
  new.updated_at := now();
  return new;
end $$;

-- Teachers: edits (BEFORE UPDATE) ...
create or replace function public.teachers_moderate_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_new text; v_old text; r text;
begin
  if public.is_admin() or coalesce(auth.role(), '') not in ('anon', 'authenticated')
     or coalesce(current_setting('app.moderation', true), '') = 'on' then return new; end if;
  v_new := coalesce(new.full_name,'') || ' ' || coalesce(new.bio,'') || ' ' || coalesce(new.nationality,'') || ' ' || coalesce(new.availability_notes::text,'');
  v_old := coalesce(old.full_name,'') || ' ' || coalesce(old.bio,'') || ' ' || coalesce(old.nationality,'') || ' ' || coalesce(old.availability_notes::text,'');
  if v_new is distinct from v_old then
    r := public.moderation_check(v_new, true);
    if r is not null then
      new.status := 'pending';
      new.flag_reason := 'Automatic check: ' || r;
      new.admin_note := public.moderation_note(r);
      new.notified_at := null;
    elsif old.status = 'pending' and old.flag_reason like 'Automatic check:%' then
      new.status := 'approved'; new.flag_reason := null; new.admin_note := null;
    end if;
  end if;
  return new;
end $$;
create trigger zz_moderate_update before update on public.teachers for each row execute function public.teachers_moderate_update();

-- ... and new profiles (AFTER INSERT, because the insert policy only accepts status 'approved').
create or replace function public.teachers_moderate_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  if public.is_admin() or coalesce(auth.role(), '') not in ('anon', 'authenticated') then return null; end if;
  r := public.moderation_check(coalesce(new.full_name,'') || ' ' || coalesce(new.bio,'') || ' ' || coalesce(new.nationality,'') || ' ' || coalesce(new.availability_notes::text,''), true);
  if r is not null then
    perform set_config('app.moderation', 'on', true);
    update public.teachers set status = 'pending', flag_reason = 'Automatic check: ' || r, admin_note = public.moderation_note(r), notified_at = null where id = new.id;
    perform set_config('app.moderation', '', true);
  end if;
  return null;
end $$;
create trigger zz_moderate_insert after insert on public.teachers for each row execute function public.teachers_moderate_insert();

-- Jobs: new posts (wording only; a job post is meant to contain contact details).
create or replace function public.jobs_moderate_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  if public.is_admin() or coalesce(auth.role(), '') not in ('anon', 'authenticated') then return null; end if;
  r := public.moderation_check(coalesce(new.title,'') || ' ' || coalesce(new.school_name,'') || ' ' || coalesce(new.description,'') || ' ' || coalesce(new.requirements,'') || ' ' || coalesce(new.schedule,'') || ' ' || coalesce(new.salary,'') || ' ' || coalesce(new.contact_name,''), false);
  if r is not null then
    perform set_config('app.moderation', 'on', true);
    update public.jobs set status = 'pending', flag_reason = 'Automatic check: ' || r, admin_note = public.moderation_note(r), notified_at = null where id = new.id;
    perform set_config('app.moderation', '', true);
  end if;
  return null;
end $$;
create trigger zz_moderate_insert after insert on public.jobs for each row execute function public.jobs_moderate_insert();

-- Email the admin when an edit puts a profile on hold.
create trigger notify_admin_on_teacher_hold after update on public.teachers
  for each row when (new.status = 'pending' and new.notified_at is null)
  execute function public.notify_admin_of_submission();

-- Visitor reports ------------------------------------------------------------
create table if not exists public.reports (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('job', 'teacher')),
  item_id    uuid not null,
  reason     text not null check (char_length(reason) <= 60),
  detail     text check (detail is null or char_length(detail) <= 300),
  reporter   text not null,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists reports_one_per_reporter on public.reports (kind, item_id, reporter) where not resolved;
alter table public.reports enable row level security;
create policy "admins manage reports" on public.reports for all using (public.is_admin()) with check (public.is_admin());
revoke all on public.reports from anon;

create or replace function public.report_item(p_kind text, p_item_id uuid, p_reason text, p_detail text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_rep text; v_status text; n int;
begin
  if p_kind not in ('job', 'teacher') or p_item_id is null or coalesce(btrim(p_reason), '') = '' then
    raise exception 'Invalid report.' using errcode = 'P0001';
  end if;
  v_rep := coalesce(auth.uid()::text, 'ip:' || md5(coalesce(public.client_ip(), 'unknown')));
  if (select count(*) from public.reports where reporter = v_rep and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Too many reports today. Please email teachformosa@gmail.com.' using errcode = 'P0001';
  end if;
  if p_kind = 'job' then select status into v_status from public.jobs where id = p_item_id;
  else select status into v_status from public.teachers where id = p_item_id; end if;
  if v_status is null then raise exception 'That item no longer exists.' using errcode = 'P0001'; end if;

  insert into public.reports (kind, item_id, reason, detail, reporter)
  values (p_kind, p_item_id, left(btrim(p_reason), 60), nullif(left(btrim(coalesce(p_detail, '')), 300), ''), v_rep)
  on conflict (kind, item_id, reporter) where not resolved do nothing;

  select count(distinct reporter) into n from public.reports where kind = p_kind and item_id = p_item_id and not resolved;
  if n >= 2 and v_status = 'approved' then
    perform set_config('app.moderation', 'on', true);
    if p_kind = 'job' then
      update public.jobs set status = 'pending', flag_reason = 'Reported by ' || n || ' visitors', notified_at = null where id = p_item_id;
    else
      update public.teachers set status = 'pending', flag_reason = 'Reported by ' || n || ' visitors', notified_at = null where id = p_item_id;
    end if;
    perform set_config('app.moderation', '', true);
  end if;
end $$;
revoke all on function public.report_item(text, uuid, text, text) from public;
grant execute on function public.report_item(text, uuid, text, text) to anon, authenticated;
