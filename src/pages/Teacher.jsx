import React, { useCallback, useEffect, useState } from 'react';
import { Clock, EyeOff, Eye, Loader2, LogOut, Pencil, Trash2, XCircle, CheckCircle2, User } from 'lucide-react';
import { ChangePassword, Banner, Field, inputCls, PageShell, Panel, PrimaryButton, SecondaryButton } from '../components/ui';
import { teacher, displayName } from '../lib/api';
import SavedList from '../components/SavedList';

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function SignIn({ onDone }) {
  const [mode, setMode] = useState('in');
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
        const r = await teacher.signUp(email.trim(), password);
        if (!r.signedIn) setNote('Account created. Please confirm your email address using the link we sent, then sign in here.');
        else onDone();
      } else {
        await teacher.signIn(email.trim(), password);
        onDone();
      }
    } catch (ex) {
      const m = String(ex?.message || '');
      setErr(
        /already registered|already been registered/i.test(m) ? 'This email already has a login. Please sign in instead.'
          : /not confirmed/i.test(m) ? 'Please confirm your email first: open the email we sent you and tap the link. If it does not work, email teachformosa@gmail.com.'
          : /invalid login/i.test(m) ? 'That email or password is not right.'
          : /rate|too many/i.test(m) ? 'Too many attempts. Please wait a few minutes and try again.'
          : 'Sorry, that did not work. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title="Teachers" subtitle="Log in to update, hide or delete your profile. New here? Create a login first, then your profile, which goes live straight away. It's free.">
      <Panel>
        <div className="flex flex-wrap gap-2 mb-5" role="tablist">
          {[['in', 'I already have a login'], ['up', 'Create a login']].map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setErr(''); setNote(''); }}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition ${mode === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'}`}>{l}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4 max-w-md">
          <Field label="Email" htmlFor="t_email">
            <input id="t_email" type="email" className={inputCls} value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" htmlFor="t_pw" hint={mode === 'up' ? 'At least 8 characters.' : undefined}>
            <input id="t_pw" type="password" className={inputCls} value={password} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {err && <Banner tone="error">{err}</Banner>}
          {note && <Banner tone="ok">{note}</Banner>}
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'up' ? 'Create login' : 'Log in'}
          </PrimaryButton>
        </form>
        <div className="mt-6 pt-5 border-t border-slate-200 text-sm text-slate-600 space-y-1">
          <p>Already sent a profile before there were logins? Create a login with the <strong>same email</strong>, then email <a className="underline font-semibold" href="mailto:teachformosa@gmail.com">teachformosa@gmail.com</a> and we will connect it to your login.</p>
        </div>
      </Panel>
    </PageShell>
  );
}

export default function Teacher() {
  const [session, setSession] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const refresh = useCallback(() => teacher.session().then(setSession).catch(() => setSession(null)), []);
  useEffect(() => { refresh(); }, [refresh]);

  if (session === undefined) return <p className="flex items-center justify-center gap-2 text-slate-200 py-20"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</p>;
  if (!session) return <SignIn onDone={refresh} />;

  const p = session.profile;
  const act = async (fn) => {
    setBusy(true);
    setErr('');
    try { await fn(); await refresh(); } catch { setErr('That did not work. Please try again.'); } finally { setBusy(false); }
  };
  const signOut = async () => { await teacher.signOut(); setSession(null); };
  const remove = () => {
    if (window.confirm('Delete your profile permanently? Schools will no longer see it. This cannot be undone.')) act(() => teacher.remove(p));
  };

  let state = null;
  if (p) {
    state = p.status === 'approved'
      ? (p.hidden
        ? { icon: EyeOff, tone: 'bg-slate-100 border-slate-300', title: 'Your profile is hidden', text: 'Schools cannot see it. Show it again whenever you want.' }
        : { icon: CheckCircle2, tone: 'bg-emerald-50 border-emerald-200', title: 'Your profile is live', text: 'Schools can find you on “Find teachers” and contact you directly. Sign in at least once every 30 days to stay visible.' })
      : p.status === 'pending'
        ? { icon: Clock, tone: 'bg-amber-50 border-amber-200', title: 'Your profile is offline', text: 'It is not visible to schools at the moment. Email teachformosa@gmail.com if you think this is a mistake.' }
        : { icon: XCircle, tone: 'bg-red-50 border-red-200', title: 'Your profile has been taken offline', text: 'Please read our note below, or email teachformosa@gmail.com.' };
  }

  return (
    <PageShell title="My profile">
      <Panel>
        <div className="flex items-center justify-between gap-3 mb-5 text-sm">
          <span className="text-slate-500 break-all">Signed in as <strong className="text-slate-800">{session.email}</strong></span>
          <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 shrink-0"><LogOut className="w-4 h-4" /> Sign out</button>
        </div>
        <div className="mb-5 -mt-2"><ChangePassword email={session.email} /></div>

        {!p ? (
          <div className="text-center py-6 space-y-3">
            <User className="w-12 h-12 text-slate-400 mx-auto" />
            <h2 className="text-2xl font-black">You have not created a profile yet</h2>
            <p className="text-slate-600 max-w-md mx-auto">It's free and takes about 3 minutes. It goes live as soon as you send it.</p>
            <a href="#/join" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition">Create my profile</a>
          </div>
        ) : (
          <div className="space-y-5">
            <div className={`flex items-start gap-3 rounded-2xl border p-4 ${state.tone}`}>
              <state.icon className="w-7 h-7 shrink-0 text-slate-700" />
              <div>
                <p className="font-black text-slate-900">{state.title}</p>
                <p className="text-sm text-slate-700">{state.text}</p>
              </div>
            </div>
            {p.admin_note && p.status !== 'approved' && (
              <Banner tone="warn"><strong>Message from us:</strong><br /><span className="whitespace-pre-line">{p.admin_note}</span></Banner>
            )}

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-slate-400" />}
              </div>
              <div>
                <p className="font-black text-slate-900">{displayName(p.full_name)}</p>
                <p className="text-sm text-slate-600">{p.nationality} · {p.cities?.join(', ')}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="#/teacher/edit" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold transition"><Pencil className="w-4 h-4" /> Edit my profile</a>
              {p.status === 'approved' && (
                <SecondaryButton disabled={busy} onClick={() => act(() => teacher.setFlags(p, { hidden: !p.hidden }))} className="!py-2.5">
                  {p.hidden ? <><Eye className="w-4 h-4" /> Show my profile</> : <><EyeOff className="w-4 h-4" /> Hide my profile</>}
                </SecondaryButton>
              )}
              <SecondaryButton disabled={busy} onClick={remove} className="!py-2.5 !text-red-700 !border-red-200 hover:!border-red-500"><Trash2 className="w-4 h-4" /> Delete my profile</SecondaryButton>
            </div>
            <p className="text-sm text-slate-500">Changes go live straight away. Your email, phone and intro video are visible to verified schools only, so they can contact you directly.</p>

            {!p.share_contact_with_schools && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
                <p className="text-sm text-slate-800">
                  <strong>One thing to confirm:</strong> on TeachFormosa, verified schools contact teachers directly. Please confirm that verified schools may see your
                  email, phone and intro video. Until you do, schools cannot see your contact details.
                </p>
                <PrimaryButton disabled={busy} onClick={() => act(() => teacher.setFlags(p, { share_contact_with_schools: true }))} className="!py-2.5">I agree</PrimaryButton>
              </div>
            )}
            {err && <Banner tone="error">{err}</Banner>}
          </div>
        )}
        <div className="mt-8 pt-6 border-t border-slate-200"><SavedList kind="job" /></div>
      </Panel>
    </PageShell>
  );
}
