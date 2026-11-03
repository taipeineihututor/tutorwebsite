import React, { useState } from 'react';
import { 
  Search, MapPin, Briefcase, DollarSign, Award, Clock, 
  Building2, ChevronRight, CheckCircle2, ShieldCheck, 
  FileText, PlusCircle, Filter, Sparkles, BookOpen, UserCheck, X 
} from 'lucide-react';

const INITIAL_JOBS = [
  {
    id: 1,
    title: "Full-Time ESL & Science Teacher",
    school: "Taipei American Cram School",
    schoolType: "Cram School / Buxiban",
    location: "Taipei",
    district: "Da'an District",
    salary: "NT$ 75,000 - 88,000 / month",
    type: "Full-Time",
    hours: "22 hrs/week",
    arc: true,
    insurance: true,
    experience: "1+ Years",
    degreeRequired: "Bachelor's Degree",
    nativeOnly: true,
    description: "We are seeking an energetic English teacher to join our primary ESL & STEM program in central Taipei. Interactive curriculum provided with small class sizes (max 14 students).",
    postedDate: "2 days ago",
    badge: "Featured"
  },
  {
    id: 2,
    title: "Bilingual Elementary School Educator",
    school: "Hsinchu International Academy",
    schoolType: "International School",
    location: "Hsinchu",
    district: "East District",
    salary: "NT$ 90,000 - 110,000 / month",
    type: "Full-Time",
    hours: "25 hrs/week",
    arc: true,
    insurance: true,
    experience: "2+ Years (Teaching Cert Required)",
    degreeRequired: "Bachelor's or Master's",
    nativeOnly: false,
    description: "State-certified teachers wanted for bilingual elementary curriculum in Hsinchu Science Park area. Excellent housing allowance and yearly airfare reimbursement provided.",
    postedDate: "1 day ago",
    badge: "Urgent Hiring"
  },
  {
    id: 3,
    title: "Part-Time After-School Tutor",
    school: "Kangaroo Kids English Institute",
    schoolType: "Cram School / Buxiban",
    location: "Taichung",
    district: "Xitun District",
    salary: "NT$ 700 - 850 / hour",
    type: "Part-Time",
    hours: "12 hrs/week",
    arc: false,
    insurance: true,
    experience: "Entry Level Welcome",
    degreeRequired: "Bachelor's Degree",
    nativeOnly: true,
    description: "Flexible afternoon and evening hours ideal for teachers looking to supplement their income or work part-time in Taichung.",
    postedDate: "3 days ago",
    badge: "Flexible Hours"
  },
  {
    id: 4,
    title: "Public High School Foreign English Teacher (FET)",
    school: "Kaohsiung Department of Education",
    schoolType: "Public School",
    location: "Kaohsiung",
    district: "Lingya District",
    salary: "NT$ 72,000 - 95,000 / month",
    type: "Full-Time",
    hours: "20 hrs/week",
    arc: true,
    insurance: true,
    experience: "1 Year",
    degreeRequired: "Bachelor's Degree + TEFL/TESOL",
    nativeOnly: true,
    description: "Official TFETP public school recruitment program. Includes contract completion bonus, health insurance, paid summer & winter holidays.",
    postedDate: "4 days ago",
    badge: "Government Program"
  }
];

export default function App() {
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSchoolType, setSelectedSchoolType] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.school.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || job.location === selectedLocation;
    const matchesType = selectedType === 'All' || job.type === selectedType;
    const matchesSchoolType = selectedSchoolType === 'All' || job.schoolType.includes(selectedSchoolType);
    
    return matchesSearch && matchesLocation && matchesType && matchesSchoolType;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 text-white p-2.5 rounded-xl shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">Tutors<span className="text-red-600">Recruit</span></span>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">Taiwan Teaching Jobs</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsPostJobOpen(true)}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-md hover:shadow-lg"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Post a Job</span>
            </button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-2 bg-white/10 text-red-300 text-xs font-semibold px-4 py-1.5 rounded-full border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified ARC & Public School Jobs in Taiwan
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Find Your Dream Teaching Job in Taiwan
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Explore hundreds of verified English teaching positions, cram school (Buxiban) openings, and international school careers across Taipei, Taichung, Kaohsiung & beyond.
          </p>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Job title, school name, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-red-500"
              >
                <option value="All">📍 All Cities</option>
                <option value="Taipei">Taipei</option>
                <option value="Taichung">Taichung</option>
                <option value="Kaohsiung">Kaohsiung</option>
                <option value="Hsinchu">Hsinchu</option>
              </select>

              <select 
                value={selectedSchoolType} 
                onChange={(e) => setSelectedSchoolType(e.target.value)}
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-red-500"
              >
                <option value="All">🏫 School Type</option>
                <option value="Cram School">Cram School (Buxiban)</option>
                <option value="Public School">Public School</option>
                <option value="International School">International School</option>
              </select>

              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-red-500"
              >
                <option value="All">💼 All Job Types</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Teaching Positions</h2>
            <p className="text-slate-500 text-sm">Showing {filteredJobs.length} available opportunities</p>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              onClick={() => setSelectedJob(job)}
            >
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-red-50 text-red-700 font-semibold text-xs px-3 py-1 rounded-full border border-red-100">
                    {job.badge}
                  </span>
                  <span className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 rounded-full">
                    {job.schoolType}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 hover:text-red-600 transition-colors">
                  {job.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-slate-400" /> {job.school}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location} ({job.district})</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {job.hours}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {job.arc && (
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ARC Provided
                    </span>
                  )}
                  {job.insurance && (
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Health Insurance
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 space-y-3">
                <div className="text-left md:text-right">
                  <span className="text-lg font-bold text-slate-900 block">{job.salary}</span>
                  <span className="text-xs text-slate-400">Posted {job.postedDate}</span>
                </div>
                <button className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                  View Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setSelectedJob(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <span className="text-red-600 text-sm font-bold uppercase tracking-wider">{selectedJob.schoolType}</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{selectedJob.title}</h2>
              <p className="text-slate-500 font-medium">{selectedJob.school} • {selectedJob.location}, Taiwan</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Salary</span>
                <span className="text-sm font-bold text-slate-800">{selectedJob.salary}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Hours</span>
                <span className="text-sm font-bold text-slate-800">{selectedJob.hours}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Experience</span>
                <span className="text-sm font-bold text-slate-800">{selectedJob.experience}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-900">Job Description & Requirements</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{selectedJob.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => {
                  alert(`Application submitted for ${selectedJob.title}!`);
                  setSelectedJob(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition shadow-md text-center"
              >
                Quick Apply Now
              </button>
            </div>
          </div>
        </div>
      )}

      {isPostJobOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setIsPostJobOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">Post a Teaching Opening</h2>
            <p className="text-slate-500 text-sm">Reach thousands of certified native English tutors in Taiwan.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              alert("Job submitted for review!");
              setIsPostJobOpen(false);
            }} className="space-y-4">
              <input type="text" placeholder="School Name" required className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl" />
              <input type="text" placeholder="Job Title" required className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl" />
              <input type="text" placeholder="Monthly Salary Range (NT$)" required className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl" />
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition">
                Submit Opening
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-sm">© 2026 TutorsRecruit Taiwan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}