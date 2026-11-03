// Turns a street address into map coordinates using OpenStreetMap's free Nominatim service.
// Runs in the school's browser when they post a job. It never blocks posting: if the lookup
// fails or is slow, the job is still sent and shows on the map at the city centre instead.
export async function geocodeAddress(address, timeoutMs = 5000) {
  const q = (address || '').trim();
  if (q.length < 5) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tw&q=${encodeURIComponent(q)}`,
      { signal: ctrl.signal, headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const [hit] = await res.json();
    const lat = Number(hit?.lat);
    const lng = Number(hit?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5 };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Tries the full address first, then simpler versions (without floor, house number, lane),
// because OpenStreetMap often knows the street but not every building number.
export function addressVariants(address) {
  const a = (address || '').trim();
  const out = [a];
  const noFloor = a.replace(/[\s,]*(\d+\s*樓.*|\d+\s*F\b.*|[,\s]*(\d+(st|nd|rd|th)\s+)?floor.*)$/i, '').trim();
  const noNumber = noFloor.replace(/\d+(-\d+)?\s*號.*$/, '').trim();
  const noLane = noNumber.replace(/\d+\s*巷.*$/, '').trim();
  [noFloor, noNumber, noLane].forEach((v) => { if (v.length >= 4 && !out.includes(v)) out.push(v); });
  return out.slice(0, 4);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function geocodeBest(address) {
  const variants = addressVariants(address);
  for (let i = 0; i < variants.length; i += 1) {
    const pos = await geocodeAddress(variants[i]);
    if (pos) return pos;
    if (i < variants.length - 1) await sleep(1100); // Nominatim: max 1 request per second
  }
  return null;
}

// Small browser-side cache so a visitor never looks up the same address twice.
const CACHE_KEY = 'tf_geo_v1';
export const readGeoCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; }
};
export const writeGeoCache = (c) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
};
export { sleep };
