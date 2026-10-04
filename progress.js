// progress.js — tab switching on the Health page, plus the ⚖️ Body and
// ⌚ Workouts tabs (📏 Weekly lives in checkin.js).
// Data lives only in Supabase (body_scans, health_workouts, progress_notes —
// owner-only); Claude adds rows from the screenshots you send. This file is
// generic: no personal numbers in here because the app's code is public.
import { supabase, getSession } from './supabase-client.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => new Date((d.length === 10 ? d + 'T12:00:00' : d)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const dur = (s) => { s = Math.round(s || 0); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`; };
const pace = (s, km) => { if (!km || !s) return ''; const p = s / km; return `${Math.floor(p / 60)}:${pad(Math.round(p % 60))}/km`; };
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ---------- tabs ----------
const TABS = ['labs', 'checkin', 'body', 'workouts'];
function show(tab) {
  if (!TABS.includes(tab)) tab = 'labs';
  TABS.forEach((t) => {
    const p = document.getElementById(`tab-${t}`); if (p) p.hidden = t !== tab;
    const b = document.querySelector(`[data-tab="${t}"]`); if (b) b.classList.toggle('active', t === tab);
  });
  try { localStorage.setItem('rtc_health_tab_v1', JSON.stringify(tab)); } catch {}
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  show(b.dataset.tab); history.replaceState(null, '', '#' + b.dataset.tab);
});
show(location.hash.slice(1) || (() => { try { return JSON.parse(localStorage.getItem('rtc_health_tab_v1')); } catch { return 'labs'; } })());

// ---------- body ----------
// [key, label, unit, decimals, goal text, goal [lo, hi], better: 'down' | 'up' | null]
const BODY = [
  ['weight_lb', 'Weight', 'lb', 1, 'trend, not a day', [null, null], null],
  ['body_fat_pct', 'Body fat', '%', 1, '13–17% race shape', [13, 17], 'down'],
  ['visceral', 'Visceral fat', '', 0, '< 10 (lower better)', [null, 9], 'down'],
  ['muscle_lb', 'Muscle mass', 'lb', 1, 'hold or grow', [null, null], 'up'],
  ['fat_free_lb', 'Fat-free mass', 'lb', 1, 'hold or grow', [null, null], 'up'],
  ['skeletal_muscle_pct', 'Skeletal muscle', '%', 1, '> 50%', [50, null], 'up'],
  ['subq_fat_pct', 'Subcutaneous fat', '%', 1, 'drops with body fat', [null, null], 'down'],
  ['water_pct', 'Body water', '%', 1, '55–65%', [55, 65], null],
  ['protein_pct', 'Protein', '%', 1, '16–20%', [16, 20], null],
  ['bone_lb', 'Bone mass', 'lb', 1, 'stable', [null, null], null],
  ['bmi', 'BMI', '', 1, 'misleading if muscular', [null, null], null],
  ['bmr_kcal', 'BMR (estimate)', 'kcal', 0, 'scale estimate', [null, null], null],
  ['waist_cm', 'Waist', 'cm', 1, '< half your height', [null, null], 'down'],
];
function spark(points) {
  if (points.length < 2) return '';
  const vs = points.map((p) => p[1]); const min = Math.min(...vs), max = Math.max(...vs), span = max - min || 1;
  const xy = points.map((p, i) => `${(i / (points.length - 1)) * 100},${28 - ((p[1] - min) / span) * 24}`).join(' ');
  return `<svg class="pg-spark" viewBox="0 0 100 32" preserveAspectRatio="none"><polyline points="${xy}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}
function renderBody(scans, notes) {
  const host = document.getElementById('body-root');
  if (!scans.length) { host.innerHTML = '<section class="rp-card"><p class="rp-muted">No scans yet — send Claude a screenshot of your scale app.</p></section>'; return; }
  const last = scans[0], prev = scans[1];
  const note = notes[0];
  host.innerHTML = `
    ${note ? `<section class="rp-card lab-summary"><div class="rp-eyebrow">Claude’s read · ${esc(fmtDate(note.noted))}</div><h2>${esc(note.title || '')}</h2><div class="lab-text">${esc(note.summary)}</div></section>` : ''}
    <section class="rp-card">
      <h2>Latest scan · ${esc(fmtDate(last.measured))}</h2>
      <p class="rp-muted">${esc(last.source || '')}${prev ? ` · compared with ${esc(fmtDate(prev.measured))}` : ''}</p>
      <div class="pg-grid">${BODY.filter(([k]) => last[k] != null).map(([k, label, unit, dec, goalTxt, goal, better]) => {
        const v = Number(last[k]); const d = prev && prev[k] != null ? v - Number(prev[k]) : null;
        const good = d == null || d === 0 || !better ? '' : (better === 'up') === (d > 0) ? 'pg-good' : 'pg-bad';
        const out = (goal[0] != null && v < goal[0]) || (goal[1] != null && v > goal[1]);
        const series = scans.slice().reverse().filter((s) => s[k] != null).map((s) => [s.measured, Number(s[k])]);
        return `<div class="pg-cell ${out ? 'pg-out' : ''}"><span>${esc(label)}</span><b>${esc(v.toFixed(dec))}<small> ${esc(unit)}</small></b>
          ${d != null ? `<em class="${good}">${d > 0 ? '+' : ''}${esc(d.toFixed(dec))}</em>` : ''}
          ${spark(series)}<i>Goal: ${esc(goalTxt)}</i></div>`;
      }).join('')}</div>
    </section>
    <details class="rp-card"><summary><b>How to weigh so the trend is real</b></summary>
      <ul class="rp-rules">
        <li>Same scale, on waking, after the bathroom, before food, drink or coffee.</li>
        <li>2–3 times a week and look at the weekly average — a single day swings 1–3 lb with water and salt.</li>
        <li>Body-fat % from a scale moves ±1–2% with hydration: skip it after training, sauna, alcohol or a salty dinner.</li>
        <li>Tape your waist at the belly button once a month — the best single number for belly fat.</li>
        <li>Send Claude a screenshot after a weigh-in and it lands here with the change and a read.</li>
      </ul>
    </details>
    ${scans.length > 1 ? `<details class="rp-card"><summary><b>All scans (${scans.length})</b></summary>
      ${scans.map((s) => `<div class="lab-report"><b>${esc(fmtDate(s.measured))}</b> · ${esc(s.weight_lb)} lb · ${esc(s.body_fat_pct)}% fat · muscle ${esc(s.muscle_lb)} lb${s.note ? ` <span class="rp-muted">· ${esc(s.note)}</span>` : ''}</div>`).join('')}
    </details>` : ''}
    ${notes.length > 1 ? `<details class="rp-card"><summary><b>Earlier reads</b></summary>${notes.slice(1).map((n) => `<div class="lab-report"><b>${esc(fmtDate(n.noted))}</b> · ${esc(n.title || '')}<div class="lab-text">${esc(n.summary)}</div></div>`).join('')}</details>` : ''}`;
}

// ---------- workouts ----------
const effortCls = (e) => (e == null ? '' : e <= 3 ? 'pg-e1' : e <= 6 ? 'pg-e2' : e <= 8 ? 'pg-e3' : 'pg-e4');
function weekStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
function renderWorkouts(ws, notes) {
  const host = document.getElementById('workouts-root');
  const P = window.RACE_PLAN;
  const note = notes[0];
  // this week: plan vs what the watch logged
  const ws0 = weekStart(new Date());
  const days = [...Array(7)].map((_, i) => { const d = new Date(ws0); d.setDate(d.getDate() + i); return d; });
  const planRows = P ? days.map((d) => {
    const planned = (P.sessionsOn(d) || []).filter((s) => s.k !== 'rest');
    const done = ws.filter((w) => iso(new Date(w.start_ts)) === iso(d));
    const past = iso(d) < iso(new Date());
    return `<div class="pg-day ${iso(d) === iso(new Date()) ? 'is-today' : ''}"><b>${esc(fmtDate(iso(d)))}</b>
      <span>${planned.length ? planned.map((s) => esc(s.t)).join(' + ') : 'Rest'}</span>
      <em>${done.length ? `✅ ${done.map((w) => esc(w.name.split(' · ')[0])).join(' + ')}` : planned.length && past ? '—' : ''}</em></div>`;
  }).join('') : '';
  // last 4 weeks totals
  const weeks = [0, 1, 2, 3].map((k) => { const s = new Date(ws0); s.setDate(s.getDate() - 7 * k); const e = new Date(s); e.setDate(e.getDate() + 7); return { s, list: ws.filter((w) => { const t = new Date(w.start_ts); return t >= s && t < e; }) }; });
  host.innerHTML = `
    ${note ? `<section class="rp-card lab-summary"><div class="rp-eyebrow">Claude’s read · ${esc(fmtDate(note.noted))}</div><h2>${esc(note.title || '')}</h2><div class="lab-text">${esc(note.summary)}</div></section>` : ''}
    ${planRows ? `<section class="rp-card"><h2>This week · plan vs done</h2>${planRows}</section>` : ''}
    <section class="rp-card"><h2>Weekly totals</h2>
      <div class="pg-weeks">${weeks.map((w) => {
        const min = w.list.reduce((a, x) => a + (Number(x.duration_s) || 0), 0) / 60; const mins = Math.round(min);
        const kcal = w.list.reduce((a, x) => a + (Number(x.active_kcal) || 0), 0);
        const km = w.list.reduce((a, x) => a + (Number(x.distance_km) || 0), 0);
        return `<div><span>Week of ${esc(fmtDate(iso(w.s)))}</span><b>${w.list.length} session${w.list.length === 1 ? "" : "s"} · ${Math.floor(mins / 60)} h ${pad(mins % 60)}</b><i>${Math.round(kcal)} active kcal${km ? ` · ${km.toFixed(1)} km` : ''}</i></div>`;
      }).join('')}</div>
    </section>
    <section class="rp-card"><h2>Logged sessions</h2>
      ${ws.length ? ws.map((w) => `<div class="pg-w">
        <div class="lab-top"><span class="lab-name">${esc(w.name)}</span>${w.effort != null ? `<span class="lab-chip ${effortCls(w.effort)}">Effort ${esc(w.effort)}/10</span>` : ''}</div>
        <div class="lab-meta">${esc(fmtDate(w.start_ts))} · ${esc(new Date(w.start_ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}${w.place ? ` · ${esc(w.place)}` : ''}</div>
        <div class="pg-stats">
          <span><i>Time</i><b>${esc(dur(w.duration_s))}</b></span>
          ${w.distance_km ? `<span><i>Distance</i><b>${esc(Number(w.distance_km))} km</b></span><span><i>Pace</i><b>${esc(pace(w.duration_s, Number(w.distance_km)))}</b></span>` : ''}
          ${w.avg_hr ? `<span><i>Avg HR</i><b>${esc(Math.round(w.avg_hr))}</b></span>` : ''}
          ${w.max_hr ? `<span><i>Max HR</i><b>${esc(Math.round(w.max_hr))}</b></span>` : ''}
          ${w.active_kcal ? `<span><i>Active</i><b>${esc(Math.round(w.active_kcal))} kcal</b></span>` : w.energy_kcal ? `<span><i>Energy</i><b>${esc(Math.round(w.energy_kcal))} kcal</b></span>` : ''}
          ${w.cadence_spm ? `<span><i>Cadence</i><b>${esc(Math.round(w.cadence_spm))} spm</b></span>` : ''}
          ${w.elev_m ? `<span><i>Climb</i><b>${esc(Math.round(w.elev_m))} m</b></span>` : ''}
        </div>
        ${w.note ? `<div class="lab-info">${esc(w.note)}</div>` : ''}
      </div>`).join('') : '<p class="rp-muted">No sessions yet — send Claude screenshots from the Fitness app.</p>'}
    </section>
    ${notes.length > 1 ? `<details class="rp-card"><summary><b>Earlier reads</b></summary>${notes.slice(1).map((n) => `<div class="lab-report"><b>${esc(fmtDate(n.noted))}</b> · ${esc(n.title || '')}<div class="lab-text">${esc(n.summary)}</div></div>`).join('')}</details>` : ''}`;
}

(async () => {
  const session = await getSession().catch(() => null);
  const msg = '<section class="rp-card"><p class="rp-muted">Sign in to see your data.</p></section>';
  if (!session) { document.getElementById('body-root').innerHTML = msg; document.getElementById('workouts-root').innerHTML = msg; return; }
  const [s, w, n] = await Promise.all([
    supabase.from('body_scans').select('*').order('measured', { ascending: false }),
    supabase.from('health_workouts').select('name,start_ts,duration_s,distance_km,avg_hr,max_hr,energy_kcal,active_kcal,effort,cadence_spm,elev_m,place,note').order('start_ts', { ascending: false }).limit(60),
    supabase.from('progress_notes').select('kind,noted,title,summary').order('noted', { ascending: false }),
  ]);
  const notes = n.data || [];
  renderBody(s.data || [], notes.filter((x) => x.kind === 'body'));
  renderWorkouts(w.data || [], notes.filter((x) => x.kind === 'workouts'));
})();
