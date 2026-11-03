import React, { useRef, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Field, Chips, Choice, inputCls, PrimaryButton, Panel, PageShell, Banner } from '../components/ui';
import { CITIES, SCHOOL_TYPES, JOB_TYPES } from '../lib/constants';
import { submitJob } from '../lib/api';

const initial = {
  school_name: '', school_type: '', contact_name: '', contact_email: '', apply_link: '',
  title: '', city: '', district: '', job_type: '', salary: '', arc_offered: '',
  start_date: '', schedule: '', description: '', requirements: '',
  consent: false, website: '',
};

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const linkOk = (v) => /^https?:\/\/\S+\.\S+/i.test(v);

function validate(f) {
  const e = {};
  if (f.school_name.trim().length < 2) e.school_name = 'Please enter the school or company name.';
  if (!f.school_type) e.school_type = 'Please choose a school type.';
  if (f.contact_name.trim().length < 2) e.contact_name = 'Please enter a contact person.';
  if (!emailOk(f.contact_email.trim())) e.contact_email = 'Please enter a valid email address.';
  if (f.apply_link.trim() && !linkOk(f.apply_link.trim())) e.apply_link = 'Links should start with https://';
  if (f.title.trim().length < 3) e.title = 'Please enter a job title.';
  if (!f.city) e.city = 'Please choose a city.';
  if (!f.job_type) e.job_type = 'Please choose one.';
  if (!f.salary.trim()) e.salary = 'Please enter the pay (for example NT$70,000–90,000 / month).';
  if (!f.arc_offered) e.arc_offered = 'Please choose one – teachers look for this first.';
  if (f.description.trim().length < 30) e.description = 'Please describe the job in a few sentences.';
  if (!f.consent) e.consent = 'Please tick the box to continue.';
  return e;
}

export default function JobForm() {
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);
  const top = useRef(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

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
      await submitJob({
        school_name: f.school_name.trim(),
        school_type: f.school_type,
        contact_name: f.contact_name.trim(),
        contact_email: f.contact_email.trim(),
        apply_link: f.apply_link.trim() || null,
        title: f.title.trim(),
        city: f.city,
        district: f.district.trim() || null,
        job_type: f.job_type,
        salary: f.salary.trim(),
        arc_offered: f.arc_offered,
        start_date: f.start_date || null,
        schedule: f.schedule.trim() || null,
        description: f.description.trim(),
        requirements: f.requirements.trim() || null,
        consent: true,
      });
      setDone(true);
      setTimeout(() => top.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch (err) {
      setSubmitError(
        'Sorry, something went wrong and your job was not sent. Please try again in a moment. ' +
          (err?.message ? `(${err.message})` : ''),
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
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-black">Your job post has been sent for review</h2>
            <p className="text-slate-600 max-w-md mx-auto">
              We check every post before it goes live. We may email <strong>{f.contact_email}</strong> if we need
              anything else.
            </p>
            <a href="#/teachers" className="inline-block text-emerald-700 font-bold hover:underline">
              Meanwhile, browse teacher profiles →
            </a>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell title="Post a teaching job" subtitle="Takes about 3 minutes. Your post goes live after we've checked it.">
      <div ref={top} />
      <Panel>
        <div className="space-y-6">
          <h2 className="text-lg font-black text-slate-900">About your school</h2>

          <Field label="School / company name" required error={errors.school_name} htmlFor="school_name">
            <input id="school_name" className={inputCls} value={f.school_name} onChange={(e) => set('school_name', e.target.value)} />
          </Field>

          <Field label="Type of school" required error={errors.school_type} htmlFor="school_type">
            <select id="school_type" className={inputCls} value={f.school_type} onChange={(e) => set('school_type', e.target.value)}>
              <option value="">Choose…</option>
              {SCHOOL_TYPES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>

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

          <Field label="Job type" required error={errors.job_type} group>
            <Chips options={JOB_TYPES} value={f.job_type} onChange={(v) => set('job_type', v)} />
          </Field>

          <Field label="Pay" required error={errors.salary} htmlFor="salary">
            <input id="salary" className={inputCls} value={f.salary} placeholder="e.g. NT$70,000–90,000 / month, or NT$700–900 / hour"
              onChange={(e) => set('salary', e.target.value)} />
          </Field>

          <Field label="Will your school sponsor the work permit & ARC?" required error={errors.arc_offered} group>
            <Choice
              options={[
                { value: 'yes', label: 'Yes – we sponsor the work permit and ARC' },
                { value: 'no', label: 'No – candidates must already be able to work in Taiwan' },
              ]}
              value={f.arc_offered} onChange={(v) => set('arc_offered', v)}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Start date" htmlFor="start_date" hint="Optional">
              <input id="start_date" type="date" className={inputCls} value={f.start_date}
                onChange={(e) => set('start_date', e.target.value)} />
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
                I'm allowed to recruit on behalf of this school, and I agree to show these details publicly.
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
              {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : 'Send job post for review'}
            </PrimaryButton>
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
