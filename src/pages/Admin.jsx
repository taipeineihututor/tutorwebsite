import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, Trash2, ChevronDown, Loader2, LogOut, Mail, User } from 'lucide-react';
import { admin } from '../lib/api';
import { geocodeBest, sleep } from '../lib/geocode';
import { isDemo } from '../lib/supabase';
import { Banner, Field, inputCls, PrimaryButton, SecondaryButton, Panel } from '../components/ui';
import { DAYS, SLOTS, VISA_SHORT, ARC_NEEDS, experienceLabel, fmtDate } from '../lib/constants';

const TABS = [
  { key: 'teachers', label: 'Teachers' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'inquiries', label: 'Messages' },
];
const STATUSES = ['pending', 'approved', 'rejected'];

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
    ['Weekly availability', availText(t.availability)],
    ['Hours by day', DAYS.filter((d) => t.availability_notes?.[d.key]).map((d) => `${d.label}: ${t.availability_notes[d.key]}`).join('\n')],
    ['Intro video', t.video_url],
    ['Introduction', t.bio],
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
    ['Start date', fmtDate(j.start_date)],
    ['Hours', j.schedule],
    ['Description', j.description],
    ['Requirements', j.requirements],
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

function Row({ kind, item, onSet, onDelete, busy }) {
  const [open, setOpen] = useState(false);
  const isTeacher = kind === 'teachers';
  const rows = (isTeacher ? teacherRows(item) : jobRows(item)).filter(([, v]) => v);
  const title = isTeacher ? item.full_name : item.title;
  const sub = isTeacher ? `${item.nationality} · ${item.email}` : `${item.school_name} · ${item.city}`;

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
          </div>
          <p className="text-sm text-slate-600 break-words">{sub}</p>
          <p className="text-xs text-slate-400 mt-0.5">Sent {new Date(item.created_at).toLocaleString()}</p>
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
        {item.status !== 'approved' && (
          <PrimaryButton disabled={busy} onClick={() => onSet(item, 'approved')} className="!py-2 !text-sm"><Check className="w-4 h-4" /> Approve</PrimaryButton>
        )}
        {item.status !== 'rejected' && (
          <SecondaryButton disabled={busy} onClick={() => onSet(item, 'rejected')} className="!py-2 !text-sm"><X className="w-4 h-4" /> Reject</SecondaryButton>
        )}
        {item.status === 'approved' && (
          <SecondaryButton disabled={busy} onClick={() => onSet(item, 'pending')} className="!py-2 !text-sm">Take offline</SecondaryButton>
        )}
        <SecondaryButton disabled={busy} onClick={() => onDelete(item)} className="!py-2 !text-sm !text-red-700 !border-red-200 hover:!border-red-500"><Trash2 className="w-4 h-4" /> Delete</SecondaryButton>
      </div>
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
        </Panel>
      </div>
    </section>
  );
}

export default function Admin() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [tab, setTab] = useState('teachers');
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState({ teachers: [], jobs: [], inquiries: [] });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const checkSession = useCallback(() => admin.session().then(setSession).catch(() => setSession(null)), []);
  useEffect(() => { checkSession(); }, [checkSession]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [teachers, jobs, inquiries] = await Promise.all([admin.list('teachers'), admin.list('jobs'), admin.list('inquiries')]);
      setData({ teachers, jobs, inquiries });
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
    return <p className="flex items-center justify-center gap-2 text-slate-400 py-20"><Loader2 className="w-5 h-5 animate-spin" /> Checking sign-in…</p>;
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
  const deleteItem = (item) => {
    if (window.confirm('Delete this permanently? This cannot be undone.')) act(() => admin.remove(tab, item));
  };

  const count = (k, s) => data[k].filter((r) => r.status === s).length;
  const list = tab === 'inquiries' ? data.inquiries : data[tab].filter((r) => r.status === status);

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

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {TABS.map((t) => {
            const pending = t.key === 'inquiries' ? data.inquiries.length : count(t.key, 'pending');
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
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
            </div>
          )}

          {error && <div className="mb-4"><Banner tone="error">{error}</Banner></div>}
          {loading && <p className="flex items-center gap-2 text-slate-500 py-6"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</p>}

          {!loading && list.length === 0 && (
            <p className="text-slate-500 py-8 text-center">
              {tab === 'inquiries' ? 'No messages yet.' : `Nothing ${status} right now.`}
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
                  <Row key={item.id} kind={tab} item={item} busy={busy} onSet={setItemStatus} onDelete={deleteItem} />
                ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}
