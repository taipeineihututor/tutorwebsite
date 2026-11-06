-- Private "saved" lists (already applied on the live project).
-- Teachers save job posts; verified schools save teacher profiles. Each user can only ever see
-- their own rows, and nobody else (not even other logged-in users) can read them.
-- contacted_at / note let people keep track of who they have already contacted.
create table if not exists public.saved_items (
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind         text not null check (kind in ('job', 'teacher')),
  item_id      uuid not null,
  contacted_at timestamptz,
  note         text check (note is null or char_length(note) <= 500),
  created_at   timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

alter table public.saved_items enable row level security;

create policy saved_select on public.saved_items for select to authenticated
  using (user_id = auth.uid());

-- Anyone logged in can save jobs; only an approved (verified) institution can save teachers.
create policy saved_insert on public.saved_items for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      kind = 'job'
      or exists (select 1 from public.schools s where s.user_id = auth.uid() and s.status = 'approved')
    )
  );

create policy saved_update on public.saved_items for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy saved_delete on public.saved_items for delete to authenticated
  using (user_id = auth.uid());

-- Keep it small: at most 500 saved items per person.
create or replace function public.saved_items_cap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.saved_items where user_id = new.user_id) >= 500 then
    raise exception 'You can save up to 500 items.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger saved_items_cap_trg before insert on public.saved_items
  for each row execute function public.saved_items_cap();

revoke all on public.saved_items from anon;
