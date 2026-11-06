import { useCallback, useEffect, useState } from 'react';
import { saved, school, teacher } from './api';

// Private "saved" list for the signed-in person. kind = 'job' (teachers save jobs) or 'teacher' (verified schools save teachers).
// `enabled` is false for everybody else, so the heart buttons simply do not appear.
export function useSaved(kind) {
  const [enabled, setEnabled] = useState(false);
  const [rows, setRows] = useState({});

  const load = useCallback(async () => {
    try {
      let ok;
      if (kind === 'teacher') {
        const s = await school.session();
        ok = s?.registration?.status === 'approved';
      } else {
        const [t, s] = await Promise.all([teacher.session(), school.session()]);
        ok = !!t && !s?.registration;
      }
      if (!ok) { setEnabled(false); setRows({}); return; }
      const list = await saved.list(kind);
      setRows(Object.fromEntries(list.map((r) => [r.item_id, r])));
      setEnabled(true);
    } catch {
      setEnabled(false);
    }
  }, [kind]);

  useEffect(() => { load(); }, [load]);

  const has = useCallback((id) => !!rows[id], [rows]);
  const toggle = useCallback(async (id) => {
    const had = !!rows[id];
    setRows((r) => {
      const n = { ...r };
      if (had) delete n[id]; else n[id] = { item_id: id, contacted_at: null, note: null };
      return n;
    });
    try {
      if (had) await saved.remove(kind, id); else await saved.add(kind, id);
    } catch {
      load(); // put things back the way the server has them
    }
  }, [rows, kind, load]);

  return { enabled, has, toggle, count: Object.keys(rows).length };
}
