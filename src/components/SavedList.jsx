import React, { useCallback, useEffect, useState } from 'react';
import { Heart, Loader2, CheckCircle2 } from 'lucide-react';
import { saved, listJobs, listTeachers } from '../lib/api';
import { JobCard } from '../pages/Home';
import { TeacherCard } from '../pages/Teachers';
import { SaveButton } from './ui';

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');

// The signed-in person's private list. Nobody else can see it.
// kind 'job' (teachers) or 'teacher' (verified schools). Each entry can be ticked "contacted" and given a short note.
export default function SavedList({ kind }) {
  const [rows, setRows] = useState(null);
  const [items, setItems] = useState({});
  const [filter, setFilter] = useState('all'); // all | todo | contacted
  const [err, setErr] = useState('');
  const word = kind === 'job' ? 'jobs' : 'teachers';

  const load = useCallback(async () => {
    try {
      const [list, all] = await Promise.all([saved.list(kind), kind === 'job' ? listJobs() : listTeachers()]);
      setItems(Object.fromEntries(all.map((x) => [x.id, x])));
      setRows(list);
    } catch {
      setRows([]);
      setErr('Could not load your saved list. Please refresh in a moment.');
    }
  }, [kind]);
  useEffect(() => { load(); }, [load]);

  const patch = async (id, p) => {
    setRows((r) => r.map((x) => (x.item_id === id ? { ...x, ...p } : x)));
    try { await saved.update(kind, id, p); } catch { setErr('That did not save. Please try again.'); load(); }
  };
  const remove = async (id) => {
    setRows((r) => r.filter((x) => x.item_id !== id));
    try { await saved.remove(kind, id); } catch { load(); }
  };

  if (rows === null) return <p className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</p>;

  const shown = rows.filter((r) => filter === 'all' || (filter === 'contacted' ? !!r.contacted_at : !r.contacted_at));
  const stub = { enabled: true, has: () => true, toggle: remove };

  return (
    <div>
      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> My saved {word}</h2>
      <p className="text-sm text-slate-500 mb-3">Private: only you can see this list. Use ♥ Save on the {kind === 'job' ? 'job' : 'teacher'} pages, then tick “Contacted” to keep track.</p>
      {err && <p role="alert" className="text-sm font-semibold text-red-600 mb-2">{err}</p>}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Filter saved list">
          {[['all', `All (${rows.length})`], ['todo', `Not contacted yet (${rows.filter((r) => !r.contacted_at).length})`], ['contacted', `Contacted (${rows.filter((r) => r.contacted_at).length})`]].map(([k, l]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${filter === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'}`}>{l}</button>
          ))}
        </div>
      )}
      {rows.length === 0 && (
        <p className="text-slate-500">Nothing saved yet. Go to <a className="underline font-semibold text-emerald-700" href={kind === 'job' ? '#/' : '#/teachers'}>{kind === 'job' ? 'Browse jobs' : 'Find teachers'}</a> and tap ♥ Save.</p>
      )}
      <ul className="space-y-4">
        {shown.map((r) => {
          const it = items[r.item_id];
          return (
            <li key={r.item_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 space-y-3">
              {it ? (
                kind === 'job' ? <JobCard job={it} sv={stub} /> : <TeacherCard t={it} verified sv={stub} />
              ) : (
                <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <p className="text-slate-600 text-sm">This {kind === 'job' ? 'job is' : 'profile is'} no longer available (closed, hidden or deleted).</p>
                  <SaveButton sv={stub} id={r.item_id} />
                </div>
              )}
              <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-slate-800">
                  <input type="checkbox" checked={!!r.contacted_at}
                    onChange={(e) => patch(r.item_id, { contacted_at: e.target.checked ? new Date().toISOString() : null })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                  {r.contacted_at ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Contacted on {fmt(r.contacted_at)}</span> : 'I have contacted them'}
                </label>
                <NoteBox key={r.item_id} value={r.note || ''} onSave={(note) => patch(r.item_id, { note: note.trim() || null })} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NoteBox({ value, onSave }) {
  const [v, setV] = useState(value);
  return (
    <input
      type="text" maxLength={500} value={v} placeholder="Private note (e.g. interview Tuesday)"
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v !== value) onSave(v); }}
      aria-label="Private note"
      className="flex-1 min-w-[12rem] bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
    />
  );
}
