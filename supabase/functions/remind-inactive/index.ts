// Daily job (see supabase/reminders.sql): emails teachers whose profile will be hidden in 5 days
// because they have not signed in for 25 days. Each teacher is reminded once per period of inactivity.
// Secrets: RESEND_API_KEY (required). MAIL_FROM (optional, e.g. 'TeachFormosa <hello@teachformosa.com>').
// NOTE: Resend's shared test sender (onboarding@resend.dev) only delivers to the Resend account owner,
// so real teachers only get the email after a domain is verified in Resend and MAIL_FROM is set.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://tutorwebsite-pied.vercel.app';
const DAY = 86400000;
const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async () => {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return json({ error: 'RESEND_API_KEY is not set' }, 500);
  const from = Deno.env.get('MAIL_FROM') || 'TeachFormosa <onboarding@resend.dev>';
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const now = Date.now();
  const { data: rows, error } = await db
    .from('teachers')
    .select('id, full_name, email, last_active_at, reminded_at')
    .not('user_id', 'is', null)
    .eq('status', 'approved')
    .eq('hidden', false)
    .lte('last_active_at', new Date(now - 25 * DAY).toISOString())
    .gt('last_active_at', new Date(now - 30 * DAY).toISOString())
    .limit(200);
  if (error) return json({ error: error.message }, 500);

  let sent = 0, failed = 0;
  for (const t of rows ?? []) {
    if (t.reminded_at && new Date(t.reminded_at) >= new Date(t.last_active_at)) continue; // already reminded
    // Claim this teacher so two overlapping runs cannot both send.
    let claim = db.from('teachers').update({ reminded_at: new Date().toISOString() }).eq('id', t.id).eq('last_active_at', t.last_active_at);
    claim = t.reminded_at ? claim.eq('reminded_at', t.reminded_at) : claim.is('reminded_at', null);
    const { data: won } = await claim.select('id');
    if (!won?.length) continue;

    const daysLeft = Math.max(1, Math.ceil((new Date(t.last_active_at).getTime() + 30 * DAY - now) / DAY));
    const first = esc((t.full_name || '').trim().split(/\s+/)[0] || 'there');
    const html =
      `<div style="font-family:Arial,sans-serif;color:#0a1745;max-width:520px">` +
      `<h2 style="margin:0 0 8px">Hi ${first}, your TeachFormosa profile will be hidden in ${daysLeft} days</h2>` +
      `<p>To keep the website tidy, teacher profiles that have not been used for 30 days are hidden from schools.</p>` +
      `<p>To keep yours visible, just sign in once. It takes a few seconds.</p>` +
      `<p style="margin:22px 0"><a href="${SITE}/#/teacher" style="background:#ffce1f;color:#0a1745;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Sign in and keep my profile visible</a></p>` +
      `<p style="color:#5b6785;font-size:12px">If you have found a job you can ignore this email, or delete your profile after signing in. Questions: teachformosa@gmail.com</p>` +
      `</div>`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [t.email], subject: 'Keep your TeachFormosa profile visible', html }),
    });
    if (res.ok) sent++;
    else {
      failed++;
      await db.from('teachers').update({ reminded_at: t.reminded_at }).eq('id', t.id); // try again tomorrow
    }
  }
  return json({ candidates: rows?.length ?? 0, sent, failed });
});
