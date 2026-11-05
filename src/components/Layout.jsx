import React, { useState } from 'react';
import { Menu, X, Plus, User } from 'lucide-react';
import { isDemo } from '../lib/supabase';

// "Formosa" = the beautiful island. The mark is a simplified outline of Taiwan on a yellow tile.
function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="w-10 h-10 shrink-0" role="img" aria-label="TeachFormosa logo">
      <rect width="32" height="32" rx="9" fill="#FFCE1F" />
      <path
        d="M18.7 5.1 L19.9 6.2 L21.4 7.1 L20.9 8.0 L20.7 9.6 L19.2 13.5 L17.8 19.3 L16.4 21.5 L15.0 24.1 L14.7 27.0 L13.8 26.4 L13.2 24.1 L11.3 22.5 L10.6 19.9 L10.6 17.0 L10.6 15.4 L12.9 11.6 L15.0 8.3 L15.9 6.7 L17.9 5.9Z"
        fill="#0A1745"
        stroke="#0A1745"
        strokeWidth="0.7"
        strokeLinejoin="round"
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
    <div className="min-h-screen bg-[#1D3A8C] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black flex flex-col">
      {isDemo && (
        <div className="bg-amber-400 text-amber-950 text-center text-sm font-semibold px-4 py-2">
          Preview mode – nothing is saved to a server yet. Connect the database to go live (see SETUP.md).
        </div>
      )}

      <header className="border-b border-white/15 bg-[#1D3A8C]/70 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="#/" className="flex items-center space-x-3">
            <LogoMark />
            <div>
              <span className="font-display text-2xl font-extrabold tracking-tight text-white block leading-none">
                Teach<span className="text-emerald-400">Formosa</span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold tracking-widest text-slate-200 uppercase mt-1.5">
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
              href="#/school"
              className="flex items-center space-x-2 border border-white/30 hover:border-emerald-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Schools: post a job</span>
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
            className="md:hidden p-2 rounded-lg border border-white/30 text-white"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <nav className="md:hidden border-t border-white/15 px-4 py-3 grid gap-2" onClick={() => setOpen(false)}>
            <a href="#/" className="px-3 py-3 rounded-lg text-white font-semibold bg-white/10">Browse Jobs</a>
            <a href="#/teachers" className="px-3 py-3 rounded-lg text-white font-semibold bg-white/10">Find Teachers</a>
            <a href="#/join" className="px-3 py-3 rounded-lg text-slate-950 font-bold bg-emerald-500">I'm a Teacher – create my profile</a>
            <a href="#/school" className="px-3 py-3 rounded-lg text-white font-semibold border border-white/30">I'm a School – log in / register</a>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="py-8 border-t border-white/15 text-center text-xs text-slate-300">
        <p>© 2026 TeachFormosa. Free to post. Every profile and job post is reviewed before it appears.</p>
        <p className="mt-2 space-x-3">
          <a href="#/legal" className="text-slate-300 hover:text-white underline">Terms &amp; Privacy</a>
          <a href="mailto:teachformosa@gmail.com" className="text-slate-300 hover:text-white underline">teachformosa@gmail.com</a>
          <a href="#/admin" className="text-slate-400 hover:text-white">Admin</a>
        </p>
      </footer>
    </div>
  );
}
