import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  Field, Chips, Choice, ComboInput, inputCls, PrimaryButton, SecondaryButton, Panel, PageShell, Banner,
} from '../components/ui';
import {
  CITIES, SUBJECTS, EDUCATION, CERTIFICATES, EXPERIENCE, VISA_STATUSES, isVideoLink, COUNTRIES, ARC_NEEDS, DAYS, SLOTS,
} from '../lib/constants';
import { submitTeacher, teacher } from '../lib/api';
import { resizeImage } from '../lib/image';

const STEPS = ['About you', 'Taiwan & visa', 'Availability'];

const initial = {
  full_name: '', email: '', phone: '', nationality: '', native_english: '',
  education: '', certificates: [], experience: '', subjects: [], bio: '', video_url: '',
  in_taiwan: '', visa_status: '', stay_until: '', arrival_date: '', needs_arc: '', cities: [],
  job_types: [], available_from: '', available_until: '', availability: {}, availability_notes: {},
  consent: false, share_contact_with_schools: false, website: '', // "website" is a hidden trap for spam bots
};

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function validate(step, f) {
  const e = {};
  if (step === 0) {
    if (f.full_name.trim().length < 2) e.full_name = 'Please enter your full name.';
    if (!emailOk(f.email.trim())) e.email = 'Please enter a valid email address.';
    if (!f.nationality.trim()) e.nationality = 'Please enter your nationality / passport country.';
    if (!f.native_english) e.native_english = 'Please choose one.';
    if (!f.education) e.education = 'Please choose your highest education.';
    if (!f.experience) e.experience = 'Please choose your teaching experience.';
    if (f.subjects.length === 0) e.subjects = 'Pick at least one age group or subject.';
    if (f.video_url.trim() && !isVideoLink(f.video_url)) e.video_url = 'Please paste a YouTube or Google Drive link (starting with https://).';
    if (f.bio.trim().length < 20) e.bio = 'Please write at least a couple of sentences about yourself.';
  }
  if (step === 1) {
    if (!f.in_taiwan) e.in_taiwan = 'Please choose one.';
    if (f.in_taiwan === 'yes') {
      if (!f.visa_status) e.visa_status = 'Please choose your current visa / permit.';
      if (!f.stay_until) e.stay_until = 'Please enter the date your current permit or visa ends.';
    }
    if (!f.needs_arc) e.needs_arc = 'Please choose one.';
    if (f.cities.length === 0) e.cities = 'Pick at least one place you would work.';
  }
  if (step === 2) {
    if (f.job_types.length === 0) e.job_types = 'Pick full-time, part-time, or both.';
    if (!f.available_from) e.available_from = 'Please enter the date you can start.';
    if (f.available_until && f.available_from && f.available_until < f.available_from) e.available_until = 'This date must be after the date you can start.';
    if (!f.consent) e.consent = 'Please tick the box to continue.';
  }
  return e;
}

const fromProfile = (p) => ({
  ...initial,
  full_name: p.full_name || '', email: p.email || '', phone: p.phone || '', nationality: p.nationality || '',
  native_english: p.native_english || '', education: p.education || '', certificates: p.certificates || [],
  experience: p.experience || '', subjects: p.subjects || [], bio: p.bio || '', video_url: p.video_url || '',
  in_taiwan: p.in_taiwan ? 'yes' : 'no', visa_status: p.visa_status || '', stay_until: p.stay_until || '',
  arrival_date: p.arrival_date || '', needs_arc: p.needs_arc || '', cities: p.cities || [], job_types: p.job_types || [],
  available_from: p.available_from || '', available_until: p.available_until || '',
  availability: p.availability || {}, availability_notes: p.availability_notes || {},
  consent: true, share_contact_with_schools: true,
});

export default function TeacherForm({ editing = false }) {
  const [me, setMe] = useState(undefined); // signed-in teacher session (or null)
  const [step, setStep] = useState(0);
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState({});
  const [photo, setPhoto] = useState(null); // { blob, preview }
  const [photoError, setPhotoError] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);
  const top = useRef(null);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    teacher.session().then((s) => {
      setMe(s);
      if (editing && s?.profile) setF(fromProfile(s.profile));
      else if (s?.email) setF((p) => ({ ...p, email: p.email || s.email }));
    }).catch(() => setMe(null));
  }, [editing]);
  useEffect(() => () => photo && URL.revokeObjectURL(photo.preview), [photo]);

  const scrollTop = () => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    try {
      const blob = await resizeImage(file);
      setPhoto({ blob, preview: URL.createObjectURL(blob) });
    } catch (err) {
      setPhotoError(err.message);
    }
  };

  const toggleSlot = (day, slot) => {
    const cur = f.availability[day] || [];
    const next = cur.includes(slot) ? cur.filter((s) => s !== slot) : [...cur, slot];
    set('availability', { ...f.availability, [day]: next });
  };

  const next = () => {
    const e = validate(step, f);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setStep(step + 1);
      setTimeout(scrollTop, 0);
    }
  };

  const submit = async () => {
    const e = validate(2, f);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitError('');
    if (f.website) { // bot filled the hidden field: pretend it worked
      setDone(true);
      return;
    }
    setBusy(true);
    try {
      const inTaiwan = f.in_taiwan === 'yes';
      const cleanAvailability = Object.fromEntries(
        Object.entries(f.availability).filter(([, v]) => v.length > 0),
      );
      const payload = {
          full_name: f.full_name.trim(),
          email: f.email.trim(),
          phone: f.phone.trim() || null,
          nationality: f.nationality.trim(),
          native_english: f.native_english,
          education: f.education,
          certificates: f.certificates,
          experience: f.experience,
          subjects: f.subjects,
          bio: f.bio.trim(),
          video_url: f.video_url.trim() || null,
          cities: f.cities,
          in_taiwan: inTaiwan,
          visa_status: inTaiwan ? f.visa_status : null,
          stay_until: inTaiwan ? f.stay_until || null : null,
          arrival_date: !inTaiwan ? f.arrival_date || null : null,
          needs_arc: f.needs_arc,
          job_types: f.job_types,
          available_from: f.available_from || null,
          available_until: f.available_until || null,
          availability: cleanAvailability,
          availability_notes: Object.fromEntries(
            DAYS.map((d) => [d.key, (f.availability_notes[d.key] || '').trim()]).filter(([, v]) => v),
          ),
          consent: true,
          share_contact_with_schools: true, // required: verified schools contact teachers directly
      };
      if (editing) await teacher.update(me.profile, payload, photo?.blob || null);
      else await submitTeacher(payload, photo?.blob || null);
      setDone(true);
      setTimeout(scrollTop, 0);
    } catch (err) {
      setSubmitError(
        err?.code === 'P0001' && err.message
          ? err.message
          : 'Sorry, something went wrong and your profile was not sent. Please try again in a moment. ' + (err?.message ? `(${err.message})` : ''),
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
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <h2 className="text-2xl font-black">{editing ? 'Your changes are saved' : 'Your profile is live!'}</h2>
            <p className="text-slate-600 max-w-md mx-auto">
              {editing
                ? 'The changes are visible to schools straight away.'
                : 'Schools can find you now and contact you directly.'} Sign in at least once a month to keep your profile visible. We
              will remind you at <strong>{f.email}</strong> before it is hidden.
            </p>
            <a href="#/teacher" className="inline-block text-emerald-700 font-bold hover:underline">
              {'Back to my profile →'}
            </a>
          </div>
        </Panel>
      </PageShell>
    );
  }

  if (editing && me === undefined) return <p className="flex items-center justify-center gap-2 text-slate-200 py-20"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</p>;
  if (editing && !me?.profile) {
    return (
      <PageShell title="Edit your profile">
        <Panel>
          <div className="text-center py-6 space-y-3">
            <p className="text-slate-700">Please log in to edit your profile.</p>
            <a href="#/teacher" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition">Log in</a>
          </div>
        </Panel>
      </PageShell>
    );
  }
  if (!editing && me === undefined) return <p className="flex items-center justify-center gap-2 text-slate-200 py-20"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</p>;
  if (!editing && !me) {
    return (
      <PageShell title="Create your teacher profile" subtitle="Free. First create a login, so you can update or hide your profile whenever you like.">
        <Panel>
          <div className="text-center py-6 space-y-3">
            <p className="text-slate-700 max-w-md mx-auto">It takes a minute: an email and a password. Then you can fill in your profile, and it goes live straight away.</p>
            <a href="#/teacher" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition">Create a login / log in</a>
          </div>
        </Panel>
      </PageShell>
    );
  }
  if (!editing && me?.profile) {
    return (
      <PageShell title="You already have a profile">
        <Panel>
          <div className="text-center py-6 space-y-3">
            <p className="text-slate-700">Each login has one profile. You can update it, hide it or delete it.</p>
            <a href="#/teacher" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition">Go to my profile</a>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={editing ? 'Edit your profile' : 'Create your teacher profile'}
      subtitle={editing ? 'Your changes are visible to schools as soon as you save.' : 'Free, and it takes about 3 minutes. Your profile goes live as soon as you send it.'}
    >
      <div ref={top} />
      <Panel>
        {/* progress */}
        <ol className="flex items-center gap-2 mb-6" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <p className={`mt-1.5 text-xs font-bold ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>
                {i + 1}. {s}
              </p>
            </li>
          ))}
        </ol>

        <div className="space-y-6">
          {step === 0 && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                  {photo || (editing && me?.profile?.photo_url) ? (
                    <img src={photo ? photo.preview : me.profile.photo_url} alt="Your profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="inline-block cursor-pointer bg-slate-900 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition">
                    {photo || (editing && me?.profile?.photo_url) ? 'Change photo' : 'Add a photo'}
                    <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
                  </label>
                  <p className="text-sm text-slate-500">Optional, but profiles with a friendly photo get more attention.</p>
                  {photoError && <p role="alert" className="text-sm font-semibold text-red-600">{photoError}</p>}
                </div>
              </div>

              <Field label="Full name" required error={errors.full_name} htmlFor="full_name"
                hint="Schools only see your first name and last initial (for example “Jane S.”).">
                <input id="full_name" className={inputCls} value={f.full_name} autoComplete="name"
                  onChange={(e) => set('full_name', e.target.value)} />
              </Field>

              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Email" required error={errors.email} htmlFor="email" hint="Private – never shown publicly.">
                  <input id="email" type="email" inputMode="email" className={inputCls} value={f.email}
                    autoComplete="email" onChange={(e) => set('email', e.target.value)} />
                </Field>
                <Field label="Phone / LINE / WhatsApp" htmlFor="phone" hint="Optional and private.">
                  <input id="phone" className={inputCls} value={f.phone} autoComplete="tel"
                    onChange={(e) => set('phone', e.target.value)} />
                </Field>
              </div>

              <Field label="Country of origin (nationality / passport country)" required error={errors.nationality} htmlFor="nationality"
                hint="Start typing and pick your country from the list.">
                <ComboInput id="nationality" value={f.nationality} placeholder="e.g. Canada" options={COUNTRIES}
                  onChange={(v) => set('nationality', v)} />
              </Field>

              <Field label="Is English your first language?" required error={errors.native_english} group>
                <Choice
                  options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                  value={f.native_english} onChange={(v) => set('native_english', v)}
                />
              </Field>

              <Field label="Highest education" required error={errors.education} htmlFor="education">
                <select id="education" className={inputCls} value={f.education} onChange={(e) => set('education', e.target.value)}>
                  <option value="">Choose…</option>
                  {EDUCATION.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>

              <Field label="Teaching certificates" group hint="Choose all that apply.">
                <Chips multi options={CERTIFICATES} value={f.certificates} onChange={(v) => set('certificates', v)} />
              </Field>

              <Field label="Teaching experience" required error={errors.experience} htmlFor="experience">
                <select id="experience" className={inputCls} value={f.experience} onChange={(e) => set('experience', e.target.value)}>
                  <option value="">Choose…</option>
                  {EXPERIENCE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              <Field label="What do you want to teach?" required error={errors.subjects} group hint="Choose all that apply.">
                <Chips multi options={SUBJECTS} value={f.subjects} onChange={(v) => set('subjects', v)} />
              </Field>

              <Field label="A short introduction" required error={errors.bio} htmlFor="bio"
                hint="Tell schools about your teaching style and background.">
                <textarea id="bio" rows={5} maxLength={1200} className={inputCls} value={f.bio}
                  onChange={(e) => set('bio', e.target.value)} />
                <p className="text-xs text-slate-400 text-right">{f.bio.length}/1200</p>
              </Field>

              <Field label="Intro video link" error={errors.video_url} htmlFor="video_url"
                hint="Optional. Paste a link to a short video of you (YouTube or Google Drive). Only verified schools can open it (see the tick box at the bottom). For Google Drive, set sharing to “Anyone with the link”.">
                <input id="video_url" type="url" inputMode="url" className={inputCls} value={f.video_url} maxLength={300}
                  placeholder="https://youtube.com/…  or  https://drive.google.com/…"
                  onChange={(e) => set('video_url', e.target.value)} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Are you already in Taiwan?" required error={errors.in_taiwan} group>
                <Choice
                  options={[
                    { value: 'yes', label: "Yes, I'm in Taiwan now" },
                    { value: 'no', label: 'No, I would be coming from abroad' },
                  ]}
                  value={f.in_taiwan} onChange={(v) => set('in_taiwan', v)}
                />
              </Field>

              {f.in_taiwan === 'yes' && (
                <>
                  <Field label="What is your current visa / permit?" required error={errors.visa_status} group>
                    <Choice options={VISA_STATUSES} value={f.visa_status} onChange={(v) => set('visa_status', v)} />
                  </Field>
                  <Field label="Until when can you stay?" required error={errors.stay_until} htmlFor="stay_until"
                    hint="The date your current visa or ARC expires.">
                    <input id="stay_until" type="date" className={inputCls} value={f.stay_until}
                      onChange={(e) => set('stay_until', e.target.value)} />
                  </Field>
                </>
              )}

              {f.in_taiwan === 'no' && (
                <Field label="When could you arrive in Taiwan?" htmlFor="arrival_date" hint="Optional. A rough date is fine.">
                  <input id="arrival_date" type="date" className={inputCls} value={f.arrival_date}
                    onChange={(e) => set('arrival_date', e.target.value)} />
                </Field>
              )}

              <Field label="Do you need a school to sponsor your work permit & ARC?" required error={errors.needs_arc} group>
                <Choice options={ARC_NEEDS} value={f.needs_arc} onChange={(v) => set('needs_arc', v)} />
              </Field>

              <Field label="Where would you like to work?" required error={errors.cities} group hint="Choose all that apply.">
                <Chips multi options={CITIES} value={f.cities} onChange={(v) => set('cities', v)} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="What kind of job are you looking for?" required error={errors.job_types} group>
                <Chips multi options={['Full-Time', 'Part-Time']} value={f.job_types} onChange={(v) => set('job_types', v)} />
              </Field>

              <Field label="When can you start?" required error={errors.available_from} htmlFor="available_from">
                <input id="available_from" type="date" className={inputCls} value={f.available_from}
                  onChange={(e) => set('available_from', e.target.value)} />
              </Field>

              <Field label="Until when are you available in Taiwan?" error={errors.available_until} htmlFor="available_until"
                hint="Optional. If you plan to leave Taiwan, enter the date. Leave it empty if you have no end date.">
                <input id="available_until" type="date" className={inputCls} value={f.available_until} min={f.available_from || undefined}
                  onChange={(e) => set('available_until', e.target.value)} />
              </Field>

              <Field label="Which times are you available each week?" group
                hint="Tap the boxes for the times you can teach. Skip this if you're fully flexible.">
                <div className="overflow-x-auto -mx-1 px-1">
                  <table className="w-full text-sm border-separate border-spacing-1">
                    <thead>
                      <tr>
                        <th />
                        {DAYS.map((d) => <th key={d.key} className="font-bold text-slate-600 pb-1">{d.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {SLOTS.map((s) => (
                        <tr key={s.key}>
                          <th scope="row" className="text-left font-semibold text-slate-700 pr-2 whitespace-nowrap">
                            {s.label}
                            <span className="block text-[11px] font-normal text-slate-400">{s.hint}</span>
                          </th>
                          {DAYS.map((d) => {
                            const on = (f.availability[d.key] || []).includes(s.key);
                            return (
                              <td key={d.key}>
                                <button
                                  type="button"
                                  aria-pressed={on}
                                  aria-label={`${d.label} ${s.label}`}
                                  onClick={() => toggleSlot(d.key, s.key)}
                                  className={`w-full h-11 min-w-[2.5rem] rounded-lg border transition ${
                                    on ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-50 border-slate-300 hover:border-emerald-600'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Field>

              <Field label="Exact hours for each day" group
                hint="Optional. Add a line for each day you want to give details for, up to 7 lines. For example: 9:00–12:00 and 18:00–21:00.">
                <div className="space-y-2">
                  {DAYS.map((d) => (
                    <div key={d.key} className="flex items-center gap-3">
                      <label htmlFor={`avail_${d.key}`} className="w-12 shrink-0 text-sm font-bold text-slate-700">{d.label}</label>
                      <input id={`avail_${d.key}`} className={inputCls} maxLength={80} placeholder="e.g. 9:00–12:00, 18:00–21:00"
                        value={f.availability_notes[d.key] || ''}
                        onChange={(e) => set('availability_notes', { ...f.availability_notes, [d.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </Field>

              {/* Hidden spam trap: real people never see or fill this in */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
                <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></label>
              </div>

              <div className="space-y-2">
                <Banner tone="info">
                  <strong>Shown to everyone:</strong> first name + last initial, photo, nationality, education,
                  experience, introduction, visa status &amp; whether you need ARC sponsorship, where you're based, and
                  availability. <strong>Never shown publicly:</strong> your full name, email, phone and intro video link.
                </Banner>
                <Banner tone="warn">
                  <strong>Visible to verified schools only:</strong> your email, phone / LINE and intro video link, so that schools can contact
                  you directly. We check every institution before it can see them, each view is recorded, and the public never sees them.
                  You can delete your profile at any time.
                </Banner>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
                  <span className="text-sm text-slate-700">
                    I agree to show the public details above on this website, to let verified schools see my email, phone and intro video, and I confirm the information is true. I have read the <a href="#/legal" target="_blank" rel="noreferrer" className="underline font-semibold">Terms &amp; Privacy</a>.
                  </span>
                </label>
                {errors.consent && <p role="alert" className="text-sm font-semibold text-red-600">{errors.consent}</p>}
              </div>

              {submitError && <Banner tone="error">{submitError}</Banner>}
            </>
          )}
        </div>

        {Object.keys(errors).length > 0 && (
          <p role="alert" className="mt-5 text-sm font-semibold text-red-600">Please fix the highlighted items above.</p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <SecondaryButton onClick={() => { setErrors({}); setStep(step - 1); setTimeout(scrollTop, 0); }}>
              <ChevronLeft className="w-5 h-5" /> Back
            </SecondaryButton>
          ) : <span />}

          {step < STEPS.length - 1 ? (
            <PrimaryButton onClick={next}>Next <ChevronRight className="w-5 h-5" /></PrimaryButton>
          ) : (
            <PrimaryButton onClick={submit} disabled={busy}>
              {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : editing ? 'Save changes' : 'Publish my profile'}
            </PrimaryButton>
          )}
        </div>
      </Panel>
    </PageShell>
  );
}
