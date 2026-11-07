import React, { useCallback, useEffect, useState } from 'react';
import SavedList from '../components/SavedList';
import { BadgeCheck, CheckCircle2, Clock, FileUp, Loader2, LogOut, ShieldCheck, XCircle } from 'lucide-react';
import { ForgotPassword, ChangePassword, Banner, Field, inputCls, PageShell, Panel, PrimaryButton, SecondaryButton } from '../components/ui';
import { CITIES, SCHOOL_TYPES } from '../lib/constants';
import { MAX_ACTIVE_POSTS, school } from '../lib/api';

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const linkOk = (v) => /^https?:\/\/\S+\.\S+/i.test(v);
const MAX_PROOF_MB = 5;
// Free / personal mail providers do not prove anything about an institution.
const FREE_MAIL = /@(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me|aol|proton|protonmail|gmx|qq|163|126|yandex|line|naver)\./i;

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
          : /not confirmed/i.test(m) ? 'Please confirm your email first: open the email we sent you and tap the link. If it does not work, email teachformosa@gmail.com and we will activate your login.'
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
            ['2. Tell us who you are', 'Name, plus your tax ID (preferred) or any one way to verify you: a school email address, a document, or another credential. Only our admin sees this.'],
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
        {mode === 'in' && <ForgotPassword initialEmail={email} />}
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
    official_email: existing?.official_email || '', other_credential: existing?.other_credential || '',
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
    if (f.tax_id.trim() && !/^\d{8}$/.test(f.tax_id.trim())) e.tax_id = 'The Taiwan business tax ID (統一編號) has 8 digits. Leave it empty if you do not have one.';
    if (f.website.trim() && !linkOk(f.website.trim())) e.website = 'Links should start with https://';
    if (!f.city) e.city = 'Please choose a city.';
    if (f.address.trim().length < 5) e.address = 'Please enter the address of your institution.';
    if (f.contact_name.trim().length < 2) e.contact_name = 'Please enter the name of the person responsible.';
    if (f.phone.trim().length < 6) e.phone = 'Please enter a phone number we can call to verify you.';
    const oe = f.official_email.trim();
    if (oe && !emailOk(oe)) e.official_email = 'Please enter a valid email address.';
    else if (oe && FREE_MAIL.test(oe)) e.official_email = 'This looks like a personal email (Gmail, Yahoo…). Please use an address on your institution\'s own domain, e.g. name@yourschool.edu.tw.';
    if (!proof && !existing?.proof_path && !oe && !f.tax_id.trim() && f.other_credential.trim().length < 5) {
      e.verify = 'Please give us at least ONE way to verify your institution: a tax ID, a document, an email address on your institution\'s own domain, or another credential.';
    }
    if (!f.consent) e.consent = 'Please tick the box to continue.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setSubmitError('');
    try {
      await school.register(session.userId, {
        institution_name: f.institution_name.trim(), institution_type: f.institution_type, tax_id: f.tax_id.trim() || null,
        website: f.website.trim() || null, city: f.city, address: f.address.trim(),
        contact_name: f.contact_name.trim(), contact_title: f.contact_title.trim() || null, phone: f.phone.trim(),
        message: f.message.trim() || null,
        official_email: f.official_email.trim() || null,
        other_credential: f.other_credential.trim() || null,
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
        <Field label="Business tax ID (統一編號)" error={errors.tax_id} htmlFor="r_tax" hint="Optional but preferred: it lets us check you on the official business registry. 8 digits.">
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

      <div className={`rounded-2xl border p-4 space-y-5 ${errors.verify ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
        <div>
          <p className="text-sm font-black text-slate-900">How can we verify you? <span className="text-emerald-600">*</span></p>
          <p className="text-sm text-slate-600">Along with the tax ID above (preferred), give us <strong>at least one</strong> of the three below, unless you entered a tax ID. A license is not required. More than one makes it faster.</p>
          {errors.verify && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{errors.verify}</p>}
        </div>

        <Field label="A. An email address on your institution's own domain" error={errors.official_email} htmlFor="r_oe"
          hint="For example principal@yourschool.edu.tw. Not Gmail / Yahoo. We may write to this address to confirm you.">
          <input id="r_oe" type="email" inputMode="email" className={inputCls} maxLength={200} value={f.official_email} onChange={(e) => set('official_email', e.target.value)} />
        </Field>

        <Field label="B. A document (optional)" error={errors.proof} group
          hint="Business registration (公司登記/商業登記), cram school (補習班) permit, school licence, or an official letter. PDF, JPG or PNG, under 5 MB.">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer border border-slate-300 bg-white hover:border-emerald-600 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold transition">
              <FileUp className="w-4 h-4" /> {proof || existing?.proof_path ? 'Choose a different file' : 'Choose file'}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="sr-only" onChange={pickProof} />
            </label>
            <span className="text-sm text-slate-600">{proof ? proof.name : existing?.proof_path ? 'A file was already uploaded.' : 'No file chosen'}</span>
          </div>
        </Field>

        <Field label="C. Another credential or link (optional)" htmlFor="r_oc"
          hint="For example a link to your listing on a government or Ministry of Education page, your cram school permit number, a school accreditation, or a reference we can contact.">
          <textarea id="r_oc" rows={2} maxLength={500} className={inputCls} value={f.other_credential} onChange={(e) => set('other_credential', e.target.value)} />
        </Field>
      </div>

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

function DetailsCard({ reg, onChange }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const start = () => {
    setF({
      contact_name: reg.contact_name || '', contact_title: reg.contact_title || '', phone: reg.phone || '',
      contact_email: reg.contact_email || '', website: reg.website || '', address: reg.address || '', city: reg.city || '',
    });
    setErr(''); setSaved(false); setOpen(true);
  };
  const save = async (e) => {
    e.preventDefault();
    setErr('');
    if (f.contact_name.trim().length < 2) return setErr('Please enter a contact person.');
    if (f.phone.trim().length < 6) return setErr('Please enter a phone number.');
    if (!emailOk(f.contact_email.trim())) return setErr('Please enter a valid contact email address.');
    if (f.website.trim() && !linkOk(f.website.trim())) return setErr('The website should start with https://');
    setBusy(true);
    try {
      await school.updateDetails({ ...f, contact_name: f.contact_name.trim(), phone: f.phone.trim(), contact_email: f.contact_email.trim(), website: f.website.trim() });
      setOpen(false); setSaved(true);
      await onChange?.();
    } catch {
      setErr('Sorry, the details could not be saved. Please try again.');
    } finally { setBusy(false); }
  };
  const rows = [
    ['Institution', reg.institution_name], ['Type', reg.institution_type], ['Tax ID', reg.tax_id], ['City', reg.city], ['Address', reg.address],
    ['Website', reg.website], ['Contact person', [reg.contact_name, reg.contact_title].filter(Boolean).join(', ')], ['Phone', reg.phone], ['Contact email', reg.contact_email],
  ];
  return (
    <div className="border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="text-lg font-black text-slate-900">Your details</h2>
        {!open && <SecondaryButton type="button" onClick={start} className="!py-2 !text-sm">Edit contact details</SecondaryButton>}
      </div>
      {saved && !open && <Banner tone="ok">Saved.</Banner>}
      {!open ? (
        <dl className="grid sm:grid-cols-[10rem_1fr] gap-x-4 gap-y-1 text-sm mt-2">
          {rows.filter(([, v]) => v).map(([k, v]) => (<React.Fragment key={k}><dt className="font-semibold text-slate-500">{k}</dt><dd className="text-slate-900 break-words">{v}</dd></React.Fragment>))}
        </dl>
      ) : (
        <form onSubmit={save} className="space-y-4 mt-3 max-w-xl">
          <Field label="Contact person" required htmlFor="d_cn"><input id="d_cn" className={inputCls} maxLength={100} value={f.contact_name} onChange={(e) => set('contact_name', e.target.value)} /></Field>
          <Field label="Job title" htmlFor="d_ct"><input id="d_ct" className={inputCls} maxLength={100} value={f.contact_title} onChange={(e) => set('contact_title', e.target.value)} /></Field>
          <Field label="Phone number" required htmlFor="d_ph" hint="Seen by our admin only."><input id="d_ph" type="tel" className={inputCls} maxLength={60} value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Contact email" required htmlFor="d_em" hint="Where we write to you. Your sign-in email stays the same."><input id="d_em" type="email" className={inputCls} maxLength={200} value={f.contact_email} onChange={(e) => set('contact_email', e.target.value)} /></Field>
          <Field label="Website" htmlFor="d_web"><input id="d_web" className={inputCls} maxLength={300} placeholder="https://" value={f.website} onChange={(e) => set('website', e.target.value)} /></Field>
          <Field label="City" htmlFor="d_city"><select id="d_city" className={inputCls} value={f.city} onChange={(e) => set('city', e.target.value)}>{CITIES.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Address" htmlFor="d_addr"><input id="d_addr" className={inputCls} maxLength={250} value={f.address} onChange={(e) => set('address', e.target.value)} /></Field>
          {err && <Banner tone="error">{err}</Banner>}
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={busy}>{busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}</PrimaryButton>
            <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          </div>
          <p className="text-xs text-slate-500">The institution name, type and tax ID are what we verified. To change them, email teachformosa@gmail.com.</p>
        </form>
      )}
    </div>
  );
}

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
          <p className="text-sm text-slate-700">You can now post jobs and use “Show contact details” on teacher profiles.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {active < MAX_ACTIVE_POSTS
          ? <a href="#/post-job" className="inline-flex bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold transition">Post a job</a>
          : <Banner tone="warn">You have {MAX_ACTIVE_POSTS} active posts, the maximum. Close one to post another.</Banner>}
        <a href="#/teachers" className="font-bold text-emerald-700 hover:underline">Find teachers →</a>
      </div>

      <SavedList kind="teacher" />

      <DetailsCard reg={reg} onChange={onChange} />

      <div>
        <h2 className="text-lg font-black text-slate-900 mb-1">My posts</h2>
        <p className="text-sm text-slate-500 mb-3">Active posts (live): {active} of {MAX_ACTIVE_POSTS}</p>
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
                  {(j.status === 'rejected' || j.status === 'pending') && j.admin_note && <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{j.admin_note}</p>}
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

  if (session === undefined) return <p className="flex items-center justify-center gap-2 text-slate-200 py-20"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</p>;
  if (!session) return <SignIn onDone={refresh} />;

  const reg = session.registration;
  const signOut = async () => { await school.signOut(); setSession(null); };
  const header = (
    <div className="flex items-center justify-between gap-3 mb-5 text-sm">
      <span className="text-slate-500 break-all">Signed in as <strong className="text-slate-800">{session.email}</strong></span>
      <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 shrink-0"><LogOut className="w-4 h-4" /> Sign out</button>
    </div>
  );
  const pw = <div className="mb-5 -mt-2"><ChangePassword email={session.email} /></div>;

  let body;
  if (!reg || editing) {
    body = <RegistrationForm session={session} existing={reg} onDone={refresh} />;
  } else if (reg.status === 'approved') {
    body = <Dashboard session={session} onChange={refresh} />;
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
      <Panel>{header}{pw}{body}</Panel>
    </PageShell>
  );
}
