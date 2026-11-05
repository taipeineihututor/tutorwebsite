-- Daily inactivity reminder (already applied on the live project).
-- Teachers with a login who have not been active for 25 days get one email; at 30 days the
-- public_teachers view stops showing them until they sign in again.
-- Requires: extensions pg_cron + pg_net, edge function `remind-inactive`, secret RESEND_API_KEY
-- (and MAIL_FROM once a domain is verified in Resend, otherwise emails reach only the Resend owner).
-- Replace <PROJECT_REF> and <ANON_KEY> with your project's values.
select cron.schedule(
  'remind-inactive-teachers',
  '0 1 * * *',  -- 01:00 UTC = 09:00 Taipei
  $$ select net.http_post(
       url := 'https://<PROJECT_REF>.supabase.co/functions/v1/remind-inactive',
       headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <ANON_KEY>'),
       body := '{}'::jsonb) $$
);
