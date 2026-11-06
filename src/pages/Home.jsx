import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, MapPin, Building2, Navigation, List, Map as MapIcon, Briefcase, CheckCircle2, Sparkles, ChevronDown, Mail, ExternalLink, Loader2,
} from 'lucide-react';
import { listJobs, getJobContact } from '../lib/api';
import { CITIES, SCHOOL_TYPES, CITY_COORDS, fmtDate, mapsUrl } from '../lib/constants';
import { Banner, SaveButton } from '../components/ui';
import { useSaved } from '../lib/useSaved';
import { geocodeBest, readGeoCache, writeGeoCache, sleep } from '../lib/geocode';

const selectCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white appearance-none transition';

const JobsMap = lazy(() => import('../components/JobsMap'));

// One pin per location. Jobs without a placed address appear at their city centre (approximate).
function mapPoints(jobs, geo = {}) {
  const pts = [];
  jobs.forEach((job, ji) => {
    const exact = (job.locations || [])
      .map((l) => (Number.isFinite(l.lat) && Number.isFinite(l.lng) ? l : geo[l.address] ? { ...l, ...geo[l.address] } : null))
      .filter(Boolean);
    if (exact.length) {
      exact.forEach((l, i) => pts.push({ key: `${job.id}-${i}`, lat: l.lat, lng: l.lng, approx: false, label: [l.label, l.address].filter(Boolean).join(' – '), job }));
    } else if (CITY_COORDS[job.city]) {
      const [lat, lng] = CITY_COORDS[job.city];
      const a = (ji * 2.399) % (2 * Math.PI); // small spread so pins in one city do not hide each other
      const r = 0.012 + 0.004 * (ji % 4);
      pts.push({ key: `${job.id}-c`, lat: lat + r * Math.sin(a), lng: lng + r * Math.cos(a), approx: true, label: job.district || '', job });
    }
  });
  return pts;
}

export function JobCard({ job, defaultOpen = false, sv = null }) {
  const [open, setOpen] = useState(defaultOpen);
  const [email, setEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState('');
  const revealEmail = async () => {
    setEmailBusy(true);
    setEmailError('');
    try {
      const e = await getJobContact(job);
      if (e) setEmail(e); else setEmailError('This job is no longer available.');
    } catch {
      setEmailError('Could not load the email address. Please try again in a little while.');
    } finally {
      setEmailBusy(false);
    }
  };
  const place = job.district ? `${job.city} (${job.district})` : job.city;
  return (
    <article id={`job-${job.id}`} className="bg-white text-slate-900 border border-white rounded-2xl p-5 sm:p-6 shadow-lg shadow-black/20 hover:shadow-xl transition">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {job.logo_url && (
            <img src={job.logo_url} alt={`${job.school_name} logo`} loading="lazy"
              className="w-14 h-14 rounded-xl border border-slate-200 bg-white object-contain shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-900">{job.title}</h3>
            <p className="text-slate-700 font-medium">{job.school_name}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          {job.arc_offered === 'yes' && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5" /> Can offer Work Permit (ARC)
            </span>
          )}
          <SaveButton sv={sv} id={job.id} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-700">
        <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg"><MapPin className="w-3.5 h-3.5 text-emerald-600" />{place}</span>
        <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg"><Briefcase className="w-3.5 h-3.5 text-emerald-600" />{job.job_type}</span>
        {job.school_type && <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg"><Building2 className="w-3.5 h-3.5 text-emerald-600" />{job.school_type}</span>}
        {job.salary && <span className="bg-slate-100 px-3 py-1 rounded-lg font-semibold text-slate-900">{job.salary}</span>}
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-4 inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 text-sm font-bold"
      >
        {open ? 'Hide details' : 'View details & how to apply'}
        <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 text-slate-700 text-sm leading-relaxed">
          <p className="whitespace-pre-line">{job.description}</p>
          {job.requirements && (
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Requirements</h4>
              <p className="whitespace-pre-line">{job.requirements}</p>
            </div>
          )}
          {(job.locations || []).length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 mb-1.5">{job.locations.length > 1 ? 'Locations' : 'Location'}</h4>
              <ul className="space-y-2">
                {job.locations.map((l, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      {l.label && <strong className="text-slate-900">{l.label}: </strong>}{l.address}
                    </span>
                    <a href={mapsUrl(l)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold">
                      <Navigation className="w-3.5 h-3.5" /> Open in Google Maps
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
            {job.schedule && <div><dt className="inline font-bold text-slate-900">Hours: </dt><dd className="inline">{job.schedule}</dd></div>}
            {(job.start_asap || job.start_date) && <div><dt className="inline font-bold text-slate-900">Start date: </dt><dd className="inline">{job.start_asap ? 'ASAP' : fmtDate(job.start_date)}</dd></div>}
          </dl>
          <div className="flex flex-wrap gap-3 pt-1">
            {email ? (
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(`Application: ${job.title}`)}`}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-bold transition"
              >
                <Mail className="w-4 h-4" /> Email {job.contact_name} ({email})
              </a>
            ) : (
              <button
                type="button" onClick={revealEmail} disabled={emailBusy}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-bold transition"
              >
                {emailBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Show email to apply
              </button>
            )}
            {emailError && <p role="alert" className="w-full text-sm font-semibold text-red-600">{emailError}</p>}
            {job.apply_link && (
              <a
                href={job.apply_link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-2 border border-slate-300 hover:border-emerald-600 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold transition"
              >
                <ExternalLink className="w-4 h-4" /> Apply online
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function Home() {
  const [jobs, setJobs] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedSchoolType, setSelectedSchoolType] = useState('All School Types');
  const [selectedJobType, setSelectedJobType] = useState('Full & Part Time');
  const [arcOnly, setArcOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const sv = useSaved('job');
  const [view, setView] = useState('list'); // list | map
  const [selectedId, setSelectedId] = useState(null);
  const selectedRef = useRef(null);
  const onSelect = useCallback((id) => setSelectedId(id), []);

  useEffect(() => {
    listJobs().then(setJobs).catch(() => {
      setLoadError("We couldn't load the jobs right now. Please refresh the page in a moment.");
      setJobs([]);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (jobs || []).filter((j) => {
      if (q && ![j.title, j.school_name, j.city, j.district, j.description, ...(j.locations || []).flatMap((l) => [l.label, l.address])].some((s) => (s || '').toLowerCase().includes(q))) return false;
      if (selectedLocation !== 'All Locations' && j.city !== selectedLocation) return false;
      if (selectedSchoolType !== 'All School Types' && j.school_type !== selectedSchoolType) return false;
      if (selectedJobType !== 'Full & Part Time' && j.job_type !== selectedJobType && j.job_type !== 'Full or Part-Time') return false;
      if (arcOnly && j.arc_offered !== 'yes') return false;
      if (savedOnly && sv.enabled && !sv.has(j.id)) return false;
      return true;
    });
  }, [jobs, searchTerm, selectedLocation, selectedSchoolType, selectedJobType, arcOnly, savedOnly, sv]);

  // Ads posted before addresses were placed on the map: look the addresses up now (once, then cached).
  const [geo, setGeo] = useState(readGeoCache);
  useEffect(() => {
    if (view !== 'map' || !jobs) return undefined;
    let stop = false;
    const todo = [...new Set(jobs.flatMap((j) => (j.locations || []).filter((l) => l.address && !Number.isFinite(l.lat) && !(l.address in geo)).map((l) => l.address)))].slice(0, 12);
    (async () => {
      const cache = { ...readGeoCache() };
      for (const addr of todo) {
        if (stop) return;
        const pos = await geocodeBest(addr);
        cache[addr] = pos; // null = could not be found; do not keep retrying
        writeGeoCache(cache);
        if (!stop) setGeo({ ...cache });
        await sleep(1100);
      }
    })();
    return () => { stop = true; };
  }, [view, jobs]); // eslint-disable-line react-hooks/exhaustive-deps

  const points = useMemo(() => mapPoints(filtered, geo), [filtered, geo]);
  const selectedJob = filtered.find((j) => j.id === selectedId) || null;
  useEffect(() => {
    if (selectedJob) selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setSearchTerm(''); setSelectedLocation('All Locations'); setSelectedSchoolType('All School Types');
    setSelectedJobType('Full & Part Time'); setArcOnly(false); setSavedOnly(false);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#1D3A8C] via-[#2A4DB5] to-[#1D3A8C] overflow-hidden">
        {/* soft translucent glows */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-300/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-sky-300/20 blur-3xl" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-white text-emerald-700 text-xs font-semibold mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Free teaching jobs & teacher profiles in Taiwan</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-10 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">Taiwan&apos;s</span> Teaching Jobs <br className="hidden sm:inline" />
            &amp; Teacher Community
          </h1>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            <a href="#/join" className="group rounded-2xl p-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition">
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">For teachers · 100% free</p>
              <p className="text-2xl font-black mt-1">Create my profile</p>
              <p className="text-sm font-medium mt-1 opacity-80">Photo, visa status, availability – about 3 minutes.</p>
            </a>
            <a href="#/post-job" className="group rounded-2xl p-6 bg-white hover:bg-slate-50 border border-white text-slate-900 shadow-lg shadow-black/20 transition">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">For schools · 100% free</p>
              <p className="text-2xl font-black mt-1">Post a job</p>
              <p className="text-sm font-medium mt-1 text-slate-600">Describe the role and say if you can offer a Work Permit (support ARC).</p>
            </a>
          </div>

          <p className="mt-5 text-sm sm:text-base text-white/90">
            Already registered? <a href="#/teacher" className="font-bold underline hover:text-emerald-300">Teachers: log in</a> · <a href="#/school" className="font-bold underline hover:text-emerald-300">Schools: log in</a>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm font-medium text-slate-300 mt-6">
            {['Free for teachers and schools', 'Every school is verified before it can post', 'Work Permit (ARC) support shown up front', 'Teachers\' contact details visible to verified schools only'].map((t) => (
              <div key={t} className="flex items-center space-x-2 bg-white text-slate-800 px-4 py-2 rounded-xl border border-white shadow-md shadow-black/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse jobs */}
      <section id="browse" className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 border border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1.5">
                <label htmlFor="q" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Search Keyword</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input id="q" type="text" placeholder="Title, school, city, street..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="loc" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select id="loc" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className={selectCls}>
                    <option>All Locations</option>
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="st" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">School Type</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select id="st" value={selectedSchoolType} onChange={(e) => setSelectedSchoolType(e.target.value)} className={selectCls}>
                    <option>All School Types</option>
                    {SCHOOL_TYPES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="jt" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Job Type</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select id="jt" value={selectedJobType} onChange={(e) => setSelectedJobType(e.target.value)} className={selectCls}>
                    <option>Full & Part Time</option>
                    <option>Full-Time</option>
                    <option>Part-Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input type="checkbox" checked={arcOnly} onChange={(e) => setArcOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">Can offer Work Permit (support ARC)</span>
              </label>
              {sv.enabled && (
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-600" />
                  <span className="text-sm font-semibold text-slate-700">Only my saved jobs ({sv.count})</span>
                </label>
              )}
              <div className="flex items-center space-x-4 text-sm">
                <button onClick={reset} className="text-slate-500 hover:text-slate-900 font-semibold transition">Reset Filters</button>
                <span className="bg-emerald-50 text-emerald-800 font-bold px-3.5 py-1.5 rounded-xl border border-emerald-100">
                  Showing {filtered.length} {filtered.length === 1 ? 'position' : 'positions'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {loadError && <Banner tone="error">{loadError}</Banner>}
            {jobs === null && (
              <p className="flex items-center justify-center gap-2 text-slate-200 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading jobs…</p>
            )}
            {jobs !== null && filtered.length === 0 && !loadError && (
              <div className="text-center py-12 px-4 bg-white border border-white rounded-2xl shadow-lg shadow-black/20">
                <p className="text-lg font-bold text-slate-900">
                  {jobs.length === 0 ? 'No jobs are posted yet.' : 'No jobs match your filters.'}
                </p>
                <p className="text-slate-600 mt-1">
                  {jobs.length === 0 ? 'Are you a school? Be the first to post one.' : 'Try clearing a filter.'}
                </p>
                {jobs.length === 0 && (
                  <a href="#/post-job" className="inline-block mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold transition">Post a job</a>
                )}
              </div>
            )}
            {jobs !== null && !loadError && jobs.length > 0 && (
              <div className="flex justify-center">
                <div role="tablist" aria-label="How to view jobs" className="inline-flex bg-white rounded-2xl p-1 shadow-lg shadow-black/20">
                  {[['list', 'List', List], ['map', 'Map', MapIcon]].map(([k, label, Icon]) => (
                    <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}
                      className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition ${view === k ? 'bg-emerald-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'}`}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === 'map' && filtered.length > 0 && (
              <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xl shadow-black/20">
                <Suspense fallback={<p className="flex items-center justify-center gap-2 text-slate-500 py-24"><Loader2 className="w-5 h-5 animate-spin" /> Loading map…</p>}>
                  <JobsMap points={points} selectedId={selectedId} onSelect={onSelect} />
                </Suspense>
                <p className="text-xs text-slate-500 mt-2 px-1">
                  Yellow pins are exact addresses; white pins are placed at the city centre because the school has not given an address yet. MRT and rail lines are shown in blue. Click a pin, then “View this ad”.
                </p>
              </div>
            )}

            {view === 'map' && selectedJob && (
              <div ref={selectedRef}><JobCard key={selectedJob.id} job={selectedJob} defaultOpen sv={sv} /></div>
            )}

            {view === 'list' && filtered.map((j) => <JobCard key={j.id} job={j} sv={sv} />)}
          </div>
        </div>
      </section>
    </>
  );
}
