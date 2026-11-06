import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Loader2, ImagePlus, MapPin, Plus, Trash2, BadgeCheck, Lock } from 'lucide-react';
import { Field, Chips, Choice, inputCls, PrimaryButton, Panel, PageShell, Banner } from '../components/ui';
import { CITIES, JOB_TYPES, isGoogleMapsLink } from '../lib/constants';
import { resizeImage } from '../lib/image';
import { geocodeBest } from '../lib/geocode';
import { submitJob, school } from '../lib/api';

const initial = {
  school_name: '', school_type: '', contact_name: '', contact_email: '', apply_link: '',
  title: '', city: '', district: '', job_type: '', hourly_min: '', hourly_max: '', monthly_min: '', monthly_max: '', arc_offered: '',
  start_date: '', start_asap: false, schedule: '', description: '', requirements: '',
  consent: false, website: '',
};
const num = (v) => { const n = parseInt(String(v).replace(/[^\d]/g, ''), 10); return Number.isFinite(n) ? n : null; };
const nt = (n) => `NT$${n.toLocaleString('en-US')}`;
// Pay is mandatory: an hourly range, a monthly range, or both. Part-time needs hourly, full-time needs monthly.
export function payCheck(f) {
  const hMin = num(f.hourly_min), hMax = num(f.hourly_max), mMin = num(f.monthly_min), mMax = num(f.monthly_max);
  const anyH = !!(f.hourly_min || f.hourly_max), anyM = !!(f.monthly_min || f.monthly_max);
  const okH = hMin != null && hMax != null && hMax >= hMin;
  const okM = mMin != null && mMax != null && mMax >= mMin;
  if ((anyH && !okH) || (anyM && !okM)) return { error: 'Please give both a lowest and a highest figure (the highest can be the same), and make sure the highest is not lower.' };
  if (f.job_type === 'Part-Time' && !okH) return { error: 'Part-time jobs need an hourly pay range, for example NT$600 to NT$1,000 per hour.' };
  if (f.job_type === 'Full-Time' && !okM) return { error: 'Full-time jobs need a monthly pay range, for example NT$55,000 to NT$75,000 per month.' };
  if (!okH && !okM) return { error: 'Please enter the pay: an hourly range, a monthly range, or both.' };
  const bits = [];
  const range = (a, b) => (a === b ? nt(a) : `${nt(a)}–${nt(b).replace('NT$', '')}`);
  if (okH) bits.push(`${range(hMin, hMax)} / hour`);
  if (okM) bits.push(`${range(mMin, mMax)} / month`);
  return { text: bits.join(' · '), hMin: okH ? hMin : null, hMax: okH ? hMax : null, mMin: okM ? mMin : null, mMax: okM ? mMax : null };
}
const blankLoc = () => ({ label: '', address: '', maps_url: '' });
const MAX_LOCATIONS = 3;

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const linkOk = (v) => /^https?:\/\/\S+\.\S+/i.test(v);

function validate(f) {
  const e = {};
  f.locations.forEach((l, i) => {
    const any = l.label.trim() || l.address.trim() || l.maps_url.trim();
    if (!any) return;
    if (l.address.trim().length < 5) e[`loc${i}`] = 'Please enter the address (or remove this location).';
    else if (l.maps_url.trim() && !isGoogleMapsLink(l.maps_url)) e[`loc${i}`] = 'That does not look like a Google Maps link. Leave it empty and we will use the address.';
  });
  if (f.contact_name.trim().length < 2) e.contact_name = 'Please enter a contact person.';
  if (!emailOk(f.contact_email.trim())) e.contact_email = 'Please enter a valid email address.';
  if (f.apply_link.trim() && !linkOk(f.apply_link.trim())) e.apply_link = 'Links should start with https://';
  if (f.title.trim().length < 3) e.title = 'Please enter a job title.';
  if (!f.city) e.city = 'Please choose a city.';
  if (!f.job_type) e.job_type = 'Please choose one.';
  const pay = payCheck(f);
  if (pay.error) e.salary = pay.error;
  if (!f.arc_offered) e.arc_offered = 'Please choose one – teachers look for this first.';
  if (f.description.trim().length < 30) e.description = 'Please describe the job in a few sentences.';
  if (!f.consent) e.consent = 'Please tick the box to continue.';
  return e;
}

export default function JobForm() {
  const [f, setF] = useState({ ...initial, locations: [blankLoc()] });
  const [logo, setLogo] = useState(null);
  const [logoError, setLogoError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);
  const [held, setHeld] = useState('');
  const top = useRef(null);
  const [session, setSession] = useState(undefined); // undefined = still checking
  useEffect(() => {
    school.session().then((s) => {
      setSession(s);
      const r = s?.registration;
      if (r?.status === 'approved') {
        setF((p) => ({ ...p, school_name: r.institution_name, school_type: r.institution_type || 'Other', contact_name: r.contact_name || '', contact_email: s.email || '' }));
      }
    }).catch(() => setSession(null));
  }, []);
  const reg = session?.registration?.status === 'approved' ? session.registration : null;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setLoc = (i, k, v) => setF((p) => ({ ...p, locations: p.locations.map((l, n) => (n === i ? { ...l, [k]: v } : l)) }));
  const addLoc = () => setF((p) => (p.locations.length < MAX_LOCATIONS ? { ...p, locations: [...p.locations, blankLoc()] } : p));
  const removeLoc = (i) => setF((p) => ({ ...p, locations: p.locations.length > 1 ? p.locations.filter((_, n) => n !== i) : [blankLoc()] }));

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLogoError('');
    try {
      const blob = await resizeImage(file, 500, 0.9); // never larger than 500 x 500 px
      setLogo({ blob, preview: URL.createObjectURL(blob) });
    } catch (err) {
      setLogoError(err.message);
    }
  };

  const submit = async () => {
    const e = validate(f);
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitError('');
    if (f.website) {
      setDone(true);
      return;
    }
    setBusy(true);
    try {
      // Place each address on the map (best effort; never blocks sending).
      const locations = [];
      for (const l of f.locations.filter((x) => x.address.trim()).slice(0, MAX_LOCATIONS)) {
        const pos = await geocodeBest(l.address);
        locations.push({ label: l.label.trim(), address: l.address.trim(), maps_url: l.maps_url.trim(), ...(pos || {}) });
        if (locations.length < f.locations.length) await new Promise((r) => setTimeout(r, 1100)); // be polite: 1 request/second
      }
      await submitJob({
        school_id: reg.id,
        school_name: f.school_name.trim(),
        school_type: f.school_type,
        contact_name: f.contact_name.trim(),
        contact_email: f.contact_email.trim(),
        apply_link: f.apply_link.trim() || null,
        title: f.title.trim(),
        city: f.city,
        district: f.district.trim() || null,
        job_type: f.job_type,
        salary: payCheck(f).text,
        pay_hourly_min: payCheck(f).hMin, pay_hourly_max: payCheck(f).hMax,
        pay_monthly_min: payCheck(f).mMin, pay_monthly_max: payCheck(f).mMax,
        arc_offered: f.arc_offered,
        start_asap: f.start_asap,
        start_date: f.start_asap ? null : f.start_date || null,
        schedule: f.schedule.trim() || null,
        description: f.description.trim(),
        requirements: f.requirements.trim() || null,
        locations: locations,
        consent: true,
      }, logo?.blob || null);
      // The automatic check may have put it on hold: tell the school straight away.
      try {
        const mine = await school.myJobs(reg);
        if (mine[0] && mine[0].status !== 'approved') setHeld(mine[0].admin_note || 'Your post is waiting for a quick check by our team. It will be visible soon.');
      } catch { /* ignore */ }
      setDone(true);
      setTimeout(() => top.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch (err) {
      // P0001 = a rule of ours (duplicate or too many posts): show its plain-English message as it is.
      setSubmitError(
        err?.code === 'P0001' && err.message
          ? err.message
          : 'Sorry, something went wrong and your job was not sent. Please try again in a moment. ' + (err?.message ? `(${err.message})` : ''),
      );
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <PageShell title="Thank you!">
        <div ref={top} />
        <Panel>
          <div className="text-center py-6 space-y-4">
            {held ? <Clock className="w-14 h-14 text-amber-500 mx-auto" /> : <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />}
            <h2 className="text-2xl font-black">{held ? 'Saved, but not visible yet' : 'Your job post is live!'}</h2>
            {held ? (
              <p className="text-slate-700 max-w-md mx-auto whitespace-pre-line">{held}</p>
            ) : (
              <p className="text-slate-600 max-w-md mx-auto">
                Teachers can see it now, including the contact details you entered. Applications will come to <strong>{f.contact_email}</strong>.</p>
            )}
            <p className="text-sm text-slate-500">You can close this post at any time from your school page.</p>
            <a href="#/school" className="inline-block text-emerald-700 font-bold hover:underline">
              Go to my posts →
            </a>
          </div>
        </Panel>
      </PageShell>
    );
  }

  if (session === undefined) {
    return <p className="flex items-center justify-center gap-2 text-slate-200 py-20"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</p>;
  }
  if (!reg) {
    const state = session?.registration?.status;
    return (
      <PageShell title="Post a teaching job" subtitle="Posting is free. Only verified institutions can post jobs, and registering is free too.">
        <Panel>
          <div className="text-center py-6 space-y-4">
            <Lock className="w-12 h-12 text-slate-400 mx-auto" />
            <h2 className="text-2xl font-black">
              {!session ? 'Please sign in or register your institution first' : state === 'pending' ? 'We are still checking your registration' : state === 'rejected' ? 'Your registration needs changes' : 'Please register your institution first'}
            </h2>
            <p className="text-slate-600 max-w-md mx-auto">
              We verify every school, kindergarten, cram school and company, so teachers can trust the jobs they see – and so teachers can safely share their contact details.
            </p>
            <a href="#/school" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition">
              {!session ? 'Sign in / register' : 'Go to my school page'}
            </a>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell title="Post a teaching job" subtitle="Takes about 3 minutes. Your post goes live as soon as you send it. Each institution can have up to 3 active posts at a time.">
      <div ref={top} />
      <Panel>
        <div className="space-y-6">
          <h2 className="text-lg font-black text-slate-900">About your school</h2>

          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
            <BadgeCheck className="w-7 h-7 text-emerald-600 shrink-0" />
            <div>
              <p className="font-black text-slate-900">{f.school_name}</p>
              <p className="text-sm text-slate-600">{f.school_type} · verified institution. To change the name, email teachformosa@gmail.com.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Contact person" required error={errors.contact_name} htmlFor="contact_name">
              <input id="contact_name" className={inputCls} value={f.contact_name} autoComplete="name"
                onChange={(e) => set('contact_name', e.target.value)} />
            </Field>
            <Field label="Contact email" required error={errors.contact_email} htmlFor="contact_email"
              hint="Shown on the job post so teachers can apply.">
              <input id="contact_email" type="email" inputMode="email" className={inputCls} value={f.contact_email}
                autoComplete="email" onChange={(e) => set('contact_email', e.target.value)} />
            </Field>
          </div>

          <Field label="School logo" htmlFor="logo" hint="Optional. Shown on your job post. We shrink it to fit within 500 × 500 pixels.">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {logo ? <img src={logo.preview} alt="Your logo" className="w-full h-full object-contain" /> : <ImagePlus className="w-7 h-7 text-slate-400" />}
              </div>
              <div className="space-y-2">
                <label className="inline-block cursor-pointer border border-slate-300 hover:border-emerald-600 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold transition">
                  {logo ? 'Choose a different logo' : 'Upload logo'}
                  <input id="logo" type="file" accept="image/*" className="sr-only" onChange={onLogo} />
                </label>
                {logo && (
                  <button type="button" onClick={() => setLogo(null)} className="block text-sm font-semibold text-slate-500 hover:text-red-600">Remove</button>
                )}
              </div>
            </div>
            {logoError && <p role="alert" className="text-sm font-semibold text-red-600 mt-2">{logoError}</p>}
          </Field>

          <Field label="Application link" error={errors.apply_link} htmlFor="apply_link"
            hint="Optional – your website or application form.">
            <input id="apply_link" type="url" inputMode="url" className={inputCls} value={f.apply_link} placeholder="https://"
              onChange={(e) => set('apply_link', e.target.value)} />
          </Field>

          <hr className="border-slate-200" />
          <h2 className="text-lg font-black text-slate-900">About the job</h2>

          <Field label="Job title" required error={errors.title} htmlFor="title">
            <input id="title" className={inputCls} value={f.title} placeholder="e.g. English Conversation Teacher"
              onChange={(e) => set('title', e.target.value)} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="City" required error={errors.city} htmlFor="city">
              <select id="city" className={inputCls} value={f.city} onChange={(e) => set('city', e.target.value)}>
                <option value="">Choose…</option>
                {CITIES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="District / area" htmlFor="district" hint="Optional, e.g. Xinyi">
              <input id="district" className={inputCls} value={f.district} onChange={(e) => set('district', e.target.value)} />
            </Field>
          </div>

          <Field label="Where will the teacher work?" group
            hint={`Optional. Add up to ${MAX_LOCATIONS} locations (for example your branches). Teachers can search by location and open each one in Google Maps.`}>
            <div className="space-y-4">
              {f.locations.map((l, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-600" /> Location {i + 1}</p>
                    {(f.locations.length > 1 || l.address || l.label || l.maps_url) && (
                      <button type="button" onClick={() => removeLoc(i)} className="text-sm font-semibold text-slate-500 hover:text-red-600 inline-flex items-center gap-1">
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    )}
                  </div>
                  <input aria-label={`Location ${i + 1} name`} className={inputCls} placeholder="Branch name (optional), e.g. Zhongshan branch"
                    maxLength={80} value={l.label} onChange={(e) => setLoc(i, 'label', e.target.value)} />
                  <input aria-label={`Location ${i + 1} address`} className={inputCls} placeholder="Address, e.g. No. 1, Zhongshan N. Rd., Taipei"
                    maxLength={200} value={l.address} onChange={(e) => setLoc(i, 'address', e.target.value)} />
                  <input aria-label={`Location ${i + 1} Google Maps link`} type="url" inputMode="url" className={inputCls}
                    placeholder="Google Maps link (optional) – https://maps.app.goo.gl/…"
                    maxLength={300} value={l.maps_url} onChange={(e) => setLoc(i, 'maps_url', e.target.value)} />
                  {errors[`loc${i}`] && <p role="alert" className="text-sm font-semibold text-red-600">{errors[`loc${i}`]}</p>}
                </div>
              ))}
              {f.locations.length < MAX_LOCATIONS && (
                <button type="button" onClick={addLoc} className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 text-sm font-bold">
                  <Plus className="w-4 h-4" /> Add another location
                </button>
              )}
              <p className="text-xs text-slate-500">
                Tip: in Google Maps, open your school, tap <strong>Share</strong> and copy the link. No link? No problem, we make one from the address.
              </p>
            </div>
          </Field>

          <Field label="Job type" required error={errors.job_type} group>
            <Chips options={JOB_TYPES} value={f.job_type} onChange={(v) => set('job_type', v)} />
          </Field>

          <Field label="Pay (required)" required error={errors.salary} group
            hint="Show a range, for example NT$600 to NT$1,000 per hour for part-time, or NT$55,000 to NT$75,000 per month for full-time. Part-time needs hourly, full-time needs monthly, and you can give both.">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">Per hour (NT$){f.job_type === 'Part-Time' ? ' *' : ''}</p>
                <div className="flex items-center gap-2">
                  <input id="hourly_min" inputMode="numeric" aria-label="Hourly pay from" className={inputCls} placeholder="from 600" value={f.hourly_min} onChange={(e) => set('hourly_min', e.target.value)} />
                  <span className="text-slate-500">to</span>
                  <input id="hourly_max" inputMode="numeric" aria-label="Hourly pay up to" className={inputCls} placeholder="up to 1,000" value={f.hourly_max} onChange={(e) => set('hourly_max', e.target.value)} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">Per month (NT$){f.job_type === 'Full-Time' ? ' *' : ''}</p>
                <div className="flex items-center gap-2">
                  <input id="monthly_min" inputMode="numeric" aria-label="Monthly pay from" className={inputCls} placeholder="from 55,000" value={f.monthly_min} onChange={(e) => set('monthly_min', e.target.value)} />
                  <span className="text-slate-500">to</span>
                  <input id="monthly_max" inputMode="numeric" aria-label="Monthly pay up to" className={inputCls} placeholder="up to 75,000" value={f.monthly_max} onChange={(e) => set('monthly_max', e.target.value)} />
                </div>
              </div>
            </div>
          </Field>

          <Field label="Can your school offer a Work Permit (support ARC)?" required error={errors.arc_offered} group>
            <Choice
              options={[
                { value: 'yes', label: 'Yes – we can offer a Work Permit and support the ARC' },
                { value: 'no', label: 'No – candidates must already be able to work in Taiwan' },
              ]}
              value={f.arc_offered} onChange={(v) => set('arc_offered', v)}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Start date" htmlFor="start_date" hint="Optional">
              <input id="start_date" type="date" className={`${inputCls} disabled:opacity-50`} value={f.start_asap ? '' : f.start_date}
                disabled={f.start_asap} onChange={(e) => set('start_date', e.target.value)} />
              <label className="mt-2 flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={f.start_asap} onChange={(e) => set('start_asap', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">As soon as possible (ASAP)</span>
              </label>
            </Field>
            <Field label="Working hours" htmlFor="schedule" hint="Optional, e.g. Mon–Fri 2–9 pm">
              <input id="schedule" className={inputCls} value={f.schedule} onChange={(e) => set('schedule', e.target.value)} />
            </Field>
          </div>

          <Field label="Job description" required error={errors.description} htmlFor="description">
            <textarea id="description" rows={6} maxLength={4000} className={inputCls} value={f.description}
              onChange={(e) => set('description', e.target.value)} />
          </Field>

          <Field label="Requirements" htmlFor="requirements" hint="Optional – degree, certificates, experience, etc.">
            <textarea id="requirements" rows={4} maxLength={3000} className={inputCls} value={f.requirements}
              onChange={(e) => set('requirements', e.target.value)} />
          </Field>

          <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></label>
          </div>

          <div className="space-y-2">
            <Banner tone="info">
              The job details, school name, contact person and contact email will be shown publicly once approved.
            </Banner>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
              <span className="text-sm text-slate-700">
                I'm allowed to recruit on behalf of this school, and I agree to show these details publicly. I have read the <a href="#/legal" target="_blank" rel="noreferrer" className="underline font-semibold">Terms &amp; Privacy</a>.
              </span>
            </label>
            {errors.consent && <p role="alert" className="text-sm font-semibold text-red-600">{errors.consent}</p>}
          </div>

          {submitError && <Banner tone="error">{submitError}</Banner>}
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="text-sm font-semibold text-red-600">Please fix the highlighted items above.</p>
          )}

          <div className="flex justify-end">
            <PrimaryButton onClick={submit} disabled={busy}>
              {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : 'Publish job post'}
            </PrimaryButton>
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
