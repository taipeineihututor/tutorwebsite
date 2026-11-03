import React, { useState } from 'react';
import { Menu, X, Plus, User } from 'lucide-react';
import { isDemo } from '../lib/supabase';

// "Formosa" = the beautiful island. The mark is a simplified outline of Taiwan on a lime tile.
function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="w-10 h-10 shrink-0" role="img" aria-label="TeachFormosa logo">
      <rect width="32" height="32" rx="9" fill="#B8EA32" />
      <path
        d="M17.4 5c2.4 1.1 3.9 3.3 3.4 5.9 1.4 1.7.9 4.4-.3 6.3-.7 2.7-2.3 5.5-4.1 8.3-1.5-2.1-3-5-4-8-1.5-2-1-4.6.6-6.2-.1-2.7 1.6-5.3 4.4-6.3z"
        fill="#0A2A21"
      />
    </svg>
  );
}

const links = [
  { href: '#/', label: 'Browse Jobs', match: (r) => r === '/' },
  { href: '#/teachers', label: 'Find Teachers', match: (r) => r === '/teachers' },
];

export default function Layout({ route, children }) {
  const [open, setOpen] = useState(false);
  const linkCls = (active) =>
    active
      ? 'text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20'
      : 'text-slate-300 hover:text-white px-4 py-2 transition';

  return (
    <div className="min-h-screen bg-[#08241F] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black flex flex-col">
      {isDemo && (
        <div className="bg-amber-400 text-amber-950 text-center text-sm font-semibold px-4 py-2">
          Preview mode – nothing is saved to a server yet. Connect the database to go live (see SETUP.md).
        </div>
      )}

      <header className="border-b border-slate-800/60 bg-[#08241F]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="#/" className="flex items-center space-x-3">
            <LogoMark />
            <div>
              <span className="font-display text-2xl font-extrabold tracking-tight text-white block leading-none">
                Teach<span className="text-emerald-400">Formosa</span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-1.5">
                Teaching jobs in Taiwan
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center space-x-2 text-sm font-medium">
            {links.map((l) => (
              <a key={l.href} href={l.href} className={linkCls(l.match(route))}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <a
              href="#/post-job"
              className="flex items-center space-x-2 border border-slate-700 hover:border-emerald-500 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Post a Job</span>
            </a>
            <a
              href="#/join"
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition"
            >
              <User className="w-4 h-4" />
              <span>I'm a Teacher</span>
            </a>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg border border-slate-700 text-slate-200"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <nav className="md:hidden border-t border-slate-800 px-4 py-3 grid gap-2" onClick={() => setOpen(false)}>
            <a href="#/" className="px-3 py-3 rounded-lg text-slate-100 font-semibold bg-slate-900">Browse Jobs</a>
            <a href="#/teachers" className="px-3 py-3 rounded-lg text-slate-100 font-semibold bg-slate-900">Find Teachers</a>
            <a href="#/join" className="px-3 py-3 rounded-lg text-slate-950 font-bold bg-emerald-500">I'm a Teacher – create my profile</a>
            <a href="#/post-job" className="px-3 py-3 rounded-lg text-slate-100 font-semibold border border-slate-700">I'm a School – post a job</a>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="py-8 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>© 2026 TeachFormosa. All profiles and job posts are reviewed before they appear.</p>
        <p className="mt-2">
          <a href="#/admin" className="text-slate-600 hover:text-slate-300">Admin</a>
        </p>
      </footer>
    </div>
  );
}
