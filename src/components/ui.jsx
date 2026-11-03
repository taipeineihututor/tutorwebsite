import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

export const inputCls =
  'w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition';

export function Field({ label, required, hint, error, group, children, htmlFor }) {
  const Label = group ? 'div' : 'label';
  return (
    <div className="space-y-1.5">
      <Label htmlFor={group ? undefined : htmlFor} className="block text-sm font-bold text-slate-800">
        {label}
        {required && <span className="text-emerald-600"> *</span>}
      </Label>
      {hint && <p className="text-sm text-slate-500 -mt-0.5">{hint}</p>}
      {group ? (
        <div role="group" aria-label={label}>
          {children}
        </div>
      ) : (
        children
      )}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const norm = (o) => (typeof o === 'string' ? { value: o, label: o } : o);

// Pill buttons. multi=true -> value is an array; otherwise a single value.
export function Chips({ options, value, onChange, multi = false }) {
  const selected = (v) => (multi ? (value || []).includes(v) : value === v);
  const toggle = (v) => {
    if (!multi) return onChange(v);
    const cur = value || [];
    onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(norm).map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={selected(o.value)}
          onClick={() => toggle(o.value)}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold border transition ${
            selected(o.value)
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-600'
          }`}
        >
          {selected(o.value) && <Check className="w-4 h-4" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Big tappable single-choice cards (good for yes/no questions on phones).
export function Choice({ options, value, onChange }) {
  return (
    <div className="grid gap-2">
      {options.map(norm).map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border text-base font-medium transition ${
              on
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-600'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                on ? 'border-emerald-600' : 'border-slate-400'
              }`}
            >
              {on && <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 px-6 py-3 rounded-xl text-base font-bold shadow-lg shadow-emerald-500/20 transition ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 border border-slate-300 bg-white hover:border-slate-500 disabled:opacity-60 text-slate-800 px-5 py-3 rounded-xl text-base font-semibold transition ${className}`}
    >
      {children}
    </button>
  );
}

// White panel on the dark page (matches the existing search card).
export function Panel({ children, className = '' }) {
  return (
    <div className={`bg-white text-slate-900 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-emerald-500/10 border border-slate-100 ${className}`}>
      {children}
    </div>
  );
}

export function PageShell({ title, subtitle, children }) {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-14 bg-gradient-to-b from-[#0F2263] to-[#0A1745]">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">{title}</h1>
        {subtitle && <p className="text-slate-300 text-lg mb-8 leading-relaxed">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export function Banner({ tone = 'info', children }) {
  const tones = {
    info: 'bg-sky-50 border-sky-200 text-sky-900',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-800',
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${tones[tone]}`}>{children}</div>;
}

// Compact 7-day x 3-slot availability picture used on teacher cards.
export function AvailabilityMini({ availability, days, slots }) {
  return (
    <div className="inline-grid grid-cols-7 gap-1" aria-label="Weekly availability">
      {days.map((d) => (
        <div key={d.key} className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase text-slate-500">{d.label}</span>
          {slots.map((s) => {
            const on = (availability?.[d.key] || []).includes(s.key);
            return (
              <span
                key={s.key}
                title={`${d.label} ${s.label}`}
                className={`w-5 h-3.5 rounded ${on ? 'bg-emerald-500' : 'bg-slate-200'}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
