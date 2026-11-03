import { supabase, isDemo } from './supabase';

/* -------------------------------------------------------------------------
   One small data layer used by every page.
   - Live mode:  talks to Supabase (see SETUP.md).
   - Demo mode:  stores everything in this browser only, so the site can be
                 previewed before the database is connected.
   ------------------------------------------------------------------------- */

const DEMO_KEY = 'thtw_demo_db_v1';
const DEMO_ADMIN_KEY = 'thtw_demo_admin';
const DEMO_SCHOOL_KEY = 'thtw_demo_school'; // demo mode: the "signed-in" school's email

const emptyDb = () => ({ teachers: [], jobs: [], inquiries: [], schools: [], contact_views: [] });
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

const PRIVATE_TEACHER_FIELDS = ['full_name', 'email', 'phone', 'status', 'consent', 'video_url', 'share_contact_with_schools'];
const toPublicTeacher = (t) => {
  const pub = {
    ...t,
    display_name: displayName(t.full_name),
    has_video: !!(t.video_url && t.share_contact_with_schools),
    contact_shared: !!t.share_contact_with_schools,
  };
  PRIVATE_TEACHER_FIELDS.forEach((k) => delete pub[k]);
  return pub;
};

export const CAP_MESSAGE = 'Your institution already has 3 active posts (live or waiting for review). Close one of them to post another.';
export const MAX_ACTIVE_POSTS = 3;

const newestFirst = (a, b) => (a.created_at < b.created_at ? 1 : -1);

/* ----------------------------- public reads ----------------------------- */

export async function listJobs() {
  if (isDemo) return loadDb().jobs.filter((j) => j.status === 'approved' && !j.closed_at).sort(newestFirst);
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
    const active = db.jobs.filter((j) => j.school_id === payload.school_id && ['pending', 'approved'].includes(j.status) && !j.closed_at).length;
    if (active >= 3) throw Object.assign(new Error(CAP_MESSAGE), { code: 'P0001' });
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
      return [...(db[kind] || [])].sort(newestFirst);
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

  // A short-lived private link to a school's proof document (the bucket is private).
  async proofUrl(path) {
    if (!path) return null;
    if (isDemo) return null;
    const { data, error } = await supabase.storage.from('school-docs').createSignedUrl(path, 300);
    if (error) throw error;
    return data.signedUrl;
  },

  // Who looked at whose contact details (newest first).
  async contactViews() {
    if (isDemo) return [...loadDb().contact_views].sort((a, b) => (a.viewed_at < b.viewed_at ? 1 : -1));
    const { data, error } = await supabase.from('contact_views').select('*').order('viewed_at', { ascending: false }).limit(500);
    if (error) throw error;
    return data;
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
    if (kind === 'schools') {
      if (row.proof_path) await supabase.storage.from('school-docs').remove([row.proof_path]);
      return;
    }
    // Best effort: also delete the uploaded photo / logo file.
    const fileUrl = kind === 'teachers' ? row.photo_url : kind === 'jobs' ? row.logo_url : null;
    const path = fileUrl ? fileUrl.split('/photos/')[1] : null;
    if (path) await supabase.storage.from('photos').remove([path]);
  },
};

/* ----------------------- schools (verified institutions) ------------------ */

// Schools sign in with email + password (Supabase Auth). Their registration is checked by the admin.
export const school = {
  // Returns null (signed out) or { email, userId, registration: row | null }.
  async session() {
    if (isDemo) {
      const email = sessionStorage.getItem(DEMO_SCHOOL_KEY);
      if (!email) return null;
      const reg = loadDb().schools.find((r) => r.user_id === email) || null;
      return { email, userId: email, registration: reg };
    }
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const { data: reg } = await supabase.from('schools').select('*').eq('user_id', user.id).maybeSingle();
    return { email: user.email, userId: user.id, registration: reg || null };
  },

  async signUp(email, password) {
    if (isDemo) { sessionStorage.setItem(DEMO_SCHOOL_KEY, email); return { signedIn: true }; }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/#/school` } });
    if (error) throw error;
    // If the project still asks for e-mail confirmation there is no session yet.
    return { signedIn: !!data.session };
  },

  async signIn(email, password) {
    if (isDemo) { sessionStorage.setItem(DEMO_SCHOOL_KEY, email); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async signOut() {
    if (isDemo) { sessionStorage.removeItem(DEMO_SCHOOL_KEY); return; }
    await supabase.auth.signOut();
  },

  // First registration, or a corrected re-submission after a rejection / request for details.
  async register(userId, payload, proofFile, existing) {
    if (isDemo) {
      const db = loadDb();
      const proof_path = proofFile ? `demo/${proofFile.name}` : existing?.proof_path || null;
      const row = { ...payload, proof_path, consent: true, status: 'pending', admin_note: null, updated_at: new Date().toISOString() };
      if (existing) Object.assign(db.schools.find((r) => r.id === existing.id), row);
      else db.schools.unshift({ ...row, id: uid(), user_id: userId, created_at: new Date().toISOString() });
      saveDb(db);
      return;
    }
    let proof_path = existing?.proof_path || null;
    if (proofFile) {
      const ext = (proofFile.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'pdf';
      const path = `${userId}/${uid()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('school-docs').upload(path, proofFile, { contentType: proofFile.type || undefined });
      if (upErr) throw upErr;
      proof_path = path;
    }
    const row = { ...payload, proof_path, consent: true, status: 'pending' };
    const { error } = existing
      ? await supabase.from('schools').update(row).eq('id', existing.id)
      : await supabase.from('schools').insert({ ...row, user_id: userId });
    if (error) throw error;
  },

  async myJobs(registration) {
    if (!registration) return [];
    if (isDemo) return loadDb().jobs.filter((j) => j.school_id === registration.id).sort(newestFirst);
    const { data, error } = await supabase.from('jobs').select('id, created_at, title, city, status, closed_at, admin_note').eq('school_id', registration.id).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async closeJob(id) {
    if (isDemo) {
      const db = loadDb();
      const j = db.jobs.find((r) => r.id === id);
      if (j) j.closed_at = new Date().toISOString();
      saveDb(db);
      return;
    }
    const { error } = await supabase.rpc('close_my_job', { p_job_id: id });
    if (error) throw error;
  },
};

// Verified schools only. One teacher at a time; the server logs every view and caps it per day.
export async function getTeacherContact(teacher) {
  if (isDemo) {
    const db = loadDb();
    const me = sessionStorage.getItem(DEMO_SCHOOL_KEY);
    const reg = db.schools.find((r) => r.user_id === me && r.status === 'approved');
    if (!reg) throw Object.assign(new Error('Only verified schools can see contact details.'), { code: 'P0001' });
    const t = db.teachers.find((r) => r.id === teacher.id && r.status === 'approved' && r.share_contact_with_schools);
    if (!t) return null;
    db.contact_views.unshift({ id: uid(), school_id: reg.id, teacher_id: t.id, viewed_at: new Date().toISOString() });
    saveDb(db);
    return { email: t.email, phone: t.phone, video_url: t.video_url };
  }
  const { data, error } = await supabase.rpc('get_teacher_contact', { p_teacher_id: teacher.id });
  if (error) throw error;
  return data;
}
