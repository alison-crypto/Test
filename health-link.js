// health-link.js — watch numbers in the Race Plan. For now they're added by
// Claude from screenshots (straight into health_daily / health_workouts);
// automatic Apple Watch sync is parked. This shows what's there and fills the
// morning check (sleep, resting HR, HRV) — never overwriting what you typed.
import { supabase, getSession } from './supabase-client.js';

const READY_KEY = 'rtc_readiness_v1';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const load = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch { return f; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const dur = (s) => { s = Math.round(s || 0); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h} h ${pad(m)}` : `${m} min`; };
const pace = (s, km) => { if (!km || !s) return ''; const p = s / km; return `${Math.floor(p / 60)}:${pad(Math.round(p % 60))} / km`; };

let days = [], workouts = [];

async function fetchAll() {
  const since = new Date(); since.setDate(since.getDate() - 21);
  const [d, w] = await Promise.all([
    supabase.from('health_daily').select('date,sleep_h,rhr,hrv').gte('date', iso(since)).order('date', { ascending: false }),
    supabase.from('health_workouts').select('name,start_ts,duration_s,distance_km,avg_hr,max_hr').order('start_ts', { ascending: false }).limit(6),
  ]);
  days = d.data || []; workouts = w.data || [];
}

function fillReadiness() {
  const all = load(READY_KEY, {}); let changed = false;
  days.forEach((r) => {
    const e = Object.assign({}, all[r.date]);
    if ((e.sleep == null || e.sleep === '') && r.sleep_h != null) { e.sleep = String(Math.round(r.sleep_h * 10) / 10); e.auto = true; changed = true; }
    if ((e.rhr == null || e.rhr === '') && r.rhr != null) { e.rhr = String(Math.round(r.rhr)); e.auto = true; changed = true; }
    if (e.hrv == null && r.hrv != null) { e.hrv = Math.round(r.hrv); changed = true; }
    all[r.date] = e;
  });
  if (changed) save(READY_KEY, all);
  return changed;
}

function render() {
  const host = document.getElementById('watch-root');
  if (!host) return;
  if (!days.length && !workouts.length) { host.innerHTML = ''; return; }
  const last = days[0];
  host.innerHTML = `
    <section class="rp-card" id="watch">
      <h2>⌚ From your watch</h2>
      <p class="rp-muted">Added from your screenshots. Send a new one to Claude any time.</p>
      ${last ? `<div class="rp-goal-grid">
          <div><span>Sleep · ${esc(last.date)}</span><b>${last.sleep_h != null ? esc(last.sleep_h) + ' h' : '—'}</b></div>
          <div><span>Resting HR</span><b>${last.rhr != null ? esc(Math.round(last.rhr)) : '—'}</b></div>
          <div><span>HRV</span><b>${last.hrv != null ? esc(Math.round(last.hrv)) + ' ms' : '—'}</b></div>
          <div><span>Days logged</span><b>${days.length}</b></div>
        </div>` : ''}
      ${workouts.length ? `<div class="hw-list">${workouts.map((w) => `
          <div class="hw-w"><b>${esc(w.name)}</b><span>${esc(new Date(w.start_ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }))} · ${esc(dur(w.duration_s))}${w.distance_km ? ` · ${esc(Math.round(w.distance_km * 100) / 100)} km · ${esc(pace(w.duration_s, w.distance_km))}` : ''}${w.avg_hr ? ` · avg HR ${esc(Math.round(w.avg_hr))}` : ''}${w.max_hr ? ` · max ${esc(Math.round(w.max_hr))}` : ''}</span></div>`).join('')}</div>` : ''}
    </section>`;
}

(async () => {
  const session = await getSession().catch(() => null);
  if (!session?.user) return;
  try { await fetchAll(); } catch { return; }
  render();
  if (fillReadiness()) window.dispatchEvent(new Event('rp:refresh'));
})();
