# Backups

A GitHub Action (`.github/workflows/backup.yml`) makes an encrypted backup every night at about 03:17 Taipei time
and keeps it for 90 days. Find it under **Actions → Nightly backup → (a run) → Artifacts → teachformosa-backup**.
You can also press **Run workflow** to make one right now.

## Setup (once)
In GitHub: repository **Settings → Secrets and variables → Actions → New repository secret**.
1. `DB_URL`: Supabase → **Connect** → **Session pooler** connection string, with `[YOUR-PASSWORD]` replaced by the database password
   (Project Settings → Database → Reset database password if you do not know it).
2. `BACKUP_PASSPHRASE`: a long random passphrase (20+ characters). Keep a copy in your password manager. Without it a backup cannot be opened.
3. Optional, to include teacher photos and school proof documents: `SUPABASE_URL` (https://umiqyzwedcomcobtrhko.supabase.co) and
   `SUPABASE_SERVICE_KEY` (Supabase → Project Settings → API → service_role key).

This repository is public, so the backup is always encrypted before it is uploaded. Never put passwords in the repository itself.

## Open a backup
```
gpg --decrypt teachformosa-YYYY-MM-DD.tar.gz.gpg > backup.tar.gz
tar -xzf backup.tar.gz
```
You get `backup/public.dump` (all tables, functions and rules), `backup/auth-logins.sql` (logins) and, if enabled, `backup/files/`.

## Restore into an empty Supabase project
1. Create the project, then restore the data: `pg_restore --no-owner -d "<connection string>" backup/public.dump`
2. Load the logins: `psql "<connection string>" -f backup/auth-logins.sql`
3. Upload `backup/files/<bucket>/...` back into the same storage buckets.
4. Redeploy the edge functions in `supabase/functions` and set their secrets.
Test a restore once into a throwaway project so you know it works.
