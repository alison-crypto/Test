// health-link.js — Apple Watch → app. Shows the sync status and the latest
// watch data, creates your personal sync key, and fills the Race Plan morning
// check (sleep, resting HR, HRV) from what the watch recorded.
//
// Data arrives through the Supabase edge function `health-ingest`, sent by
// the Health Auto Export iPhone app (or a plain Shortcut). Tables:
// health_tokens (hash of your key), health_daily, health_workouts.
import { supabase, getSession } from './supabase-client.js';
import { SUPABASE_URL } from './supabase-config.js';

const ENDPOINT = `${SUPABASE_URL}/functions/v1/health-ingest`;
const READY_KEY = 'rtc_readiness_v1';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const load = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch { return f; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const dur = (s) => { s = Math.round(s || 0); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h} h ${pad(m)}` : `${m} min`; };
const pace = (s, km) => { if (!km || !s) return ''; const p = s / km; return `${Math.floor(p / 60)}:${pad(Math.round(p % 60))} / km`; };
const ago = (t) => { if (!t) return 'never'; const m = Math.round((Date.now() - Date.parse(t)) / 60000); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

let state = { user: null, token: null, days: [], workouts: [], newKey: null, error: null };

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function newKey() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function fetchAll() {
  const since = new Date(); since.setDate(since.getDate() - 21);
  const [t, d, w] = await Promise.all([
    supabase.from('health_tokens').select('created_at,last_used_at').maybeSingle(),
    supabase.from('health_daily').select('date,sleep_h,rhr,hrv,source,updated_at').gte('date', iso(since)).order('date', { ascending: false }),
    supabase.from('health_workouts').select('name,start_ts,duration_s,distance_km,avg_hr,max_hr').order('start_ts', { ascending: false }).limit(8),
  ]);
  state.error = t.error || d.error || w.error ? (t.error || d.error || w.error).message : null;
  state.token = t.data || null; state.days = d.data || []; state.workouts = w.data || [];
}

// Fill the morning check from the watch — never overwrite what you typed.
function fillReadiness() {
  if (!state.days.length) return false;
  const all = load(READY_KEY, {}); let changed = false;
  state.days.forEach((r) => {
    const e = Object.assign({}, all[r.date]);
    if (e.sleep == null || e.sleep === '') { if (r.sleep_h != null) { e.sleep = String(Math.round(r.sleep_h * 10) / 10); e.auto = true; changed = true; } }
    if (e.rhr == null || e.rhr === '') { if (r.rhr != null) { e.rhr = String(Math.round(r.rhr)); e.auto = true; changed = true; } }
    if (e.hrv == null && r.hrv != null) { e.hrv = Math.round(r.hrv); changed = true; }
    all[r.date] = e;
  });
  if (changed) save(READY_KEY, all);
  return changed;
}

function setupHTML() {
  const k = state.newKey;
  return `
    <details class="rc-sec" ${k || !state.token ? 'open' : ''}><summary>${state.token ? '🔑 Sync key &amp; setup' : '🔌 Connect your Apple Watch'}</summary>
      ${k ? `<div class="hw-key">
          <p><b>Your sync key — copy it now, it’s only shown once.</b></p>
          <label>URL<input readonly value="${esc(ENDPOINT)}" data-copy /></label>
          <label>Header name<input readonly value="Authorization" data-copy /></label>
          <label>Header value<input readonly value="Bearer ${esc(k)}" data-copy /></label>
          <small>Tap a box to copy. Keep the key private — anyone with it can send data into your plan.</small>
        </div>` : ''}
      <button type="button" class="race-plan-btn ${state.token ? 'ghost' : ''}" data-hw="key">${state.token ? 'Replace sync key' : 'Create my sync key'}</button>
      <p class="rc-muted"><b>Option 1 — Health Auto Export (recommended, sleep + HR + HRV + workouts)</b></p>
      <ol>
        <li>Install <b>Health Auto Export – JSON+CSV</b> from the App Store. Automations need Premium (7-day free trial, then subscription or one-time lifetime ≈ US$25).</li>
        <li>Open it and allow Health access to <b>Sleep</b>, <b>Resting Heart Rate</b>, <b>Heart Rate Variability</b> and <b>Workouts</b>.</li>
        <li><b>Automations → + → REST API.</b> Paste the URL above. Add a header: <b>Authorization</b> = <b>Bearer …</b> (the value above). Format <b>JSON</b>.</li>
        <li>Data type <b>Health Metrics</b> → select only Resting Heart Rate, Heart Rate Variability, Sleep Analysis. Time grouping <b>Days</b>, sleep <b>aggregated</b>, range <b>last 7 days</b>.</li>
        <li>Make a second automation the same way with data type <b>Workouts</b> (no routes needed).</li>
        <li>Set both to sync every hour (they also run when you open the app), then tap <b>Manual export</b> once. This card shows “last data received” when it works.</li>
      </ol>
      <p class="rc-muted"><b>Option 2 — free iPhone Shortcut (morning numbers only, no workouts)</b></p>
      <ol>
        <li>Shortcuts → Automation → <b>Time of day 6:00 AM</b> → Run immediately.</li>
        <li>Actions: <b>Find Health Samples</b> Resting Heart Rate (latest, limit 1) · <b>Find Health Samples</b> Heart Rate Variability (last 1 day) → <b>Calculate Statistics</b> Average · <b>Find Health Samples</b> Sleep Analysis where Value is Asleep (last 1 day) → Duration → <b>Calculate Statistics</b> Sum (hours).</li>
        <li><b>Get Contents of URL</b>: the URL above, Method POST, header Authorization = Bearer …, Request Body JSON: <code>date</code> (Current Date, format yyyy-MM-dd), <code>sleep_h</code>, <code>rhr</code>, <code>hrv</code>.</li>
      </ol>
    </details>`;
}

function render() {
  const host = document.getElementById('watch-root');
  if (!host) return;
  if (!state.user) { host.innerHTML = `<section class="rp-card" id="watch"><h2>⌚ Apple Watch</h2><p class="rp-muted">Sign in to connect your watch.</p></section>`; return; }
  const today = state.days.find((r) => r.date === iso(new Date()));
  const last = state.days[0];
  host.innerHTML = `
    <section class="rp-card" id="watch">
      <h2>⌚ Apple Watch</h2>
      <p class="rp-muted">${state.token ? `Connected · last data received <b>${esc(ago(state.token.last_used_at))}</b>` : 'Not connected yet — sleep, resting HR, HRV and workouts can flow in from your watch automatically.'}</p>
      ${state.error ? `<p class="rp-muted">Couldn’t load watch data: ${esc(state.error)}</p>` : ''}
      ${last ? `<div class="rp-goal-grid">
          <div><span>Sleep ${today ? 'last night' : esc(last.date)}</span><b>${(today || last).sleep_h != null ? esc((today || last).sleep_h) + ' h' : '—'}</b></div>
          <div><span>Resting HR</span><b>${(today || last).rhr != null ? esc(Math.round((today || last).rhr)) : '—'}</b></div>
          <div><span>HRV</span><b>${(today || last).hrv != null ? esc(Math.round((today || last).hrv)) + ' ms' : '—'}</b></div>
          <div><span>Days synced</span><b>${state.days.length}</b></div>
        </div>` : ''}
      ${state.workouts.length ? `<div class="hw-list">${state.workouts.slice(0, 6).map((w) => `
          <div class="hw-w"><b>${esc(w.name)}</b><span>${esc(new Date(w.start_ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }))} · ${esc(dur(w.duration_s))}${w.distance_km ? ` · ${esc(Math.round(w.distance_km * 100) / 100)} km · ${esc(pace(w.duration_s, w.distance_km))}` : ''}${w.avg_hr ? ` · avg HR ${esc(Math.round(w.avg_hr))}` : ''}</span></div>`).join('')}</div>` : ''}
      ${setupHTML()}
    </section>`;
}

async function makeKey() {
  if (state.token && !confirm('Replace your sync key? The old one stops working — update it in Health Auto Export / your Shortcut.')) return;
  const k = newKey();
  const { error } = await supabase.from('health_tokens').upsert({ user_id: state.user.id, token_hash: await sha256(k), created_at: new Date().toISOString(), last_used_at: null }, { onConflict: 'user_id' });
  if (error) { alert('Could not save the key: ' + error.message); return; }
  state.newKey = k; await fetchAll(); render();
}

document.addEventListener('click', async (e) => {
  if (e.target.closest('[data-hw="key"]')) { makeKey(); return; }
  const c = e.target.closest('#watch [data-copy]');
  if (c) { c.select(); try { await navigator.clipboard.writeText(c.value); c.classList.add('copied'); setTimeout(() => c.classList.remove('copied'), 1200); } catch {} }
});

(async () => {
  const session = await getSession().catch(() => null);
  state.user = session?.user || null;
  if (state.user) { try { await fetchAll(); } catch (err) { state.error = String(err.message || err); } }
  render();
  if (fillReadiness()) window.dispatchEvent(new Event('rp:refresh'));
})();
