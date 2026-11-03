import { supabase, isDemo } from './supabase';

/* -------------------------------------------------------------------------
   One small data layer used by every page.
   - Live mode:  talks to Supabase (see SETUP.md).
   - Demo mode:  stores everything in this browser only, so the site can be
                 previewed before the database is connected.
   ------------------------------------------------------------------------- */

const DEMO_KEY = 'thtw_demo_db_v1';
const DEMO_ADMIN_KEY = 'thtw_demo_admin';

const emptyDb = () => ({ teachers: [], jobs: [], inquiries: [] });
const loadDb = () => {
  try {
    return { ...emptyDb(), ...(JSON.parse(localStorage.getItem(DEMO_KEY)) || {}) };
  } catch {
    return emptyDb();
  }
};
const saveDb = (db) => {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(db));
  } catch {
    throw new Error('Demo mode ran out of browser storage. Try a smaller photo.');
  }
};
const uid = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the photo.'));
    reader.readAsDataURL(blob);
  });

// "Jane Smith" -> "Jane S."  (matches public.display_name() in schema.sql)
export function displayName(full) {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Teacher';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

const PRIVATE_TEACHER_FIELDS = ['full_name', 'email', 'phone', 'status', 'consent'];
const toPublicTeacher = (t) => {
  const pub = { ...t, display_name: displayName(t.full_name) };
  PRIVATE_TEACHER_FIELDS.forEach((k) => delete pub[k]);
  return pub;
};

const newestFirst = (a, b) => (a.created_at < b.created_at ? 1 : -1);

/* ----------------------------- public reads ----------------------------- */

export async function listJobs() {
  if (isDemo) return loadDb().jobs.filter((j) => j.status === 'approved').sort(newestFirst);
  // "public_jobs" is the approved jobs WITHOUT the contact email (see schema.sql).
  const { data, error } = await supabase.from('public_jobs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// The contact email is only handed out one job at a time, and rate-limited, so it cannot be bulk-harvested.
export async function getJobContact(job) {
  if (isDemo) return job.contact_email || null;
  const { data, error } = await supabase.rpc('get_job_contact', { job_id: job.id });
  if (error) throw error;
  return data;
}

export async function listTeachers() {
  if (isDemo) {
    return loadDb()
      .teachers.filter((t) => t.status === 'approved')
      .sort(newestFirst)
      .map(toPublicTeacher);
  }
  const { data, error } = await supabase
    .from('public_teachers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/* ----------------------------- public writes ---------------------------- */

export async function submitTeacher(payload, photoBlob) {
  if (isDemo) {
    const db = loadDb();
    const photo_url = photoBlob ? await blobToDataUrl(photoBlob) : null;
    db.teachers.unshift({
      ...payload,
      id: uid(),
      created_at: new Date().toISOString(),
      status: 'pending',
      photo_url,
    });
    saveDb(db);
    return;
  }
  let photo_url = null;
  if (photoBlob) {
    const path = `${uid()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from('photos')
      .upload(path, photoBlob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (upErr) throw upErr;
    photo_url = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
  }
  // No .select() here on purpose: visitors may insert but may not read back.
  const { error } = await supabase.from('teachers').insert({ ...payload, photo_url, status: 'pending' });
  if (error) throw error;
}

export async function submitJob(payload, logoBlob) {
  if (isDemo) {
    const db = loadDb();
    const logo_url = logoBlob ? await blobToDataUrl(logoBlob) : null;
    db.jobs.unshift({ ...payload, logo_url, id: uid(), created_at: new Date().toISOString(), status: 'pending' });
    saveDb(db);
    return;
  }
  let logo_url = null;
  if (logoBlob) {
    const path = `logos/${uid()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from('photos')
      .upload(path, logoBlob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (upErr) throw upErr;
    logo_url = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
  }
  const { error } = await supabase.from('jobs').insert({ ...payload, logo_url, status: 'pending' });
  if (error) throw error;
}

export async function submitInquiry(payload) {
  if (isDemo) {
    const db = loadDb();
    db.inquiries.unshift({ ...payload, id: uid(), created_at: new Date().toISOString() });
    saveDb(db);
    return;
  }
  const { error } = await supabase.from('inquiries').insert(payload);
  if (error) throw error;
}

/* -------------------------------- admin --------------------------------- */

export const admin = {
  // Returns null (signed out), { email, notAdmin: true }, or { email }.
  async session() {
    if (isDemo) return sessionStorage.getItem(DEMO_ADMIN_KEY) ? { email: 'demo admin' } : null;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const { data: row } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
    return row ? { email: user.email } : { email: user.email, notAdmin: true };
  },

  async signIn(email, password) {
    if (isDemo) {
      sessionStorage.setItem(DEMO_ADMIN_KEY, '1');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async signOut() {
    if (isDemo) {
      sessionStorage.removeItem(DEMO_ADMIN_KEY);
      return;
    }
    await supabase.auth.signOut();
  },

  // kind: 'teachers' | 'jobs' | 'inquiries'
  async list(kind) {
    if (isDemo) {
      const db = loadDb();
      if (kind === 'inquiries') {
        return db.inquiries.sort(newestFirst).map((q) => ({
          ...q,
          teachers: db.teachers.find((t) => t.id === q.teacher_id)
            ? {
                full_name: db.teachers.find((t) => t.id === q.teacher_id).full_name,
                email: db.teachers.find((t) => t.id === q.teacher_id).email,
              }
            : null,
        }));
      }
      return [...db[kind]].sort(newestFirst);
    }
    const query =
      kind === 'inquiries'
        ? supabase.from('inquiries').select('*, teachers(full_name, email)')
        : supabase.from(kind).select('*');
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Saves the map positions of a job's locations (admin only).
  async saveLocations(id, locations) {
    if (isDemo) {
      const db = loadDb();
      const row = db.jobs.find((r) => r.id === id);
      if (row) row.locations = locations;
      saveDb(db);
      return;
    }
    const { error } = await supabase.from('jobs').update({ locations }).eq('id', id);
    if (error) throw error;
  },

  // Saves a private note (what we asked for / why it was rejected), optionally changing the status too.
  async saveNote(kind, id, note, status) {
    const patch = { admin_note: note || null, updated_at: new Date().toISOString(), ...(status ? { status } : {}) };
    if (isDemo) {
      const db = loadDb();
      const row = db[kind].find((r) => r.id === id);
      if (row) Object.assign(row, patch);
      saveDb(db);
      return;
    }
    const { error } = await supabase.from(kind).update(patch).eq('id', id);
    if (error) throw error;
  },

  async setStatus(kind, id, status) {
    if (isDemo) {
      const db = loadDb();
      const row = db[kind].find((r) => r.id === id);
      if (row) { row.status = status; row.updated_at = new Date().toISOString(); }
      saveDb(db);
      return;
    }
    const { error } = await supabase.from(kind).update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  // "Still active": marks the post as freshly checked, so it leaves the inactive list for another 30 days.
  async touch(kind, id) {
    const updated_at = new Date().toISOString();
    if (isDemo) {
      const db = loadDb();
      const row = db[kind].find((r) => r.id === id);
      if (row) row.updated_at = updated_at;
      saveDb(db);
      return;
    }
    const { error } = await supabase.from(kind).update({ updated_at }).eq('id', id);
    if (error) throw error;
  },

  async remove(kind, row) {
    if (isDemo) {
      const db = loadDb();
      db[kind] = db[kind].filter((r) => r.id !== row.id);
      saveDb(db);
      return;
    }
    const { error } = await supabase.from(kind).delete().eq('id', row.id);
    if (error) throw error;
    // Best effort: also delete the uploaded photo / logo file.
    const fileUrl = kind === 'teachers' ? row.photo_url : kind === 'jobs' ? row.logo_url : null;
    const path = fileUrl ? fileUrl.split('/photos/')[1] : null;
    if (path) await supabase.storage.from('photos').remove([path]);
  },
};
