// Emails the site admin when a new teacher profile or job post is waiting for review.
//
// How it is triggered: a database trigger (see supabase/notifications.sql) calls this
// function after every new teacher/job row. The function does not trust the request body.
// Instead it looks in the database for pending rows that have not been announced yet
// (notified_at is null), claims them, and sends ONE email covering all of them.
// Calling it extra times is therefore harmless, and if sending fails the rows are
// un-claimed so the next submission retries.
//
// Needs one secret: RESEND_API_KEY (set in Supabase -> Edge Functions -> Secrets).
import { createClient } from 'npm:@supabase/supabase-js@2';

const ADMIN_EMAIL = 'teachformosa@gmail.com';
const ADMIN_URL = 'https://tutorwebsite-pied.vercel.app/#/admin';
// Resend's shared test sender. It can only deliver to the email address the Resend account
// was created with, which is exactly what we need here.
const FROM = 'TeachFormosa <onboarding@resend.dev>';

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const line = (label: string, value: unknown) =>
  value ? `<tr><td style="padding:2px 14px 2px 0;color:#5b6785;font-weight:bold">${esc(label)}</td><td>${esc(value)}</td></tr>` : '';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async () => {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return json({ error: 'RESEND_API_KEY is not set' }, 500);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const stamp = new Date().toISOString();

  // Claim un-announced pending rows. Each row can be claimed by only one call.
  const { data: teachers, error: e1 } = await db
    .from('teachers')
    .update({ notified_at: stamp })
    .is('notified_at', null)
    .eq('status', 'pending')
    .select('id, full_name, nationality, in_taiwan, needs_arc, experience');
  const { data: jobs, error: e2 } = await db
    .from('jobs')
    .update({ notified_at: stamp })
    .is('notified_at', null)
    .eq('status', 'pending')
    .select('id, school_name, title, city, job_type, arc_offered, contact_name');
  const { data: schools, error: e3 } = await db
    .from('schools')
    .update({ notified_at: stamp })
    .is('notified_at', null)
    .eq('status', 'pending')
    .select('id, institution_name, institution_type, tax_id, city, contact_name');
  if (e1 || e2 || e3) return json({ error: (e1 || e2 || e3)!.message }, 500);

  if (!teachers?.length && !jobs?.length && !schools?.length) return json({ sent: 0 });

  const parts: string[] = [];
  const subjectBits: string[] = [];

  if (schools?.length) {
    subjectBits.push(`${schools.length} school registration${schools.length > 1 ? 's' : ''}`);
    for (const sc of schools) {
      parts.push(
        `<h3 style="margin:18px 0 6px">New school registration (needs verification)</h3><table>` +
          line('Institution', sc.institution_name) + line('Type', sc.institution_type) +
          line('Tax ID', sc.tax_id) + line('City', sc.city) + line('Contact', sc.contact_name) +
          `</table>`,
      );
    }
  }
  if (jobs?.length) {
    subjectBits.push(`${jobs.length} new job post${jobs.length > 1 ? 's' : ''}`);
    for (const j of jobs) {
      parts.push(
        `<h3 style="margin:18px 0 6px">New job post</h3><table>` +
          line('Job', j.title) + line('School', j.school_name) + line('City', j.city) +
          line('Type', j.job_type) + line('Sponsors ARC', j.arc_offered) + line('Contact', j.contact_name) +
          `</table>`,
      );
    }
  }
  if (teachers?.length) {
    subjectBits.push(`${teachers.length} new teacher profile${teachers.length > 1 ? 's' : ''}`);
    for (const t of teachers) {
      parts.push(
        `<h3 style="margin:18px 0 6px">New teacher profile</h3><table>` +
          line('Name', t.full_name) + line('Nationality', t.nationality) +
          line('In Taiwan', t.in_taiwan ? 'Yes' : 'No') + line('Needs ARC sponsorship', t.needs_arc) +
          line('Experience (years)', t.experience) +
          `</table>`,
      );
    }
  }

  const html =
    `<div style="font-family:Arial,sans-serif;color:#0a1745;max-width:560px">` +
    `<h2 style="margin:0 0 4px">TeachFormosa: waiting for your review</h2>` +
    parts.join('') +
    `<p style="margin-top:22px"><a href="${ADMIN_URL}" style="background:#ffce1f;color:#0a1745;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Open the admin page</a></p>` +
    `<p style="color:#5b6785;font-size:12px">Nothing goes live until you approve it. Contact details and proof documents are only visible in the admin page.</p>` +
    `</div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [ADMIN_EMAIL],
      subject: `TeachFormosa: ${subjectBits.join(' and ')} to review`,
      html,
    }),
  });

  if (!res.ok) {
    // Un-claim so the next submission tries again.
    if (teachers?.length) await db.from('teachers').update({ notified_at: null }).in('id', teachers.map((t) => t.id));
    if (jobs?.length) await db.from('jobs').update({ notified_at: null }).in('id', jobs.map((j) => j.id));
    if (schools?.length) await db.from('schools').update({ notified_at: null }).in('id', schools.map((x) => x.id));
    return json({ error: 'Email provider rejected the request', status: res.status }, 502);
  }
  return json({ sent: (teachers?.length ?? 0) + (jobs?.length ?? 0) + (schools?.length ?? 0) });
});
