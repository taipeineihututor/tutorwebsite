// Downloads every file from every Supabase Storage bucket into the folder given as the first argument.
// Used by the nightly backup. Needs SUPABASE_URL and SUPABASE_SERVICE_KEY in the environment.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.SUPABASE_URL.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_KEY;
const out = process.argv[2] || 'files';
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function listFolder(bucket, prefix) {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const res = await fetch(`${base}/storage/v1/object/list/${bucket}`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: 'name', order: 'asc' } }),
    });
    if (!res.ok) throw new Error(`list ${bucket}/${prefix}: ${res.status}`);
    const items = await res.json();
    for (const it of items) {
      const p = prefix ? `${prefix}/${it.name}` : it.name;
      if (it.id === null) files.push(...(await listFolder(bucket, p))); // a folder
      else files.push(p);
    }
    if (items.length < 100) break;
  }
  return files;
}

const bres = await fetch(`${base}/storage/v1/bucket`, { headers });
if (!bres.ok) throw new Error(`buckets: ${bres.status}`);
let count = 0;
for (const b of await bres.json()) {
  for (const file of await listFolder(b.name, '')) {
    const r = await fetch(`${base}/storage/v1/object/${b.name}/${file.split('/').map(encodeURIComponent).join('/')}`, { headers });
    if (!r.ok) throw new Error(`download ${b.name}/${file}: ${r.status}`);
    const dest = path.join(out, b.name, file);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, Buffer.from(await r.arrayBuffer()));
    count++;
  }
}
console.log(`Downloaded ${count} files.`);
