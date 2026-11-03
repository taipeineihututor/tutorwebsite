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
