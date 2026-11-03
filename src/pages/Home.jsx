import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, MapPin, Building2, Briefcase, CheckCircle2, Sparkles, ChevronDown, Mail, ExternalLink, Loader2,
} from 'lucide-react';
import { listJobs } from '../lib/api';
import { CITIES, SCHOOL_TYPES, fmtDate } from '../lib/constants';
import { Banner } from '../components/ui';

const selectCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white appearance-none transition';

function JobCard({ job }) {
  const [open, setOpen] = useState(false);
  const place = job.district ? `${job.city} (${job.district})` : job.city;
  return (
    <article className="bg-white text-slate-900 border border-white rounded-2xl p-5 sm:p-6 shadow-lg shadow-black/20 hover:shadow-xl transition">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900">{job.title}</h3>
          <p className="text-slate-700 font-medium">{job.school_name}</p>
        </div>
        {job.arc_offered === 'yes' && (
          <span className="inline-flex items-center gap-1.5 self-start bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5" /> ARC sponsorship
          </span>
        )}
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
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
            {job.schedule && <div><dt className="inline font-bold text-slate-900">Hours: </dt><dd className="inline">{job.schedule}</dd></div>}
            {job.start_date && <div><dt className="inline font-bold text-slate-900">Start date: </dt><dd className="inline">{fmtDate(job.start_date)}</dd></div>}
          </dl>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={`mailto:${job.contact_email}?subject=${encodeURIComponent(`Application: ${job.title}`)}`}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-bold transition"
            >
              <Mail className="w-4 h-4" /> Email {job.contact_name}
            </a>
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

  useEffect(() => {
    listJobs().then(setJobs).catch(() => {
      setLoadError("We couldn't load the jobs right now. Please refresh the page in a moment.");
      setJobs([]);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (jobs || []).filter((j) => {
      if (q && ![j.title, j.school_name, j.city, j.district, j.description].some((s) => (s || '').toLowerCase().includes(q))) return false;
      if (selectedLocation !== 'All Locations' && j.city !== selectedLocation) return false;
      if (selectedSchoolType !== 'All School Types' && j.school_type !== selectedSchoolType) return false;
      if (selectedJobType !== 'Full & Part Time' && j.job_type !== selectedJobType && j.job_type !== 'Full or Part-Time') return false;
      if (arcOnly && j.arc_offered !== 'yes') return false;
      return true;
    });
  }, [jobs, searchTerm, selectedLocation, selectedSchoolType, selectedJobType, arcOnly]);

  const reset = () => {
    setSearchTerm(''); setSelectedLocation('All Locations'); setSelectedSchoolType('All School Types');
    setSelectedJobType('Full & Part Time'); setArcOnly(false);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0A1745] via-[#0F2263] to-[#0A1745] overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-white text-emerald-700 text-xs font-semibold mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Teaching jobs & teacher profiles in Taiwan</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Teach English & Launch Your Adventure <br className="hidden sm:inline" />
            in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">Taiwan</span>
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Teachers: tell us about yourself once and let schools come to you. Schools: post a job and reach
            teachers who are ready to work in Taiwan.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            <a href="#/join" className="group rounded-2xl p-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition">
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">For teachers</p>
              <p className="text-2xl font-black mt-1">Create my profile</p>
              <p className="text-sm font-medium mt-1 opacity-80">Photo, visa status, availability – about 3 minutes.</p>
            </a>
            <a href="#/post-job" className="group rounded-2xl p-6 bg-white hover:bg-slate-50 border border-white text-slate-900 shadow-lg shadow-black/20 transition">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">For schools</p>
              <p className="text-2xl font-black mt-1">Post a job</p>
              <p className="text-sm font-medium mt-1 text-slate-600">Describe the role and say if you sponsor ARC.</p>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm font-medium text-slate-300 mt-10">
            {['Every post is reviewed before it goes live', 'ARC sponsorship shown up front', 'Teacher contact details stay private'].map((t) => (
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
                  <input id="q" type="text" placeholder="Title, school, city..." value={searchTerm}
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
                <span className="text-sm font-semibold text-slate-700">Show ARC & Work Permit Provided Only</span>
              </label>
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
              <p className="flex items-center justify-center gap-2 text-slate-400 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading jobs…</p>
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
            {filtered.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        </div>
      </section>
    </>
  );
}
