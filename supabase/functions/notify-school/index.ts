// Emails a school when the admin approves or rejects its registration.
//
// A database trigger (supabase/school-decision.sql) calls this after a school's status changes. The function
// does not trust the request body: it looks for schools whose status is approved/rejected but which have not
// been told about that status yet (decision_notified_status differs), claims them, and emails each one.
// Calling it extra times is harmless; if sending fails the claim is undone so the next call retries.
//
// Needs the secret RESEND_API_KEY. The sender must be an address on the verified domain teachformosa.com.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://www.teachformosa.com';
const FROM = 'TeachFormosa <hello@teachformosa.com>';
const REPLY_TO = 'teachformosa@gmail.com';

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const button = (href: string, label: string) =>
  `<p style="margin:22px 0"><a href="${href}" style="background:#ffce1f;color:#0a1745;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(label)}</a></p>`;

function approved(name: string) {
  return {
    subject: 'TeachFormosa: your institution is verified, you can now post jobs',
    html:
      `<h2 style="margin:0 0 8px">You are verified</h2>` +
      `<p>Good news: <strong>${esc(name)}</strong> has been verified on TeachFormosa.</p>` +
      `<p>You can now:</p><ul><li>post job offers (up to 3 open at a time, free of charge)</li>` +
      `<li>see the contact details of teachers who share them, and contact them directly</li>` +
      `<li>save teachers to your private list and note who you have contacted</li></ul>` +
      button(`${SITE}/#/school`, 'Sign in and post a job'),
  };
}
function rejected(name: string, note: string | null) {
  return {
    subject: 'TeachFormosa: we need a little more to verify your institution',
    html:
      `<h2 style="margin:0 0 8px">We could not verify your institution yet</h2>` +
      `<p>Thank you for registering <strong>${esc(name)}</strong> on TeachFormosa. We were not able to verify it with the details we received.</p>` +
      (note ? `<p style="background:#f3f6ff;border-left:4px solid #ffce1f;padding:10px 14px"><strong>Note from our team:</strong><br>${esc(note)}</p>` : '') +
      `<p>You can sign in, correct or add details (for example your tax ID, an official school email address, or a document) and send the registration again.</p>` +
      button(`${SITE}/#/school`, 'Sign in and update your registration') +
      `<p>Questions? Just reply to this email.</p>`,
  };
}

Deno.serve(async () => {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return json({ error: 'RESEND_API_KEY is not set' }, 500);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: todo, error } = await db
    .from('schools')
    .select('id, user_id, institution_name, status, admin_note, contact_email, decision_notified_status')
    .in('status', ['approved', 'rejected']);
  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  const failed: string[] = [];
  for (const s of (todo ?? []).filter((r) => r.decision_notified_status !== r.status)) {
    // Claim first so two overlapping calls cannot both email the same school.
    const { data: claimed } = await db
      .from('schools')
      .update({ decision_notified_status: s.status })
      .eq('id', s.id)
      .eq('status', s.status)
      .or(`decision_notified_status.is.null,decision_notified_status.neq.${s.status}`)
      .select('id');
    if (!claimed?.length) continue;

    const { data: u } = await db.auth.admin.getUserById(s.user_id);
    const to = [...new Set([u?.user?.email, s.contact_email].filter(Boolean) as string[])];
    if (!to.length) continue;
    const mail = s.status === 'approved' ? approved(s.institution_name) : rejected(s.institution_name, s.admin_note);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to,
        reply_to: REPLY_TO,
        subject: mail.subject,
        html: `<div style="font-family:Arial,sans-serif;color:#0a1745;max-width:560px">${mail.html}<p style="color:#5b6785;font-size:12px;margin-top:24px">TeachFormosa is free for schools and teachers.</p></div>`,
      }),
    });
    if (res.ok) sent++;
    else {
      failed.push(s.id);
      await db.from('schools').update({ decision_notified_status: s.decision_notified_status }).eq('id', s.id);
    }
  }
  return json(failed.length ? { sent, failed: failed.length } : { sent }, failed.length ? 502 : 200);
});
