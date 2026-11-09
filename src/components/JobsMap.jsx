import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Free vector map from OpenFreeMap ("Liberty" is the Google-Maps-like style). No account or key needed.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Show place names in English / Latin letters, falling back to the local name.
const ENGLISH_NAME = ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']];

function prepareStyle(map) {
  const style = map.getStyle();
  (style.layers || []).forEach((layer) => {
    if (layer.type !== 'symbol' || !layer.layout || !layer.layout['text-field']) return;
    if (/housenumber|shield|ref/i.test(layer.id)) return;
    map.setLayoutProperty(layer.id, 'text-field', ENGLISH_NAME);
  });

  // Make MRT / metro / rail lines and stations stand out.
  const source = Object.keys(style.sources).find((k) => style.sources[k].type === 'vector');
  if (!source) return;
  try {
    map.addLayer({
      id: 'tf-transit-casing', type: 'line', source, 'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'transit'], minzoom: 9,
      paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2, 14, 7] },
    });
    map.addLayer({
      id: 'tf-transit', type: 'line', source, 'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'transit'], minzoom: 9,
      paint: { 'line-color': '#2F4FD0', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 14, 4] },
    });
    map.addLayer({
      id: 'tf-stations', type: 'circle', source, 'source-layer': 'poi',
      filter: ['all', ['==', ['get', 'class'], 'railway'], ['in', ['get', 'subclass'], ['literal', ['station', 'subway', 'halt']]]],
      minzoom: 12,
      paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 16, 6], 'circle-color': '#ffffff', 'circle-stroke-color': '#2F4FD0', 'circle-stroke-width': 2 },
    });
    map.addLayer({
      id: 'tf-station-names', type: 'symbol', source, 'source-layer': 'poi',
      filter: ['all', ['==', ['get', 'class'], 'railway'], ['in', ['get', 'subclass'], ['literal', ['station', 'subway', 'halt']]]],
      minzoom: 13,
      layout: { 'text-field': ENGLISH_NAME, 'text-size': 12, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-font': ['Noto Sans Regular'] },
      paint: { 'text-color': '#1C3076', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
    });
  } catch { /* the map still works without the highlight */ }
}

function pinEl(approx) {
  const el = document.createElement('button');
  el.type = 'button';
  el.style.cssText = 'width:30px;height:38px;padding:0;border:0;background:none;cursor:pointer';
  el.innerHTML = `<svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 36C15 36 3 22 3 14a12 12 0 1 1 24 0c0 8-12 22-12 22z" fill="${approx ? '#ffffff' : '#FFCE1F'}" stroke="#0A1745" stroke-width="3"/><circle cx="15" cy="14" r="4" fill="#0A1745"/></svg>`;
  return el;
}

function popupEl(pt, onSelect) {
  const box = document.createElement('div');
  box.style.cssText = 'min-width:180px;font-family:inherit';
  const mk = (tag, text, css) => {
    const el = document.createElement(tag);
    el.textContent = text;
    if (css) el.style.cssText = css;
    box.appendChild(el);
    return el;
  };
  mk('div', pt.job.title, 'font-weight:800;color:#0A1745;font-size:14px');
  mk('div', pt.job.school_name, 'color:#334155;font-size:13px');
  if (pt.label) mk('div', pt.label, 'color:#64748b;font-size:12px');
  if (pt.job.salary) mk('div', pt.job.salary, 'color:#0A1745;font-size:12px;font-weight:600;margin-top:2px');
  if (pt.approx) mk('div', 'Approximate (city centre)', 'color:#94a3b8;font-size:11px;margin-top:2px');
  const btn = mk('button', 'View this ad', 'margin-top:8px;background:#FFCE1F;color:#0A1745;font-weight:800;border:0;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px');
  btn.type = 'button';
  btn.onclick = () => onSelect(pt.job.id);
  return box;
}

// points: [{ key, lat, lng, approx, label, job }]
export default function JobsMap({ points, selectedId, onSelect }) {
  const el = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const ready = useRef(false);
  const latest = useRef({ points, selectedId, onSelect });
  latest.current = { points, selectedId, onSelect };

  const [failed, setFailed] = useState('');

  const draw = () => {
    if (!map.current) return;
    try {
      drawPins();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Map pins could not be drawn', err);
    }
  };

  const drawPins = () => {
    const { points: allPts, onSelect: pick } = latest.current;
    const pts = allPts.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    markers.current.forEach((m) => m.remove());
    markers.current = pts.map((pt) => {
      const popup = new maplibregl.Popup({ offset: [0, -34], closeButton: true, maxWidth: '260px' }).setDOMContent(popupEl(pt, pick));
      return new maplibregl.Marker({ element: pinEl(pt.approx), anchor: 'bottom' }).setLngLat([pt.lng, pt.lat]).setPopup(popup).addTo(map.current);
    });
    if (pts.length) {
      const b = new maplibregl.LngLatBounds();
      pts.forEach((p) => b.extend([p.lng, p.lat]));
      map.current.fitBounds(b, { padding: 60, maxZoom: 14, duration: 0 });
    }
  };

  useEffect(() => {
    try {
      // Some phones and browsers switch off WebGL (battery saver, hardware acceleration off): show a message instead of a blank page.
      const probe = document.createElement('canvas');
      if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) {
        setFailed('Your browser has switched off the graphics the map needs.');
        return undefined;
      }
      map.current = new maplibregl.Map({ container: el.current, style: STYLE_URL, center: [120.95, 23.7], zoom: 6.3, attributionControl: { compact: true } });
      map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
      map.current.scrollZoom.disable(); // so scrolling the page does not get stuck on the map
      map.current.on('load', () => {
        try { prepareStyle(map.current); } catch { /* the map still works without English names or the MRT highlight */ }
        ready.current = true;
        draw();
      });
      map.current.on('error', (e) => {
        // Tile or style download problems (a bad connection) are not fatal: only a missing style is.
        if (!ready.current && e?.error && /style|Failed to fetch|NetworkError/i.test(String(e.error.message || e.error))) setFailed('The map could not be downloaded. Please check your connection and reload.');
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Map could not start', err);
      setFailed('The map could not start on this device.');
      return undefined;
    }
    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      if (map.current) { try { map.current.remove(); } catch { /* ignore */ } }
      map.current = null;
      ready.current = false;
    };
  }, []);

  useEffect(() => {
    if (ready.current) draw();
  }, [points, selectedId, onSelect]); // eslint-disable-line react-hooks/exhaustive-deps

  if (failed) {
    return (
      <div className="h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center px-6" role="alert">
        <p className="font-black text-slate-900">The map is not available right now.</p>
        <p className="text-sm text-slate-600 mt-1 max-w-md">{failed} You can still see every job in the list view.</p>
      </div>
    );
  }
  return <div ref={el} className="h-[420px] sm:h-[520px] w-full rounded-2xl overflow-hidden border border-slate-200 z-0" role="region" aria-label="Map of schools hiring" />;
}
