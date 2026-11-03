import React, { useState } from 'react';
import { Search, MapPin, Building2, Briefcase, CheckCircle2, Sparkles, Filter, ChevronRight, User, Plus, Award } from 'lucide-react';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedSchoolType, setSelectedSchoolType] = useState('All School Types');
  const [selectedJobType, setSelectedJobType] = useState('Full & Part Time');
  const [arcOnly, setArcOnly] = useState(false);

  const jobs = [
    { id: 1, title: "Senior ESL & Literature Instructor", school: "Taipei International Academy", location: "Taipei City (Xinyi)", type: "Full-Time", schoolType: "International School", salary: "NT$85k - 110k / mo", arc: true, verified: true },
    { id: 2, title: "English Conversation Teacher", school: "Global Bridge Cram School", location: "Taichung City (West Dist)", type: "Full-Time", schoolType: "Cram School (Buxiban)", salary: "NT$70k - 90k / mo", arc: true, verified: true },
    { id: 3, title: "Young Learner Specialist", school: "Sunshine Kids Bilingual School", location: "Kaohsiung City (Zuoying)", type: "Full & Part Time", schoolType: "Bilingual Kindergarten", salary: "NT$65k - 85k / mo", arc: true, verified: true },
    { id: 4, title: "High School IELTS Coach", school: "Apex Elite Test Prep", location: "Taipei City (Da'an)", type: "Part-Time", schoolType: "Test Prep Center", salary: "NT$800 - 1,200 / hr", arc: false, verified: true },
    { id: 5, title: "Elementary Homeroom Teacher", school: "New Taipei Municipal Bilingual Program", location: "New Taipei City (Banqiao)", type: "Full-Time", schoolType: "Public School", salary: "NT$75k - 95k / mo", arc: true, verified: true },
    { id: 6, title: "Creative Writing & Drama Teacher", school: "Formosa Arts & English Hub", location: "Hsinchu City", type: "Full-Time", schoolType: "Language Center", salary: "NT$70k - 88k / mo", arc: true, verified: true },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/60 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Award className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-none">
                TEACHER HUNTER <span className="text-emerald-400">TAIWAN</span>
              </span>
              <span className="text-[10px] font-medium tracking-widest text-slate-400 uppercase mt-1 block">
                #1 TEFL & ENGLISH TEACHING JOB PORTAL
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="#browse" className="text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 transition">Browse Jobs</a>
            <a href="#guides" className="text-slate-300 hover:text-white transition">Teacher Guides</a>
            <a href="#schools" className="text-slate-300 hover:text-white transition">For Schools / Recruiters</a>
          </nav>

          {/* Action CTA Buttons */}
          <div className="flex items-center space-x-3">
            <button className="hidden sm:flex items-center space-x-2 border border-slate-700 hover:border-emerald-500 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Post a Job</span>
            </button>
            <button className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition">
              <User className="w-4 h-4" />
              <span>Quick Apply</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#090d16] overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-semibold mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Taiwan's Premier ESL Recruitment Hub 2026</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Teach English & Launch Your Adventure <br className="hidden sm:inline" />
            in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Taiwan</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with vetted cram schools, public schools, and international academies across Taipei, Taichung, Kaohsiung & beyond. Full visa (ARC) sponsorship guaranteed.
          </p>

          {/* Feature Check Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm font-medium text-slate-300 mb-12">
            <div className="flex items-center space-x-2 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100+ Verified Schools</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ARC Work Permit Guaranteed</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>NT$65k - 110k Monthly Salary</span>
            </div>
          </div>
        </div>

        {/* Floating Filter Card Container */}
        <div className="max-w-5xl mx-auto relative z-20">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 border border-slate-100">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              
              {/* Keyword Search */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Search Keyword</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Title, school, city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white appearance-none transition"
                  >
                    <option>All Locations</option>
                    <option>Taipei City</option>
                    <option>Taichung City</option>
                    <option>Kaohsiung City</option>
                    <option>New Taipei City</option>
                    <option>Hsinchu City</option>
                  </select>
                </div>
              </div>

              {/* School Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">School Type</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select
                    value={selectedSchoolType}
                    onChange={(e) => setSelectedSchoolType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white appearance-none transition"
                  >
                    <option>All School Types</option>
                    <option>International School</option>
                    <option>Cram School (Buxiban)</option>
                    <option>Bilingual Kindergarten</option>
                    <option>Public School</option>
                  </select>
                </div>
              </div>

              {/* Job Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Job Type</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white appearance-none transition"
                  >
                    <option>Full & Part Time</option>
                    <option>Full-Time</option>
                    <option>Part-Time</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Bottom Filter Options */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={arcOnly}
                  onChange={(e) => setArcOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-semibold text-slate-700">Show ARC & Work Permit Provided Only</span>
              </label>

              <div className="flex items-center space-x-4 text-sm">
                <button
                  onClick={() => { setSearchTerm(''); setSelectedLocation('All Locations'); setSelectedSchoolType('All School Types'); setSelectedJobType('Full & Part Time'); setArcOnly(false); }}
                  className="text-slate-500 hover:text-slate-900 font-semibold transition"
                >
                  Reset Filters
                </button>
                <span className="bg-emerald-50 text-emerald-800 font-bold px-3.5 py-1.5 rounded-xl border border-emerald-100">
                  Showing {jobs.length} positions
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer / Branding Note */}
      <footer className="py-8 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>© 2026 Teacher Hunter Taiwan. All rights reserved. Vetted ESL Employment Portal.</p>
      </footer>
    </div>
  );
}
