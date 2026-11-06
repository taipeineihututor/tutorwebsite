-- Pay is mandatory on every new job: an hourly range, a monthly range, or both.
-- (Already applied to the live project.) The readable text in jobs.salary is built by the website from these numbers.
alter table public.jobs
  add column if not exists pay_hourly_min  integer check (pay_hourly_min  between 1 and 100000),
  add column if not exists pay_hourly_max  integer check (pay_hourly_max  between 1 and 100000),
  add column if not exists pay_monthly_min integer check (pay_monthly_min between 1 and 1000000),
  add column if not exists pay_monthly_max integer check (pay_monthly_max between 1 and 1000000);

create or replace function public.require_job_pay()
returns trigger language plpgsql set search_path = public as $$
declare ok_h boolean; ok_m boolean; any_h boolean; any_m boolean;
begin
  any_h := new.pay_hourly_min is not null or new.pay_hourly_max is not null;
  any_m := new.pay_monthly_min is not null or new.pay_monthly_max is not null;
  ok_h := new.pay_hourly_min  is not null and new.pay_hourly_max  is not null and new.pay_hourly_max  >= new.pay_hourly_min;
  ok_m := new.pay_monthly_min is not null and new.pay_monthly_max is not null and new.pay_monthly_max >= new.pay_monthly_min;
  if (any_h and not ok_h) or (any_m and not ok_m) or not (ok_h or ok_m) then
    raise exception 'Please give the pay as a range (hourly, monthly, or both).' using errcode = 'P0001';
  end if;
  if new.job_type = 'Part-Time' and not ok_h then
    raise exception 'Part-time jobs need an hourly pay range.' using errcode = 'P0001';
  end if;
  if new.job_type = 'Full-Time' and not ok_m then
    raise exception 'Full-time jobs need a monthly pay range.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace trigger aa_require_job_pay before insert on public.jobs
  for each row execute function public.require_job_pay();
