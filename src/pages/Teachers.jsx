import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, GraduationCap, Briefcase, Plane, ShieldCheck, X, CheckCircle2, User, Play } from 'lucide-react';
import { listTeachers, submitInquiry } from '../lib/api';
import {
  CITIES, SUBJECTS, EXPERIENCE, EDUCATION, VISA_STATUSES, VISA_SHORT, CERTIFICATES, DAYS, SLOTS, isVideoLink, normalizeCountry, fmtDate, fmtMonth, experienceLabel,
} from '../lib/constants';
import { AvailabilityMini, Banner, Field, inputCls, PrimaryButton, SecondaryButton } from '../components/ui';

const selectCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition';

const EXP_ORDER = ['0', '1', '1-2', '3-5', '6-10', '10+'];
const CHECKS = [
  ['in', 'In Taiwan now'],
  ['native', 'Native English speaker'],
  ['legal', 'Can already work legally (no ARC sponsorship needed)'],
  ['needsArc', 'Needs ARC sponsorship'],
  ['license', 'Has a teaching license (home country)'],
  ['cert', 'Has TEFL / TESOL / CELTA'],
  ['video', 'Has an intro video'],
  ['now', 'Available to start now'],
  ['full', 'Looking for full-time'],
  ['part', 'Looking for part-time'],
];

const arcText = { yes: 'Needs ARC sponsorship', no: 'Can already work legally', unsure: 'ARC sponsorship: not sure yet' };

function InquiryModal({ teacher, onClose }) {
  const [f, setF] = useState({ from_name: '', school: '', from_email: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async () => {
    const e = {};
    if (f.from_name.trim().length < 2) e.from_name = 'Please enter your name.';
    if (f.school.trim().length < 2) e.school = 'Please enter your school.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.from_email.trim())) e.from_email = 'Please enter a valid email.';
    if (f.message.trim().length < 5) e.message = 'Please write a short message.';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (f.website) { setSent(true); return; }
    setBusy(true);
    setErr('');
    try {
      await submitInquiry({
        teacher_id: teacher.id,
        from_name: f.from_name.trim(),
        school: f.school.trim(),
        from_email: f.from_email.trim(),
        message: f.message.trim(),
      });
      setSent(true);
    } catch {
      setErr('Sorry, your message was not sent. Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={`Request an introduction to ${teacher.display_name}`}>
      <div className="bg-white text-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-black">Contact {teacher.display_name}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-slate-100"><X className="w-6 h-6" /></button>
        </div>

        {sent ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="font-bold text-lg">Message sent</p>
            <p className="text-slate-600">We'll pass your message on to the teacher and they can reply to you directly.</p>
            <SecondaryButton onClick={onClose}>Close</SecondaryButton>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              To protect teachers' privacy, messages go through us first. We'll forward yours.
            </p>
            <Field label="Your name" required error={errors.from_name} htmlFor="iq_name">
              <input id="iq_name" className={inputCls} value={f.from_name} onChange={(e) => set('from_name', e.target.value)} />
            </Field>
            <Field label="School" required error={errors.school} htmlFor="iq_school">
              <input id="iq_school" className={inputCls} value={f.school} onChange={(e) => set('school', e.target.value)} />
            </Field>
            <Field label="Your email" required error={errors.from_email} htmlFor="iq_email">
              <input id="iq_email" type="email" className={inputCls} value={f.from_email} onChange={(e) => set('from_email', e.target.value)} />
            </Field>
            <Field label="Message" required error={errors.message} htmlFor="iq_msg" hint="Say a little about the job and how to reach you.">
              <textarea id="iq_msg" rows={4} maxLength={2000} className={inputCls} value={f.message} onChange={(e) => set('message', e.target.value)} />
            </Field>
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
              <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></label>
            </div>
            {err && <Banner tone="error">{err}</Banner>}
            <div className="flex justify-end gap-3">
              <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
              <PrimaryButton onClick={submit} disabled={busy}>
                {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : 'Send message'}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherCard({ t, onContact }) {
  const where = t.cities?.length ? t.cities.join(', ') : '';
  return (
    <article className="bg-white text-slate-900 border border-white rounded-2xl p-5 sm:p-6 shadow-lg shadow-black/20 hover:shadow-xl transition">
      <div className="flex gap-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          {t.photo_url ? (
            <img src={t.photo_url} alt={`Photo of ${t.display_name}`} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-slate-400" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-black text-slate-900">{t.display_name}</h3>
          <p className="text-slate-700 text-sm">{t.nationality}{t.native_english === 'yes' ? ' · Native English speaker' : ''}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${t.needs_arc === 'yes' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
              <ShieldCheck className="w-3.5 h-3.5" /> {arcText[t.needs_arc] || 'ARC: not specified'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
              <Plane className="w-3.5 h-3.5 text-emerald-600" />
              {t.in_taiwan
                ? `In Taiwan${t.visa_status ? ` · ${VISA_SHORT[t.visa_status] || ''}` : ''}${t.stay_until ? ` · until ${fmtMonth(t.stay_until)}` : ''}`
                : `Coming from abroad${t.arrival_date ? ` · from ${fmtMonth(t.arrival_date)}` : ''}`}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-slate-700 text-sm leading-relaxed whitespace-pre-line">{t.bio}</p>
      {t.video_url && isVideoLink(t.video_url) && (
        <a href={t.video_url} target="_blank" rel="noopener noreferrer nofollow"
          className="mt-3 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold transition">
          <Play className="w-4 h-4 text-emerald-400" /> Watch intro video
        </a>
      )}

      <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700">
        {t.education && <p className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />{t.education}</p>}
        {t.experience && <p className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />{experienceLabel(t.experience)}</p>}
        {where && <p className="flex items-center gap-2 sm:col-span-2"><MapPin className="w-4 h-4 text-emerald-600 shrink-0" />Wants to work in: {where}</p>}
      </div>

      {(t.subjects?.length > 0 || t.certificates?.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...(t.subjects || []), ...(t.certificates || []).filter((c) => c !== 'None yet')].map((s) => (
            <span key={s} className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">{s}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {(t.job_types || []).join(' / ') || 'Availability'}
            {t.available_from ? ` · can start ${fmtDate(t.available_from)}` : ''}
          </p>
          {Object.keys(t.availability || {}).length > 0 && (
            <AvailabilityMini availability={t.availability} days={DAYS} slots={SLOTS} />
          )}
        </div>
        <PrimaryButton onClick={() => onContact(t)} className="sm:self-end">Contact this teacher</PrimaryButton>
      </div>

      {DAYS.some((d) => t.availability_notes?.[d.key]) && (
        <dl className="mt-3 text-sm text-slate-700 grid grid-cols-[3rem_1fr] gap-x-3 gap-y-0.5">
          {DAYS.filter((d) => t.availability_notes?.[d.key]).map((d) => (
            <React.Fragment key={d.key}>
              <dt className="font-bold text-slate-900">{d.label}</dt>
              <dd>{t.availability_notes[d.key]}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
    </article>
  );
}

export default function Teachers() {
  const [teachers, setTeachers] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [city, setCity] = useState('All Locations');
  const [country, setCountry] = useState('Any');
  const [subject, setSubject] = useState('Any');
  const [education, setEducation] = useState('any');
  const [visa, setVisa] = useState('any');
  const [days, setDays] = useState([]);
  const [slot, setSlot] = useState('any');
  const [minExp, setMinExp] = useState('any');
  const [checks, setChecks] = useState({});
  const [contacting, setContacting] = useState(null);

  useEffect(() => {
    listTeachers().then(setTeachers).catch(() => {
      setLoadError("We couldn't load teacher profiles right now. Please refresh in a moment.");
      setTeachers([]);
    });
  }, []);

  // Countries that actually appear in approved profiles (case-insensitive, shown in the form people used)
  const countries = useMemo(() => {
    const seen = new Map();
    (teachers || []).forEach((t) => {
      const n = normalizeCountry(t.nationality);
      if (n && !seen.has(n.toLowerCase())) seen.set(n.toLowerCase(), n);
    });
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [teachers]);

  const toggle = (k) => setChecks((c) => ({ ...c, [k]: !c[k] }));
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(
    () =>
      (teachers || []).filter((t) => {
        if (city !== 'All Locations' && !(t.cities || []).includes(city) && !(t.cities || []).includes('Other / Flexible')) return false;
        if (country !== 'Any' && normalizeCountry(t.nationality) !== country) return false;
        if (education !== 'any' && EDUCATION.indexOf(t.education) < EDUCATION.indexOf(education)) return false;
        if (visa !== 'any' && !(t.in_taiwan && t.visa_status === visa)) return false;
        if (days.length || slot !== 'any') {
          // Free on every ticked day, and (if chosen) at that time of day.
          const wanted = days.length ? days : DAYS.map((d) => d.key);
          const free = (d) => (t.availability?.[d] || []).length > 0 && (slot === 'any' || (t.availability[d] || []).includes(slot));
          if (!(days.length ? wanted.every(free) : wanted.some(free))) return false;
        }
        if (subject !== 'Any' && !(t.subjects || []).includes(subject)) return false;
        if (minExp !== 'any' && EXP_ORDER.indexOf(t.experience) < EXP_ORDER.indexOf(minExp)) return false;
        if (checks.in && !t.in_taiwan) return false;
        if (checks.license && !(t.certificates || []).includes('Teaching license (home country)')) return false;
        if (checks.native && t.native_english !== 'yes') return false;
        if (checks.legal && t.needs_arc !== 'no') return false;
        if (checks.needsArc && t.needs_arc !== 'yes') return false;
        if (checks.cert && !(t.certificates || []).includes('TEFL / TESOL / CELTA')) return false;
        if (checks.video && !(t.video_url && isVideoLink(t.video_url))) return false;
        if (checks.now && !(t.available_from && t.available_from <= today)) return false;
        if (checks.full && !(t.job_types || []).includes('Full-Time')) return false;
        if (checks.part && !(t.job_types || []).includes('Part-Time')) return false;
        return true;
      }),
    [teachers, city, country, subject, education, visa, days, slot, minExp, checks, today],
  );

  const reset = () => { setCity('All Locations'); setCountry('Any'); setSubject('Any'); setEducation('any'); setVisa('any'); setDays([]); setSlot('any'); setMinExp('any'); setChecks({}); };

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-14 bg-gradient-to-b from-[#0F2263] to-[#0A1745]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">Find teachers</h1>
        <p className="text-slate-300 text-lg mb-8">Every profile has been reviewed. Contact details stay private – we'll forward your message.</p>

        <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="f_country" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Country of origin</label>
              <select id="f_country" className={selectCls} value={country} onChange={(e) => setCountry(e.target.value)}>
                <option>Any</option>
                {countries.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="f_city" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Wants to work in</label>
              <select id="f_city" className={selectCls} value={city} onChange={(e) => setCity(e.target.value)}>
                <option>All Locations</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="f_subject" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Age group / subject</label>
              <select id="f_subject" className={selectCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option>Any</option>
                {SUBJECTS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="f_exp" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Teaching experience</label>
              <select id="f_exp" className={selectCls} value={minExp} onChange={(e) => setMinExp(e.target.value)}>
                <option value="any">Any</option>
                {EXPERIENCE.slice(1).map((o) => <option key={o.value} value={o.value}>{o.label.replace(/^Under 1 year$/, 'Any experience')} or more</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1.5">
              <label htmlFor="f_edu" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Education</label>
              <select id="f_edu" className={selectCls} value={education} onChange={(e) => setEducation(e.target.value)}>
                <option value="any">Any</option>
                {EDUCATION.map((o) => <option key={o} value={o}>{o}{o === 'PhD' ? '' : ' or higher'}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="f_visa" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Visa / permit (in Taiwan)</label>
              <select id="f_visa" className={selectCls} value={visa} onChange={(e) => setVisa(e.target.value)}>
                <option value="any">Any</option>
                {VISA_STATUSES.map((o) => <option key={o.value} value={o.value}>{VISA_SHORT[o.value]}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="f_slot" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Time of day</label>
              <select id="f_slot" className={selectCls} value={slot} onChange={(e) => setSlot(e.target.value)}>
                <option value="any">Any time</option>
                {SLOTS.map((o) => <option key={o.key} value={o.key}>{o.label} ({o.hint})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Free on</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Days available">
                {DAYS.map((d) => {
                  const on = days.includes(d.key);
                  return (
                    <button key={d.key} type="button" aria-pressed={on}
                      onClick={() => setDays((cur) => (on ? cur.filter((x) => x !== d.key) : [...cur, d.key]))}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition ${on ? 'bg-emerald-500 border-emerald-600 text-slate-950' : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-emerald-600'}`}>
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <fieldset className="mt-5 pt-4 border-t border-slate-100">
            <legend className="sr-only">Filter by</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              {CHECKS.map(([k, label]) => (
                <label key={k} className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={!!checks[k]} onChange={() => toggle(k)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button type="button" onClick={reset} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Reset filters</button>
            </div>
          </fieldset>
        </div>

        <div className="space-y-4">
          {loadError && <Banner tone="error">{loadError}</Banner>}
          {teachers === null && (
            <p className="flex items-center justify-center gap-2 text-slate-400 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading profiles…</p>
          )}
          {teachers !== null && !loadError && (
            <p className="text-sm font-semibold text-slate-400">{filtered.length} {filtered.length === 1 ? 'teacher' : 'teachers'}</p>
          )}
          {teachers !== null && filtered.length === 0 && !loadError && (
            <div className="text-center py-12 px-4 bg-white border border-white rounded-2xl shadow-lg shadow-black/20">
              <p className="text-lg font-bold text-slate-900">
                {teachers.length === 0 ? 'No teacher profiles are live yet.' : 'No teachers match these filters.'}
              </p>
              {teachers.length === 0 && (
                <>
                  <p className="text-slate-600 mt-1">Are you a teacher? Create your profile.</p>
                  <a href="#/join" className="inline-block mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold transition">Create my profile</a>
                </>
              )}
            </div>
          )}
          {filtered.map((t) => <TeacherCard key={t.id} t={t} onContact={setContacting} />)}
        </div>
      </div>

      {contacting && <InquiryModal teacher={contacting} onClose={() => setContacting(null)} />}
    </section>
  );
}
