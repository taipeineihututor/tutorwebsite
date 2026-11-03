import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle2, Clock, FileUp, Loader2, LogOut, ShieldCheck, XCircle } from 'lucide-react';
import { Banner, Field, inputCls, PageShell, Panel, PrimaryButton, SecondaryButton } from '../components/ui';
import { CITIES, SCHOOL_TYPES } from '../lib/constants';
import { MAX_ACTIVE_POSTS, school } from '../lib/api';

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const linkOk = (v) => /^https?:\/\/\S+\.\S+/i.test(v);
const MAX_PROOF_MB = 5;

function SignIn({ onDone }) {
  const [mode, setMode] = useState('up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setNote('');
    if (!emailOk(email.trim())) return setErr('Please enter a valid email address.');
    if (mode === 'up' && password.length < 8) return setErr('Please choose a password with at least 8 characters.');
    setBusy(true);
    try {
      if (mode === 'up') {
        const r = await school.signUp(email.trim(), password);
        if (!r.signedIn) setNote('Account created. Please confirm your email address using the link we sent, then sign in here.');
        else onDone();
      } else {
        await school.signIn(email.trim(), password);
        onDone();
      }
    } catch (ex) {
      const m = String(ex?.message || '');
      setErr(
        /already registered|already been registered/i.test(m) ? 'This email already has an account. Please sign in instead.'
          : /invalid login/i.test(m) ? 'That email or password is not right.'
          : /rate|too many/i.test(m) ? 'Too many attempts. Please wait a few minutes and try again.'
          : 'Sorry, that did not work. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title="Schools & institutions" subtitle="Verified institutions can post jobs and see teachers' contact details. Free of charge.">
      <Panel>
        <div className="grid sm:grid-cols-3 gap-3 mb-6 text-sm text-slate-700">
          {[
            ['1. Create a login', 'Use a work email address of your institution.'],
            ['2. Tell us who you are', 'Name, tax ID and a document that proves it. Only our admin sees this.'],
            ['3. We verify, you post', 'Usually within a day or two. Then you can post jobs (up to 3 at a time) and contact teachers.'],
          ].map(([h, t]) => (
            <div key={h} className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="font-black text-slate-900">{h}</p>
              <p className="mt-1">{t}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-5" role="tablist">
          {[['up', 'Create a login'], ['in', 'I already have a login']].map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setErr(''); setNote(''); }}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition ${mode === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'}`}>{l}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4 max-w-md">
          <Field label="Email" htmlFor="s_email">
            <input id="s_email" type="email" className={inputCls} value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" htmlFor="s_pw" hint={mode === 'up' ? 'At least 8 characters.' : undefined}>
            <input id="s_pw" type="password" className={inputCls} value={password} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {err && <Banner tone="error">{err}</Banner>}
          {note && <Banner tone="ok">{note}</Banner>}
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'up' ? 'Create login' : 'Sign in'}
          </PrimaryButton>
        </form>
      </Panel>
    </PageShell>
  );
}

function RegistrationForm({ session, existing, onDone }) {
  const [f, setF] = useState({
    institution_name: existing?.institution_name || '', institution_type: existing?.institution_type || '',
    tax_id: existing?.tax_id || '', website: existing?.website || '', city: existing?.city || '', address: existing?.address || '',
    contact_name: existing?.contact_name || '', contact_title: existing?.contact_title || '', phone: existing?.phone || '',
    message: existing?.message || '', consent: false,
  });
  const [proof, setProof] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const e = {};
    if (f.institution_name.trim().length < 2) e.institution_name = 'Please enter the full name of your institution.';
    if (!f.institution_type) e.institution_type = 'Please choose a type.';
    if (!/^\d{8}$/.test(f.tax_id.trim())) e.tax_id = 'The Taiwan business tax ID (統一編號) has 8 digits.';
    if (f.website.trim() && !linkOk(f.website.trim())) e.website = 'Links should start with https://';
    if (!f.city) e.city = 'Please choose a city.';
    if (f.address.trim().length < 5) e.address = 'Please enter the address of your institution.';
    if (f.contact_name.trim().length < 2) e.contact_name = 'Please enter the name of the person responsible.';
    if (f.phone.trim().length < 6) e.phone = 'Please enter a phone number we can call to verify you.';
    if (!proof && !existing?.proof_path) e.proof = 'Please upload a document that shows your institution (see the list above).';
    if (!f.consent) e.consent = 'Please tick the box to continue.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setSubmitError('');
    try {
      await school.register(session.userId, {
        institution_name: f.institution_name.trim(), institution_type: f.institution_type, tax_id: f.tax_id.trim(),
        website: f.website.trim() || null, city: f.city, address: f.address.trim(),
        contact_name: f.contact_name.trim(), contact_title: f.contact_title.trim() || null, phone: f.phone.trim(),
        message: f.message.trim() || null,
        contact_email: session.email,
      }, proof, existing);
      onDone();
    } catch (ex) {
      setSubmitError(ex?.code === 'P0001' && ex.message ? ex.message : 'Sorry, something went wrong and your registration was not sent. Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const pickProof = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_PROOF_MB * 1024 * 1024) return setErrors((p) => ({ ...p, proof: `Please choose a file under ${MAX_PROOF_MB} MB.` }));
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) return setErrors((p) => ({ ...p, proof: 'Please upload a PDF, JPG or PNG file.' }));
    setErrors((p) => ({ ...p, proof: undefined }));
    setProof(file);
  };

  return (
    <div className="space-y-6">
      <Banner tone="info">
        <ShieldCheck className="inline w-4 h-4 mr-1 -mt-0.5" />
        Why we ask: teachers share their email, phone and intro video only with <strong>verified institutions</strong>. We check every institution by hand. These details are seen by our admin only, never shown on the site.
      </Banner>

      <Field label="Institution name" required error={errors.institution_name} htmlFor="r_name" hint="The official name, as on your registration. Chinese and English both welcome.">
        <input id="r_name" className={inputCls} maxLength={150} value={f.institution_name} onChange={(e) => set('institution_name', e.target.value)} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-6">
        <Field label="Type" required error={errors.institution_type} htmlFor="r_type">
          <select id="r_type" className={inputCls} value={f.institution_type} onChange={(e) => set('institution_type', e.target.value)}>
            <option value="">Choose…</option>
            {SCHOOL_TYPES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Business tax ID (統一編號)" required error={errors.tax_id} htmlFor="r_tax" hint="8 digits. Public schools can use their organisation code.">
          <input id="r_tax" inputMode="numeric" maxLength={8} className={inputCls} value={f.tax_id} onChange={(e) => set('tax_id', e.target.value.replace(/\D/g, ''))} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <Field label="City" required error={errors.city} htmlFor="r_city">
          <select id="r_city" className={inputCls} value={f.city} onChange={(e) => set('city', e.target.value)}>
            <option value="">Choose…</option>
            {CITIES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Website" error={errors.website} htmlFor="r_web" hint="Optional, but it helps us verify you.">
          <input id="r_web" type="url" className={inputCls} placeholder="https://" maxLength={300} value={f.website} onChange={(e) => set('website', e.target.value)} />
        </Field>
      </div>
      <Field label="Address" required error={errors.address} htmlFor="r_addr">
        <input id="r_addr" className={inputCls} maxLength={250} value={f.address} onChange={(e) => set('address', e.target.value)} />
      </Field>

      <hr className="border-slate-200" />
      <div className="grid sm:grid-cols-2 gap-6">
        <Field label="Person responsible" required error={errors.contact_name} htmlFor="r_cn">
          <input id="r_cn" className={inputCls} maxLength={100} autoComplete="name" value={f.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
        </Field>
        <Field label="Their job title" htmlFor="r_ct" hint="Optional, e.g. Director, HR manager">
          <input id="r_ct" className={inputCls} maxLength={100} value={f.contact_title} onChange={(e) => set('contact_title', e.target.value)} />
        </Field>
      </div>
      <Field label="Phone number" required error={errors.phone} htmlFor="r_ph" hint="We may call to check your registration. Not shown to anyone.">
        <input id="r_ph" type="tel" className={inputCls} maxLength={60} value={f.phone} onChange={(e) => set('phone', e.target.value)} />
      </Field>

      <Field label="Proof of your institution" required error={errors.proof} group
        hint="Upload ONE of: business registration (公司登記/商業登記), cram school (補習班) permit, school licence, or an official letter showing the tax ID and address. PDF, JPG or PNG, under 5 MB.">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer border border-slate-300 hover:border-emerald-600 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold transition">
            <FileUp className="w-4 h-4" /> {proof || existing?.proof_path ? 'Choose a different file' : 'Choose file'}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="sr-only" onChange={pickProof} />
          </label>
          <span className="text-sm text-slate-600">{proof ? proof.name : existing?.proof_path ? 'A file was already uploaded.' : 'No file chosen'}</span>
        </div>
      </Field>

      <Field label="Anything else we should know?" htmlFor="r_msg" hint="Optional.">
        <textarea id="r_msg" rows={3} maxLength={1000} className={inputCls} value={f.message} onChange={(e) => set('message', e.target.value)} />
      </Field>

      <div className="space-y-2">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
          <span className="text-sm text-slate-700">
            I confirm that these details are true and that I am allowed to recruit for this institution. I will only use teachers' contact details to offer them genuine teaching work, and I accept that each time I view a teacher's details it is recorded. I have read the <a href="#/legal" target="_blank" rel="noreferrer" className="underline font-semibold">Terms &amp; Privacy</a>.
          </span>
        </label>
        {errors.consent && <p role="alert" className="text-sm font-semibold text-red-600">{errors.consent}</p>}
      </div>

      {submitError && <Banner tone="error">{submitError}</Banner>}
      <div className="flex justify-end">
        <PrimaryButton onClick={submit} disabled={busy}>{busy ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : 'Send for verification'}</PrimaryButton>
      </div>
    </div>
  );
}

const jobState = (j) =>
  j.closed_at ? { label: 'Closed', cls: 'bg-slate-100 text-slate-600' }
    : j.status === 'approved' ? { label: 'Live', cls: 'bg-green-100 text-green-800' }
    : j.status === 'pending' ? { label: 'Waiting for review', cls: 'bg-amber-100 text-amber-800' }
    : { label: 'Rejected', cls: 'bg-red-100 text-red-800' };
const isActive = (j) => !j.closed_at && ['pending', 'approved'].includes(j.status);

function Dashboard({ session, onChange }) {
  const reg = session.registration;
  const [jobs, setJobs] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const load = useCallback(() => school.myJobs(reg).then(setJobs).catch(() => setJobs([])), [reg]);
  useEffect(() => { load(); }, [load]);

  const close = async (j) => {
    if (!window.confirm(`Close "${j.title}"? It will disappear from the site.`)) return;
    setBusy(j.id);
    setErr('');
    try { await school.closeJob(j.id); await load(); } catch { setErr('Could not close the post. Please try again.'); } finally { setBusy(''); }
  };
  const active = (jobs || []).filter(isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
        <BadgeCheck className="w-8 h-8 text-emerald-600 shrink-0" />
        <div>
          <p className="font-black text-slate-900">{reg.institution_name} is a verified institution</p>
          <p className="text-sm text-slate-700">You can now post jobs and use “Show contact details” on teacher profiles that chose to share them.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {active < MAX_ACTIVE_POSTS
          ? <a href="#/post-job" className="inline-flex bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold transition">Post a job</a>
          : <Banner tone="warn">You have {MAX_ACTIVE_POSTS} active posts, the maximum. Close one to post another.</Banner>}
        <a href="#/teachers" className="font-bold text-emerald-700 hover:underline">Find teachers →</a>
      </div>

      <div>
        <h2 className="text-lg font-black text-slate-900 mb-1">My posts</h2>
        <p className="text-sm text-slate-500 mb-3">Active posts (live or waiting for review): {active} of {MAX_ACTIVE_POSTS}</p>
        {err && <Banner tone="error">{err}</Banner>}
        {jobs === null && <p className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</p>}
        {jobs?.length === 0 && <p className="text-slate-500">You have not posted anything yet.</p>}
        <ul className="space-y-2">
          {(jobs || []).map((j) => {
            const st = jobState(j);
            return (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 break-words">{j.title} <span className="font-normal text-slate-500">· {j.city}</span></p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                  {j.status === 'rejected' && j.admin_note && <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{j.admin_note}</p>}
                </div>
                {isActive(j) && <SecondaryButton disabled={busy === j.id} onClick={() => close(j)} className="!py-2 !text-sm">Close this post</SecondaryButton>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function School() {
  const [session, setSession] = useState(undefined);
  const [editing, setEditing] = useState(false);
  const refresh = useCallback(() => school.session().then((s) => { setSession(s); setEditing(false); }).catch(() => setSession(null)), []);
  useEffect(() => { refresh(); }, [refresh]);

  if (session === undefined) return <p className="flex items-center justify-center gap-2 text-slate-400 py-20"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</p>;
  if (!session) return <SignIn onDone={refresh} />;

  const reg = session.registration;
  const signOut = async () => { await school.signOut(); setSession(null); };
  const header = (
    <div className="flex items-center justify-between gap-3 mb-5 text-sm">
      <span className="text-slate-500 break-all">Signed in as <strong className="text-slate-800">{session.email}</strong></span>
      <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 shrink-0"><LogOut className="w-4 h-4" /> Sign out</button>
    </div>
  );

  let body;
  if (!reg || editing) {
    body = <RegistrationForm session={session} existing={reg} onDone={refresh} />;
  } else if (reg.status === 'approved') {
    body = <Dashboard session={session} />;
  } else if (reg.status === 'pending') {
    body = (
      <div className="text-center py-6 space-y-3">
        <Clock className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-2xl font-black">We are checking your registration</h2>
        <p className="text-slate-600 max-w-md mx-auto">Thank you, {reg.institution_name}. We verify every institution by hand, usually within a day or two. You can sign in here at any time to see the result.</p>
        {reg.admin_note && (
          <div className="max-w-md mx-auto text-left"><Banner tone="warn"><strong>Message from us:</strong><br /><span className="whitespace-pre-line">{reg.admin_note}</span></Banner></div>
        )}
        <SecondaryButton onClick={() => setEditing(true)}>Change my details / upload another file</SecondaryButton>
      </div>
    );
  } else {
    body = (
      <div className="text-center py-6 space-y-3">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-black">We could not verify this registration</h2>
        {reg.admin_note && <div className="max-w-md mx-auto text-left"><Banner tone="error"><span className="whitespace-pre-line">{reg.admin_note}</span></Banner></div>}
        <p className="text-slate-600 max-w-md mx-auto">You can correct your details and send them again, or email teachformosa@gmail.com.</p>
        <PrimaryButton onClick={() => setEditing(true)}><CheckCircle2 className="w-5 h-5" /> Correct and send again</PrimaryButton>
      </div>
    );
  }

  return (
    <PageShell title="Schools & institutions">
      <Panel>{header}{body}</Panel>
    </PageShell>
  );
}
