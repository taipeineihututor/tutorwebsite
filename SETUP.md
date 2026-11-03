# Going live: connect the database (about 15 minutes)

The website works as soon as it is deployed, but until you do the steps below it runs in
**preview mode**: forms and the admin page work, but everything is stored only in the
visitor's own browser, so you would never see what teachers and schools submit.
A yellow banner at the top of the site tells you when it is in preview mode.

To save real submissions you need a free **Supabase** database (supabase.com). Nothing here
needs coding.

## 1. Create the database
1. Sign up at https://supabase.com and click **New project**. Pick any name and a region close
   to Taiwan (for example *Southeast Asia (Singapore)* or *Northeast Asia (Tokyo)*), and save the
   database password somewhere safe.
2. Wait about 2 minutes while it is created.

## 2. Create the tables
1. In Supabase, open **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this repository, copy **all** of it, paste it in, and press **Run**.
   You should see "Success". (Running it twice is harmless.)

## 3. Connect the website
1. In Supabase open **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
   (Never use the `service_role` key.)
2. In Vercel open your project → **Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon public key
3. In Vercel open **Deployments**, click the latest one, then **Redeploy**.

## 4. Make yourself the admin
1. In Supabase open **Authentication → Users → Add user → Create new user**. Enter your email and a
   strong password, and tick **Auto Confirm User**.
2. Open **SQL Editor → New query**, and run this (with your email):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'YOUR-EMAIL@example.com';
   ```
3. Go to `your-site.vercel.app/#/admin` and sign in. Only people in the `admins` table can approve
   anything, and this is enforced by the database itself, not just the web page.

## 5. Turn off public sign-ups (recommended)
In Supabase: **Authentication → Sign In / Providers → Email** and switch off **Allow new users to sign up**.
Teachers and schools never create accounts, so nobody else needs one.

## How it works day to day
- Teachers fill in **Create my profile**; schools fill in **Post a job**. Both land in **Pending**.
- Open `/#/admin`. Review each item (**Show all details** reveals the private email / phone), then
  **Approve** or **Reject**. Only approved items appear on the site. You can also **Take offline** later.
- When a school clicks **Contact this teacher**, the message appears under **Messages** in admin.
  You reply to the school and forward it to the teacher, so teacher contact details are never public.

## What is public and what is private
| | Public (after approval) | Private (admin only) |
|---|---|---|
| Teacher | first name + last initial, photo, nationality, education, experience, introduction, in Taiwan / visa type / stay-until, needs ARC sponsorship, cities, availability | full name, email, phone / LINE |
| Job | everything on the post, including the contact name and email | n/a |

Photos are resized in the browser before upload. The photo storage folder cannot be browsed, but
a photo's link works for anyone who has it, so an unapproved photo is not secret, just unlisted.

## Good to know
- Teachers cannot edit their profile after sending it (they have no accounts). To change or remove
  one, use admin (Delete), or ask the teacher to submit a new one.
- Basic spam protection is built in (hidden trap field, size limits). If spam becomes a problem,
  add a CAPTCHA such as Cloudflare Turnstile.
- Supabase's free plan pauses a project after a week with no activity. Visiting the site or the admin
  page occasionally keeps it awake, or upgrade the plan if the site becomes busy.

## Email alerts when someone posts (already set up on the live project)
A database trigger calls the `notify-admin` edge function (`supabase/functions/notify-admin`) after every new
teacher profile or job post. The function emails the admin through Resend.
- Needs one secret, `RESEND_API_KEY`: Supabase -> **Edge Functions -> Secrets** (a free Resend account is enough).
- Create the Resend account with the same email that should receive the alerts. Resend's free test sender
  (`onboarding@resend.dev`) can only deliver to the address the account was created with.
- `supabase/notifications.sql` contains the database part. It is already applied; it is kept here for reference
  and for rebuilding the project.
- Alerts never block a submission: if email fails, the visitor still succeeds, and the next submission retries.


## Schools & verification (added)

- Institutions sign up on `#/school` (Supabase Auth, email + password), register with their tax ID and a proof document (private bucket `school-docs`), and **you approve them in Admin → Schools**.
- Keep **Authentication → Sign In / Providers → "Allow new users to sign up" ON** (schools create their own logins) and turn **"Confirm email" OFF** (the default Supabase mailer can only email your own team).
- Only approved institutions can post jobs (max 3 pending/live at a time, enforced in the database) and reveal teacher contact details (only teachers who ticked the share box; every view is logged in `contact_views`, max 100 different teachers per day).
- Password-reset emails need custom SMTP (a verified domain in Resend) before they will reach schools.
