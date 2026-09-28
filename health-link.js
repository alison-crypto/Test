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
const WS = window.WatchSC || { MORNING: 'DeSouzas Morning', WORKOUT: 'DeSouzas Workout' };
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

function sessionFormHTML() {
  const P = window.RACE_PLAN; const now = new Date();
  const today = (P && P.sessionsOn(now)) || [];
  const opts = today.filter((x) => x.k !== 'rest' || /volley/i.test(x.t)).map((x, i) => `<option value="${i}">${esc(x.time)} · ${esc(x.t)}</option>`).join('');
  const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const from = new Date(now.getTime() - 60 * 60000);
  return `<div class="hw-pull">
      <b>Pull a session from the watch</b>
      <span class="rc-muted">Heart rate, distance and calories between these times (free Shortcut 2).</span>
      ${opts ? `<select id="hw-sess"><option value="">Pick today’s session…</option>${opts}</select>` : ''}
      <div class="hw-times"><label>Name<input id="hw-name" value="Workout" /></label><label>From<input id="hw-from" type="time" value="${hm(from)}" /></label><label>To<input id="hw-to" type="time" value="${hm(now)}" /></label></div>
      <button type="button" class="race-plan-btn" data-hw="pull">⌚ Pull from watch</button>
    </div>`;
}

function setupHTML() {
  const k = state.newKey;
  return `
    <details class="rc-sec" ${k || !state.token ? 'open' : ''}><summary>${state.token ? '🔑 Sync key &amp; Shortcut setup' : '🔌 Connect your Apple Watch (free)'}</summary>
      ${k ? `<div class="hw-key">
          <p><b>Your sync key — copy it now, it’s only shown once.</b></p>
          <label>URL<input readonly value="${esc(ENDPOINT)}" data-copy /></label>
          <label>Header name<input readonly value="Authorization" data-copy /></label>
          <label>Header value<input readonly value="Bearer ${esc(k)}" data-copy /></label>
          <small>Tap a box to copy. Keep the key private — anyone with it can send data into your plan.</small>
        </div>` : ''}
      <button type="button" class="race-plan-btn ${state.token ? 'ghost' : ''}" data-hw="key">${state.token ? 'Replace sync key' : '1 · Create my sync key'}</button>
      <p class="rc-muted">Two free Shortcuts in Apple’s <b>Shortcuts</b> app. Names must match exactly. In each, the last action is the same <b>Get Contents of URL</b>: the URL above · Method <b>POST</b> · Headers: <b>Authorization</b> = <b>Bearer …</b> · Request Body <b>JSON</b>.</p>
      <p class="rc-muted"><b>2 · Shortcut “${esc(WS.MORNING)}”</b> — sleep, resting HR, HRV</p>
      <ol>
        <li><b>Find Health Samples</b> · Type <b>Sleep Analysis</b> · Start Date is in the last <b>1 day</b> · Value is not <b>Awake</b> · Value is not <b>In Bed</b>.</li>
        <li><b>Find Health Samples</b> · Type <b>Heart Rate Variability</b> · Start Date is in the last <b>1 day</b>.</li>
        <li><b>Find Health Samples</b> · Type <b>Resting Heart Rate</b> · Sort by Start Date · <b>Latest First</b> · Limit <b>1</b>.</li>
        <li><b>Get Contents of URL</b> · JSON fields (Text): <code>sleep</code> = step 1 → tap it → <b>Duration</b> · <code>hrv</code> = step 2 → <b>Value</b> · <code>rhr</code> = step 3 → <b>Value</b>.</li>
      </ol>
      <p class="rc-muted"><b>3 · Shortcut “${esc(WS.WORKOUT)}”</b> — heart rate, distance, calories for a session</p>
      <ol>
        <li><b>Split Text</b> · Shortcut Input · by Custom <b>|</b>.</li>
        <li><b>Get Item from List</b> · Item at Index <b>1</b> → <b>Get Dates from Input</b> → <b>Set Variable</b> <i>Start</i>.</li>
        <li><b>Get Item from List</b> (from Split Text) · Index <b>2</b> → <b>Get Dates from Input</b> → <b>Set Variable</b> <i>End</i>.</li>
        <li><b>Find Health Samples</b> · <b>Heart Rate</b> · Start Date is after <i>Start</i> · End Date is before <i>End</i>. Repeat for <b>Walking + Running Distance</b> and <b>Active Energy</b>.</li>
        <li><b>Get Contents of URL</b> · JSON fields (Text): <code>session</code> = Shortcut Input · <code>hr</code>, <code>dist</code>, <code>kcal</code> = the three sample lists → <b>Value</b>.</li>
      </ol>
      <p class="rc-muted"><b>4 · Use it:</b> tap <b>⌚ Sync from watch</b> in the morning check, and <b>⌚ Pull from watch</b> after a session (also on the Run card). The app opens the Shortcut and you swipe back. Optional: a Shortcuts automation at 7 AM runs the morning one by itself — it only works if the phone is unlocked then.</p>
      <p class="rc-muted">Wear the watch in a workout (Outdoor Run / Functional Strength) so heart rate is recorded every few seconds.</p>
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
      <div class="race-plan-actions"><button type="button" class="race-plan-btn ghost" data-watch="morning">⌚ Sync morning numbers</button></div>
      ${state.token ? sessionFormHTML() : ''}
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
  if (e.target.closest('[data-watch="morning"]')) { window.WatchSC && window.WatchSC.runMorning(); return; }
  if (e.target.closest('[data-hw="pull"]')) {
    const [fh, fm] = document.getElementById('hw-from').value.split(':').map(Number);
    const [th, tm] = document.getElementById('hw-to').value.split(':').map(Number);
    const s0 = new Date(); s0.setHours(fh, fm, 0, 0); const e0 = new Date(); e0.setHours(th, tm, 0, 0);
    if (!(e0 > s0)) { alert('“To” has to be after “From”.'); return; }
    window.WatchSC && window.WatchSC.runWorkout(document.getElementById('hw-name').value, s0, e0);
    return;
  }
  const c = e.target.closest('#watch [data-copy]');
  if (c) { c.select(); try { await navigator.clipboard.writeText(c.value); c.classList.add('copied'); setTimeout(() => c.classList.remove('copied'), 1200); } catch {} }
});

// picking one of today's sessions fills the name and planned times
document.addEventListener('change', (e) => {
  if (e.target.id !== 'hw-sess' || e.target.value === '') return;
  const P = window.RACE_PLAN; const x = (P.sessionsOn(new Date()) || [])[+e.target.value]; if (!x) return;
  const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(x.time); if (!m) return;
  let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12;
  const st = new Date(); st.setHours(h, +m[2], 0, 0); const en = new Date(st.getTime() + (x.dur || 60) * 60000);
  document.getElementById('hw-name').value = x.t;
  document.getElementById('hw-from').value = `${pad(st.getHours())}:${pad(st.getMinutes())}`;
  document.getElementById('hw-to').value = `${pad(en.getHours())}:${pad(en.getMinutes())}`;
});

// coming back from the Shortcuts app → fetch what just arrived
async function refresh() {
  if (!state.user) return;
  try { await fetchAll(); } catch (err) { state.error = String(err.message || err); }
  const keep = state.newKey; render(); state.newKey = keep;
  if (fillReadiness()) window.dispatchEvent(new Event('rp:refresh'));
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

(async () => {
  const session = await getSession().catch(() => null);
  state.user = session?.user || null;
  if (state.user) { try { await fetchAll(); } catch (err) { state.error = String(err.message || err); } }
  render();
  if (fillReadiness()) window.dispatchEvent(new Event('rp:refresh'));
})();
