import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Plain coloured pin (no image files needed, so it works with any bundler).
const pin = (approx) =>
  L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${approx ? '#ffffff' : '#FFCE1F'};border:3px solid #0A1745;box-shadow:0 2px 6px rgba(0,0,0,.45)"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
  });

function popupEl(pt, onSelect) {
  const box = document.createElement('div');
  box.style.minWidth = '180px';
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
  const layer = useRef(null);

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView([23.7, 120.95], 7);
    // CARTO's Voyager style labels places in English / Latin letters (standard OpenStreetMap tiles use Chinese).
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    layer.current.clearLayers();
    points.forEach((pt) => {
      const m = L.marker([pt.lat, pt.lng], { icon: pin(pt.approx), title: `${pt.job.title} – ${pt.job.school_name}`, zIndexOffset: pt.job.id === selectedId ? 1000 : 0 });
      m.bindPopup(() => popupEl(pt, onSelect));
      m.addTo(layer.current);
    });
    if (points.length) {
      map.current.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 14 });
    }
  }, [points, selectedId, onSelect]);

  return <div ref={el} className="h-[420px] sm:h-[520px] w-full rounded-2xl overflow-hidden border border-slate-200 z-0" role="region" aria-label="Map of schools hiring" />;
}
