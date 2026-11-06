import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, Trash2, ChevronDown, Loader2, LogOut, Mail, MessageSquare, User, FileText } from 'lucide-react';
import { admin } from '../lib/api';
import { geocodeBest, sleep } from '../lib/geocode';
import { isDemo } from '../lib/supabase';
import { ForgotPassword, ChangePassword, Banner, Field, inputCls, PrimaryButton, SecondaryButton, Panel } from '../components/ui';
import { DAYS, SLOTS, VISA_SHORT, ARC_NEEDS, experienceLabel, fmtDate } from '../lib/constants';

const TABS = [
  { key: 'teachers', label: 'Teachers' },
  { key: 'schools', label: 'Schools' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'inquiries', label: 'Messages' },
];
const STATUSES = ['pending', 'approved', 'rejected'];
const STALE_DAYS = 30;
const DAY_MS = 86400000;

const yesNo = (v) => (v === true || v === 'yes' ? 'Yes' : v === false || v === 'no' ? 'No' : v);
const availText = (a) =>
  DAYS.filter((d) => (a?.[d.key] || []).length)
    .map((d) => `${d.label}: ${a[d.key].map((s) => SLOTS.find((x) => x.key === s)?.label || s).join(', ')}`)
    .join(' · ');

function teacherRows(t) {
  return [
    ['Full name (private)', t.full_name],
    ['Email (private)', t.email],
    ['Phone / LINE (private)', t.phone],
    ['Nationality', t.nationality],
    ['English first language', yesNo(t.native_english)],
    ['Education', t.education],
    ['Certificates', (t.certificates || []).join(', ')],
    ['Experience', experienceLabel(t.experience)],
    ['Teaches', (t.subjects || []).join(', ')],
    ['In Taiwan now', yesNo(t.in_taiwan)],
    ['Visa / permit', VISA_SHORT[t.visa_status]],
    ['Stays until', fmtDate(t.stay_until)],
    ['Could arrive', fmtDate(t.arrival_date)],
    ['Needs ARC sponsorship', ARC_NEEDS.find((a) => a.value === t.needs_arc)?.label],
    ['Wants to work in', (t.cities || []).join(', ')],
    ['Job types', (t.job_types || []).join(', ')],
    ['Can start', fmtDate(t.available_from)],
    ['Available until', fmtDate(t.available_until)],
    ['Weekly availability', availText(t.availability)],
    ['Hours by day', DAYS.filter((d) => t.availability_notes?.[d.key]).map((d) => `${d.label}: ${t.availability_notes[d.key]}`).join('\n')],
    ['Intro video', t.video_url],
    ['Shares email/phone/video with verified schools', t.share_contact_with_schools ? 'Yes' : 'No'],
    ['Teacher login', t.user_id ? 'Linked to a login' : 'No login (cannot edit it themselves)'],
    ['Hidden by the teacher', t.hidden ? 'Yes' : ''],
    ['Introduction', t.bio],
    ['Admin note (private)', t.admin_note],
  ];
}

function jobRows(j) {
  return [
    ['School', j.school_name],
    ['School type', j.school_type],
    ['Contact', `${j.contact_name} <${j.contact_email}>`],
    ['Apply link', j.apply_link],
    ['Logo', j.logo_url],
    ['Locations', (j.locations || []).map((l, i) => `${i + 1}. ${[l.label, l.address].filter(Boolean).join(' – ')}${l.maps_url ? ` (${l.maps_url})` : ''}`).join('\n')],
    ['City', [j.city, j.district].filter(Boolean).join(' – ')],
    ['Job type', j.job_type],
    ['Pay', j.salary],
    ['Sponsors ARC', yesNo(j.arc_offered)],
    ['Start date', j.start_asap ? 'ASAP' : fmtDate(j.start_date)],
    ['Hours', j.schedule],
    ['Description', j.description],
    ['Requirements', j.requirements],
    ['Posted by a verified institution', j.school_id ? 'Yes' : 'No (older post)'],
    ['Closed by the school', j.closed_at ? fmtDate(j.closed_at) : ''],
    ['Admin note (private)', j.admin_note],
  ];
}

const hostOf = (u) => { try { return new URL(/^https?:/i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const emailMatchesSite = (email, site) => {
  const d = (email.split('@')[1] || '').toLowerCase();
  const h = hostOf(site);
  return !!d && !!h && (h === d || h.endsWith(`.${d}`) || d.endsWith(`.${h}`));
};

function schoolRows(r) {
  return [
    ['Institution', r.institution_name],
    ['Type', r.institution_type],
    ['Tax ID', r.tax_id],
    ['Website', r.website],
    ['City / address', [r.city, r.address].filter(Boolean).join(' – ')],
    ['Person responsible', [r.contact_name, r.contact_title].filter(Boolean).join(', ')],
    ['Login email', r.contact_email],
    ['Official institution email', r.official_email ? `${r.official_email}${r.website && !emailMatchesSite(r.official_email, r.website) ? '   ⚠ domain does not match the website' : ''}` : ''],
    ['Other credential', r.other_credential],
    ['Proof document', r.proof_path ? 'Uploaded (use "Open proof document")' : ''],
    ['Phone', r.phone],
    ['Message', r.message],
    ['Admin note (private)', r.admin_note],
  ];
}

function StatusPill({ status }) {
  const cls = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }[status];
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>{status}</span>;
}

const SIGN_OFF = '\n\nThank you,\nTeachFormosa team\nteachformosa@gmail.com';
// Ready-made messages. {name} is replaced with the person's first name.
const TEMPLATES = {
  jobs: [
    ['Ask for more details', 'Hi {name},\n\nThanks for posting your job on TeachFormosa. Before we can publish it, could you please send us a bit more information:\n\n- \n- \n\nOnce we have it, we will review it again right away.'],
    ['Missing pay or work permit info', 'Hi {name},\n\nThanks for your post. Teachers look first at pay and whether you can offer a Work Permit (support ARC). Could you tell us the pay range and whether you can support the ARC? We will publish it as soon as we have it.'],
    ['Not a teaching job', 'Hi {name},\n\nThank you for your post. Unfortunately we can only publish teaching jobs on TeachFormosa, so we cannot publish this one.'],
    ['Duplicate post', 'Hi {name},\n\nWe already have this job on TeachFormosa, so we did not publish a second copy. If you want to change the existing post, just reply to this email.'],
    ['Other (write your own)', 'Hi {name},\n\n'],
  ],
  schools: [
    ['Ask for more details', 'Hi {name},\n\nThanks for registering {school} on TeachFormosa. Before we can verify your institution, could you please send us:\n\n- \n\nYou can also sign in at the Schools page, correct your details and upload a new file. We will review it again right away.'],
    ['Proof document unreadable', 'Hi {name},\n\nThanks for registering. We could not read the document you uploaded. Could you upload a clear PDF or photo of your business registration or cram school permit (it must show the tax ID and the address)? Sign in at the Schools page and choose "Change my details".'],
    ['Tax ID does not match', 'Hi {name},\n\nThanks for registering. The tax ID you entered does not match the document / official record for this institution. Could you check it and send it again?'],
    ['Cannot verify', 'Hi {name},\n\nThank you for your interest in TeachFormosa. Unfortunately we could not verify your institution, so we cannot give your account access to post jobs or see teachers\' contact details.'],
    ['Other (write your own)', 'Hi {name},\n\n'],
  ],
  teachers: [
    ['Ask for more details', 'Hi {name},\n\nThanks for creating your profile on TeachFormosa. Before we can publish it, could you please send us a bit more information:\n\n- \n- \n\nOnce we have it, we will review it again right away.'],
    ['Introduction too short', 'Hi {name},\n\nThanks for your profile. Schools read the introduction first. Could you send us 3-4 sentences about your teaching experience and the age groups you like to teach? We will add it and publish your profile.'],
    ['Photo problem', 'Hi {name},\n\nThanks for your profile. We could not use the photo you uploaded (it should be a clear photo of your face). Could you send a new one by replying to this email?'],
    ['Cannot publish', 'Hi {name},\n\nThank you for your interest in TeachFormosa. Unfortunately we cannot publish your profile at this time.'],
    ['Other (write your own)', 'Hi {name},\n\n'],
  ],
};

function NotePanel({ kind, item, busy, onSave, onClose }) {
  const isTeacher = kind === 'teachers';
  const isSchool = kind === 'schools';
  const list = TEMPLATES[kind];
  const first = ((isTeacher ? item.full_name : item.contact_name) || '').trim().split(/\s+/)[0] || 'there';
  const fill = (t) => t.replace('{name}', first).replace('{school}', item.institution_name || 'your institution');
  const [which, setWhich] = useState(0);
  const [text, setText] = useState(fill(list[0][1]));
  const [reject, setReject] = useState(false);
  const [toOfficial, setToOfficial] = useState(false);
  const to = isSchool && toOfficial && item.official_email ? item.official_email : (isTeacher ? item.email : item.contact_email); // schools and jobs both use contact_email

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <p className="text-sm font-bold text-slate-900">Message to {first} <span className="font-normal text-slate-500">({to})</span></p>
      {isSchool && item.official_email && (
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={toOfficial} onChange={(e) => setToOfficial(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
          <span className="text-sm font-semibold text-slate-700">Send to their official institution email instead ({item.official_email}) – a reply from it helps confirm them</span>
        </label>
      )}
      <select aria-label="Message type" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium"
        value={which} onChange={(e) => { const i = Number(e.target.value); setWhich(i); setText(fill(list[i][1])); }}>
        {list.map(([label], i) => <option key={label} value={i}>{label}</option>)}
      </select>
      <textarea aria-label="Message" rows={8} maxLength={1800} value={text} onChange={(e) => setText(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm leading-relaxed" />
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input type="checkbox" checked={reject} onChange={(e) => setReject(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
        <span className="text-sm font-semibold text-slate-700">Also reject this {isTeacher ? 'profile' : isSchool ? 'registration' : 'post'} (otherwise it stays as it is)</span>
      </label>
      <p className="text-xs text-slate-500">
        This saves the message as a private note and opens your email app with the message ready to send. Nothing is sent automatically.
      </p>
      <div className="flex flex-wrap gap-2">
        <PrimaryButton disabled={busy || text.trim().length < 10} className="!py-2 !text-sm"
          onClick={() => onSave(item, text.trim(), reject ? 'rejected' : undefined, to, isTeacher ? 'your TeachFormosa profile' : isSchool ? 'your school registration' : `your TeachFormosa job post: ${item.title}`, text.trim() + SIGN_OFF)}>
          <Mail className="w-4 h-4" /> Save note &amp; open email
        </PrimaryButton>
        <SecondaryButton disabled={busy} onClick={onClose} className="!py-2 !text-sm">Cancel</SecondaryButton>
      </div>
    </div>
  );
}

function Row({ kind, item, all, lastActive, onSet, onDelete, onNote, onTouch, onLink, busy, views, names, reports }) {
  const [open, setOpen] = useState(false);
  const [noting, setNoting] = useState(false);
  // Same email (teacher) or same school + title (job) elsewhere in the list = probably a repeat.
  const norm = (v) => (v || '').trim().toLowerCase();
  const isTeacher = kind === 'teachers';
  const isSchool = kind === 'schools';
  const dupes = (all || []).filter((o) => o.id !== item.id && (isTeacher
    ? norm(o.email) === norm(item.email)
    : isSchool
      ? !!item.tax_id && o.tax_id === item.tax_id
      : norm(o.school_name) === norm(item.school_name) && norm(o.title) === norm(item.title)));
  const rows = (isTeacher ? teacherRows(item) : isSchool ? schoolRows(item) : jobRows(item)).filter(([, v]) => v);
  // Who viewed whose contact details
  const mine = (views || []).filter((v) => (isTeacher ? v.teacher_id === item.id : isSchool ? v.school_id === item.id : false));
  if (isTeacher && mine.length) rows.push(['Contact viewed by', mine.map((v) => `${names.schools[v.school_id] || 'a school'} (${new Date(v.viewed_at).toLocaleDateString()})`).join('\n')]);
  if (isSchool && mine.length) rows.push([`Teachers viewed (${mine.length})`, mine.map((v) => `${names.teachers[v.teacher_id] || 'a teacher'} (${new Date(v.viewed_at).toLocaleDateString()})`).join('\n')]);
  const myReports = (reports || []).filter((r) => r.item_id === item.id && r.kind === (isTeacher ? 'teacher' : 'job'));
  if (item.flag_reason) rows.unshift(['On hold because', item.flag_reason]);
  if (myReports.length) rows.unshift([`Reports (${myReports.length})`, myReports.map((r) => `${r.reason}${r.detail ? `: ${r.detail}` : ''} (${new Date(r.created_at).toLocaleDateString()})`).join('\n')]);
  const title = isTeacher ? item.full_name : isSchool ? item.institution_name : item.title;
  const sub = isTeacher ? `${item.nationality} · ${item.email}` : isSchool ? `${item.institution_type || ''} · ${item.tax_id ? `tax ID ${item.tax_id}` : 'no tax ID'} · ${item.city || ''}` : `${item.school_name} · ${item.city}`;
  const [proofErr, setProofErr] = useState('');
  const openProof = async () => {
    setProofErr('');
    try {
      const url = await admin.proofUrl(item.proof_path);
      if (url) window.open(url, '_blank', 'noopener'); else setProofErr(isDemo ? 'Preview mode: files are not stored.' : 'No file.');
    } catch { setProofErr('Could not open the file.'); }
  };

  return (
    <article className="border border-slate-200 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-4">
        {isTeacher && (
          <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
            {item.photo_url ? <img src={item.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-slate-400" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-900">{title}</h3>
            <StatusPill status={item.status} />
            {(item.flag_reason || myReports.length > 0) && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                {item.flag_reason ? `on hold: ${item.flag_reason.replace('Automatic check: ', 'filter: ')}` : `${myReports.length} report${myReports.length > 1 ? 's' : ''}`}
              </span>
            )}
            {dupes.length > 0 && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">possible duplicate ×{dupes.length}</span>}
            {item.admin_note && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">note saved</span>}
            {item.closed_at && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">closed by school</span>}
            {isTeacher && item.user_id && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">has login</span>}
            {isTeacher && item.hidden && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">hidden by teacher</span>}
            {isTeacher && item.share_contact_with_schools && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">shares contact</span>}
          </div>
          <p className="text-sm text-slate-600 break-words">{sub}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Sent {new Date(item.created_at).toLocaleString()} · Last activity {Math.floor((Date.now() - lastActive) / DAY_MS)} days ago
          </p>
        </div>
      </div>

      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:underline">
        {open ? 'Hide' : 'Show'} all details <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <dl className="mt-3 space-y-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="grid sm:grid-cols-[11rem_1fr] gap-x-4">
              <dt className="font-bold text-slate-500">{k}</dt>
              <dd className="text-slate-900 whitespace-pre-line break-words">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {isTeacher && !item.user_id && (
          <SecondaryButton disabled={busy} onClick={() => onLink(item)} className="!py-2 !text-sm">Link to a login</SecondaryButton>
        )}
        {isSchool && item.proof_path && (
          <SecondaryButton disabled={busy} onClick={openProof} className="!py-2 !text-sm"><FileText className="w-4 h-4" /> Open proof document</SecondaryButton>
        )}
        {item.status !== 'approved' && (
          <PrimaryButton disabled={busy} onClick={() => onSet(item, 'approved')} className="!py-2 !text-sm"><Check className="w-4 h-4" /> Approve</PrimaryButton>
        )}
        {item.status !== 'rejected' && (
          <SecondaryButton disabled={busy} onClick={() => onSet(item, 'rejected')} className="!py-2 !text-sm"><X className="w-4 h-4" /> Reject</SecondaryButton>
        )}
        {item.status === 'approved' && (
          <SecondaryButton disabled={busy} onClick={() => onSet(item, 'pending')} className="!py-2 !text-sm">{isSchool ? 'Remove verification' : 'Take offline'}</SecondaryButton>
        )}
        {item.status !== 'rejected' && Date.now() - lastActive >= STALE_DAYS * DAY_MS && (
          <SecondaryButton disabled={busy} onClick={() => onTouch(item)} className="!py-2 !text-sm">Still active</SecondaryButton>
        )}
        <SecondaryButton disabled={busy} onClick={() => setNoting((v) => !v)} className="!py-2 !text-sm"><MessageSquare className="w-4 h-4" /> Ask for details / explain</SecondaryButton>
        <SecondaryButton disabled={busy} onClick={() => onDelete(item)} className="!py-2 !text-sm !text-red-700 !border-red-200 hover:!border-red-500"><Trash2 className="w-4 h-4" /> Delete</SecondaryButton>
      </div>

      {proofErr && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{proofErr}</p>}
      {noting && (
        <NotePanel kind={kind} item={item} busy={busy} onClose={() => setNoting(false)}
          onSave={async (...args) => { const ok = await onNote(...args); if (ok) setNoting(false); }} />
      )}
    </article>
  );
}

function Login({ onDone, notAdminEmail }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await admin.signIn(email.trim(), password);
      onDone();
    } catch {
      setErr('That email or password is not right.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="px-4 py-14">
      <div className="max-w-md mx-auto">
        <Panel>
          <h1 className="text-2xl font-black mb-1">Admin sign in</h1>
          {isDemo ? (
            <p className="text-sm text-slate-600 mb-5">Preview mode: no password needed. In live mode this page is protected by a real login.</p>
          ) : (
            <p className="text-sm text-slate-600 mb-5">Only the site admin can approve posts.</p>
          )}
          {notAdminEmail && (
            <div className="mb-4"><Banner tone="warn">{notAdminEmail} is signed in but is not an admin. See SETUP.md, step 4.</Banner></div>
          )}
          <form onSubmit={submit} className="space-y-4">
            {!isDemo && (
              <>
                <Field label="Email" htmlFor="a_email">
                  <input id="a_email" type="email" required className={inputCls} value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Password" htmlFor="a_pw">
                  <input id="a_pw" type="password" required className={inputCls} value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
                </Field>
              </>
            )}
            {err && <Banner tone="error">{err}</Banner>}
            <PrimaryButton type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : isDemo ? 'Enter admin (preview)' : 'Sign in'}
            </PrimaryButton>
          </form>
          {!isDemo && <ForgotPassword initialEmail={email} dark={false} />}
        </Panel>
      </div>
    </section>
  );
}

export default function Admin() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [tab, setTab] = useState('teachers');
  const [status, setStatus] = useState('approved');
  const [data, setData] = useState({ teachers: [], jobs: [], inquiries: [], schools: [], views: [], reports: [] });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const checkSession = useCallback(() => admin.session().then(setSession).catch(() => setSession(null)), []);
  useEffect(() => { checkSession(); }, [checkSession]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [teachers, jobs, inquiries, schools, views, reports] = await Promise.all([
        admin.list('teachers'), admin.list('jobs'), admin.list('inquiries'), admin.list('schools'), admin.contactViews(), admin.reports(),
      ]);
      setData({ teachers, jobs, inquiries, schools, views, reports });
    } catch {
      setError('Could not load the data. Check that the database is set up and you are signed in as an admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  const isAdmin = session && !session.notAdmin;
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  // Place any job addresses that are not on the map yet and save the positions, so visitors do not have to.
  const placing = React.useRef(false);
  useEffect(() => {
    if (!isAdmin || placing.current) return;
    const todo = data.jobs.filter((j) => (j.locations || []).some((l) => l.address && !Number.isFinite(l.lat)));
    if (!todo.length) return;
    placing.current = true;
    (async () => {
      try {
        for (const j of todo.slice(0, 5)) {
          const next = [];
          for (const l of j.locations) {
            if (l.address && !Number.isFinite(l.lat)) {
              const pos = await geocodeBest(l.address);
              next.push(pos ? { ...l, ...pos } : l);
              await sleep(1100);
            } else next.push(l);
          }
          if (JSON.stringify(next) !== JSON.stringify(j.locations)) await admin.saveLocations(j.id, next);
        }
      } catch { /* best effort */ }
      placing.current = false;
    })();
  }, [isAdmin, data.jobs]);

  if (session === undefined) {
    return <p className="flex items-center justify-center gap-2 text-slate-200 py-20"><Loader2 className="w-5 h-5 animate-spin" /> Checking sign-in…</p>;
  }
  if (!isAdmin) return <Login onDone={checkSession} notAdminEmail={session?.notAdmin ? session.email : ''} />;

  const act = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
    } catch {
      setError('That did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const setItemStatus = (item, s) => act(() => admin.setStatus(tab, item.id, s));
  // Saves the note (and optionally rejects), then opens the admin's email app with the message ready.
  const sendNote = async (item, note, newStatus, to, subjectBit, body) => {
    setBusy(true);
    setError('');
    try {
      await admin.saveNote(tab, item.id, note, newStatus);
      await load();
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(`TeachFormosa: ${subjectBit}`)}&body=${encodeURIComponent(body)}`;
      return true;
    } catch {
      setError('Could not save the note. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };
  const linkItem = async (item) => {
    const email = window.prompt('Email the teacher used to create their login:', item.email || '');
    if (!email || !email.trim()) return;
    setBusy(true);
    setError('');
    try { await admin.linkTeacher(item.id, email.trim()); await load(); } catch (ex) { setError(ex?.message || 'Could not link the profile.'); } finally { setBusy(false); }
  };
  const touchItem = (item) => act(() => admin.touch(tab, item.id));
  const deleteItem = (item) => {
    if (window.confirm('Delete this permanently? This cannot be undone.')) act(() => admin.remove(tab, item));
  };

  const names = {
    schools: Object.fromEntries(data.schools.map((r) => [r.id, r.institution_name])),
    teachers: Object.fromEntries(data.teachers.map((r) => [r.id, r.full_name])),
  };
  const count = (k, s) => data[k].filter((r) => r.status === s).length;
  // Last time anything happened: posted, approved/edited/noted/"still active", or (teachers) a school wrote to them.
  const lastActive = (item) => {
    const own = Math.max(new Date(item.updated_at || item.created_at).getTime(), item.last_active_at ? new Date(item.last_active_at).getTime() : 0);
    if (tab !== 'teachers') return own;
    return data.inquiries.filter((q) => q.teacher_id === item.id).reduce((m, q) => Math.max(m, new Date(q.created_at).getTime()), own);
  };
  const isStale = (r) => r.status !== 'rejected' && Date.now() - lastActive(r) >= STALE_DAYS * DAY_MS;
  const staleCount = (k) => data[k].filter(isStale).length;
  const list = tab === 'inquiries'
    ? data.inquiries
    : status === 'stale'
      ? data[tab].filter(isStale).sort((a, b) => lastActive(a) - lastActive(b))
      : data[tab].filter((r) => r.status === status);

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-white">Admin</h1>
          <button onClick={async () => { await admin.signOut(); setSession(null); }}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-sm font-semibold">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
        <div className="mb-4"><ChangePassword email={session.email} dark /></div>

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {TABS.filter((t) => t.key !== 'inquiries' || data.inquiries.length > 0).map((t) => {
            const pending = t.key === 'inquiries' ? data.inquiries.length : count(t.key, 'pending');
            return (
              <button key={t.key} onClick={() => { setTab(t.key); setStatus(t.key === 'schools' ? 'pending' : 'approved'); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ${tab === t.key ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-200 border border-slate-700'}`}>
                {t.label}
                {pending > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tab === t.key ? 'bg-slate-950 text-emerald-300' : 'bg-amber-400 text-amber-950'}`}>{pending}</span>
                )}
              </button>
            );
          })}
        </div>

        <Panel className="!p-4 sm:!p-6">
          {tab !== 'inquiries' && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition ${status === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'}`}>
                  {s[0].toUpperCase() + s.slice(1)} ({count(tab, s)})
                </button>
              ))}
              <button onClick={() => setStatus('stale')} title="Nothing has happened for 30 days or more"
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition ${status === 'stale' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-700 border-orange-300'}`}>
                Inactive {STALE_DAYS}+ days ({staleCount(tab)})
              </button>
            </div>
          )}

          {error && <div className="mb-4"><Banner tone="error">{error}</Banner></div>}
          {loading && <p className="flex items-center gap-2 text-slate-500 py-6"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</p>}

          {!loading && list.length === 0 && (
            <p className="text-slate-500 py-8 text-center">
              {tab === 'inquiries' ? 'No messages yet.' : (status === 'stale' ? `Nothing is inactive: everything has had activity in the last ${STALE_DAYS} days.` : `Nothing ${status} right now.`)}
            </p>
          )}

          <div className="space-y-4">
            {tab === 'inquiries'
              ? list.map((q) => (
                  <article key={q.id} className="border border-slate-200 rounded-2xl p-4 sm:p-5 text-sm space-y-2">
                    <p className="font-black text-slate-900">
                      {q.from_name} ({q.school}) → {q.teachers?.full_name || 'a teacher'}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(q.created_at).toLocaleString()}</p>
                    <p className="whitespace-pre-line text-slate-800">{q.message}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-slate-600">
                      <a className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:underline" href={`mailto:${q.from_email}`}><Mail className="w-4 h-4" />Reply to school: {q.from_email}</a>
                      {q.teachers?.email && <span>Teacher's email: {q.teachers.email}</span>}
                    </div>
                    <SecondaryButton disabled={busy} onClick={() => act(() => admin.remove('inquiries', q))} className="!py-2 !text-sm mt-1">
                      <Check className="w-4 h-4" /> Done – remove
                    </SecondaryButton>
                  </article>
                ))
              : list.map((item) => (
                  <Row key={item.id} kind={tab} item={item} all={data[tab]} lastActive={lastActive(item)} onTouch={touchItem} onLink={linkItem} busy={busy} onSet={setItemStatus} onDelete={deleteItem} onNote={sendNote} views={data.views} names={names} reports={data.reports} />
                ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}
