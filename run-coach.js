// run-coach.js — the Run card on the Hyrox tab. Guided run sessions from the
// Race Plan (Tue intervals, Thu easy, Sun long), effort zones with paces from
// your 5 km time, a lap/split log, and the how-to-run guide + 3 replacement
// options (like the station cards).
//
// Storage keys:
//   rtc_run_5k_v1    — your recent 5 km time in seconds (optional; drives paces)
//   rtc_run_kind_v1  — last picked session type
//   rtc_run_live_v1  — in-progress guided session (survives reloads)
//   rtc_run_log_v1   — finished sessions [{ date, week, kind, title, splits, dist, totalMs }]
(function () {
  const P = window.RACE_PLAN;
  const host = document.getElementById('run-root');
  if (!host) return;
  const K5 = 'rtc_run_5k_v1', KIND = 'rtc_run_kind_v1', LIVE = 'rtc_run_live_v1', LOG = 'rtc_run_log_v1';
  const load = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch { return f; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const clock = (ms) => { const t = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`; };
  const pace = (sec) => `${Math.floor(sec / 60)}:${pad(Math.round(sec % 60))}`;
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Effort zones. `off` = seconds per km slower than your 5 km pace.
  const ZONES = {
    easy:   { name: 'Zone 2 · easy', rpe: '3–4', talk: 'Talk in full sentences', hr: '65–75% of max HR', off: [60, 90] },
    steady: { name: 'Steady', rpe: '5–6', talk: 'Short sentences', hr: '75–82% of max HR', off: [40, 55] },
    subT:   { name: 'Sub-threshold', rpe: '7', talk: 'A few words at a time — “comfortably hard”', hr: '82–87% of max HR', off: [20, 30] },
    T:      { name: 'Threshold', rpe: '7–8', talk: '2–3 words, controlled', hr: '87–90% of max HR', off: [10, 15] },
    race:   { name: 'HYROX race pace', rpe: '8', talk: 'Hard, but you could repeat it 8 times', hr: '85–92% of max HR', off: [25, 40] },
    fast:   { name: 'Faster than race pace', rpe: '8–9', talk: 'No talking — quick and relaxed', hr: 'short reps, HR lags', off: [0, 10] },
  };
  const GOAL_PACE = 220; // sub-60 budget ≈ 3:40 / km

  function week() { const now = new Date(); return P ? (P.weekFor(now) || (P.daysToRace(now) > 0 ? P.WEEKS[0] : P.WEEKS[P.WEEKS.length - 1])) : null; }
  function defaultKind() { const d = new Date().getDay(); return d === 4 ? 'easy' : d === 0 ? 'long' : 'iv'; }
  let kind = load(KIND, null) && load(LIVE, null) ? load(KIND, 'iv') : defaultKind();
  let live = load(LIVE, null);
  let tickId = null, wake = null;

  function zonePace(z) {
    const t5 = load(K5, 0); if (!t5) return null;
    const p5 = t5 / 5; const Z = ZONES[z]; return [p5 + Z.off[0], p5 + Z.off[1]];
  }
  function paceTxt(z, dist) {
    const r = zonePace(z);
    if (!r) return '';
    const per = `${pace(r[0])}–${pace(r[1])} / km`;
    if (!dist) return per;
    return `${per} · ${dist >= 1000 ? dist / 1000 + ' km' : dist + ' m'} in ${pace(r[0] * dist / 1000)}–${pace(r[1] * dist / 1000)}`;
  }

  // ---- sessions from the plan ----
  function sessionFor(k, w) {
    if (!w) return null;
    if (k === 'iv') {
      const iv = w.iv || { reps: 5, dist: 1000, rest: 75, zone: 'subT' };
      const repTxt = iv.dist ? (iv.dist >= 1000 ? `${iv.dist / 1000} km` : `${iv.dist} m`) : clock(iv.secs * 1000);
      return { kind: k, title: `${iv.reps} × ${repTxt} · ${ZONES[iv.zone].name}`, sub: w.a.main, iv, zone: iv.zone };
    }
    const mins = k === 'easy' ? (typeof w.thu === 'number' ? w.thu : 30) : (w.long || 45);
    return { kind: k, title: `${mins} min ${k === 'easy' ? 'easy run' : 'long easy run'}`, sub: k === 'easy' ? 'Thursday · zone 2, quick light steps.' : 'Sunday · zone 2 — the day after Circuit B, so truly easy. Sore legs or < 6 h sleep → half on the bike.', mins, zone: 'easy' };
  }
  function phasesFor(s) {
    if (s.kind !== 'iv') return [{ type: 'run', label: s.title, secs: s.mins * 60, zone: 'easy' }];
    const iv = s.iv, ph = [];
    ph.push({ type: 'wu', label: 'Warm-up · easy jog', secs: (iv.wu != null ? iv.wu : 10) * 60, zone: 'easy' });
    const strides = iv.strides != null ? iv.strides : 4;
    if (strides) ph.push({ type: 'manual', label: `Drills + ${strides} × 20 s strides`, note: 'Leg swings, A-skips, then fast-relaxed strides with a walk back. Tap Next when done.' });
    for (let r = 1; r <= iv.reps; r++) {
      ph.push({ type: 'work', label: `Rep ${r} of ${iv.reps}`, rep: r, dist: iv.dist || 0, secs: iv.secs || 0, zone: iv.zone });
      if (r < iv.reps) ph.push({ type: 'rest', label: `Easy jog · next is rep ${r + 1}`, secs: iv.rest, zone: 'easy' });
    }
    ph.push({ type: 'cd', label: 'Cool-down · easy jog', secs: (iv.cd != null ? iv.cd : 10) * 60, zone: 'easy' });
    return ph;
  }

  // ---- live session engine (wall-clock based, survives reloads) ----
  const now = () => Date.now();
  function phaseElapsed() { if (!live) return 0; return (live.pauseAt || now()) - live.phaseStart - live.pauseAcc; }
  function start() {
    const w = week(); const s = sessionFor(kind, w); if (!s) return;
    live = { kind, week: w.n, title: s.title, phases: phasesFor(s), idx: 0, phaseStart: now(), pauseAcc: 0, pauseAt: null, splits: [], dist: s.iv && s.iv.dist || 0, started: now(), half: false };
    save(LIVE, live); unlockAudio(); requestWake(); render(); loop();
  }
  function togglePause() {
    if (!live) return;
    if (live.pauseAt) { live.pauseAcc += now() - live.pauseAt; live.pauseAt = null; requestWake(); }
    else live.pauseAt = now();
    save(LIVE, live); paintLive();
  }
  function next(auto) {
    if (!live) return;
    const ph = live.phases[live.idx];
    // a rep tapped off in under 20 s is a skip or a mis-tap, not a split
    if (ph.type === 'work') { const ms = ph.dist ? phaseElapsed() : ph.secs * 1000; if (ms >= 20000) live.splits.push(ms); }
    if (live.idx >= live.phases.length - 1) { finish(); return; }
    live.idx++; live.phaseStart = now(); live.pauseAcc = 0; live.pauseAt = null; live.half = false;
    save(LIVE, live); if (auto) signal(); render();
  }
  function finish() {
    const log = load(LOG, []);
    log.unshift({ date: iso(new Date()), week: live.week, kind: live.kind, title: live.title, splits: live.splits, dist: live.dist, totalMs: now() - live.started });
    save(LOG, log.slice(0, 60));
    live = null; save(LIVE, null); releaseWake(); signal(); render();
    toast('Run saved ✓');
  }
  function stop() { if (!live) return; if (!confirm('End this run? Reps done so far are saved.')) return; if (live.splits.length) finish(); else { live = null; save(LIVE, null); releaseWake(); render(); } }
  function loop() { clearInterval(tickId); tickId = setInterval(() => { if (!live) { clearInterval(tickId); return; } tick(); }, 250); }
  function tick() {
    const ph = live.phases[live.idx];
    if (!live.pauseAt && ph.secs && ph.type !== 'manual') {
      const rem = ph.secs * 1000 - phaseElapsed();
      if (ph.type === 'run') { if (!live.half && rem <= ph.secs * 500) { live.half = true; save(LIVE, live); signal(true); } }
      else if (rem <= 0 && !(ph.type === 'work' && ph.dist)) { next(true); return; }
    }
    paintLive();
  }

  // ---- beeps, vibration, screen awake ----
  let bell = null;
  function unlockAudio() { try { bell = bell || new Audio('bell.wav'); bell.muted = true; bell.play().then(() => { bell.pause(); bell.currentTime = 0; bell.muted = false; }).catch(() => {}); } catch {} }
  function signal(soft) { try { navigator.vibrate && navigator.vibrate(soft ? [150] : [250, 120, 350]); } catch {} try { if (bell) { bell.currentTime = 0; bell.play().catch(() => {}); } } catch {} }
  async function requestWake() { try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch {} }
  function releaseWake() { try { wake && wake.release(); } catch {} wake = null; }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && live && !live.pauseAt) { requestWake(); tick(); } });
  function toast(msg) { const t = document.createElement('div'); t.className = 't-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }

  // ---- rendering ----
  function liveHTML() {
    const ph = live.phases[live.idx];
    const Z = ph.zone ? ZONES[ph.zone] : null;
    const countUp = ph.type === 'work' && ph.dist;
    const upcoming = live.phases.slice(live.idx + 1, live.idx + 3).map((x) => x.label).join(' → ');
    return `<div class="rc-live rc-live-${ph.type}" id="rc-live">
      <div class="rc-live-top"><span>${esc(live.title)}</span><span>${live.idx + 1}/${live.phases.length}</span></div>
      <div class="rc-live-label">${esc(ph.label)}</div>
      <div class="rc-live-time" id="rc-time">0:00</div>
      ${Z ? `<div class="rc-live-zone"><b>${esc(Z.name)}</b> · RPE ${esc(Z.rpe)} · ${esc(Z.talk)}${paceTxt(ph.zone, ph.dist) ? `<br>${esc(paceTxt(ph.zone, ph.dist))}` : ''}</div>` : ''}
      ${ph.note ? `<div class="rc-live-zone">${esc(ph.note)}</div>` : ''}
      <div class="rc-live-ctrls">
        <button type="button" class="race-plan-btn ghost" data-rc="pause" id="rc-pause">${live.pauseAt ? 'Resume' : 'Pause'}</button>
        <button type="button" class="race-plan-btn rc-big" data-rc="next">${countUp ? 'Lap ✓ rep done' : ph.type === 'run' ? 'Finish run ✓' : 'Next ›'}</button>
        <button type="button" class="race-plan-btn ghost" data-rc="stop">End</button>
      </div>
      ${live.splits.length ? `<div class="rc-splits">${live.splits.map((ms, i) => `<span>#${i + 1} ${clock(ms)}</span>`).join('')}</div>` : ''}
      ${upcoming ? `<div class="rc-next">Next: ${esc(upcoming)}</div>` : ''}
    </div>`;
  }
  function paintLive() {
    if (!live) return;
    const el = document.getElementById('rc-time'); if (!el) { render(); return; }
    const ph = live.phases[live.idx];
    const shown = live.phases[live.idx].type === 'manual' ? '—'
      : (ph.type === 'work' && ph.dist) ? clock(phaseElapsed())
      : clock(Math.max(0, ph.secs * 1000 - phaseElapsed()));
    el.textContent = shown;
    const pb = document.getElementById('rc-pause'); if (pb) pb.textContent = live.pauseAt ? 'Resume' : 'Pause';
    const box = document.getElementById('rc-live'); if (box) box.classList.toggle('paused', !!live.pauseAt);
  }
  function historyHTML() {
    const log = load(LOG, []).slice(0, 4);
    if (!log.length) return '<p class="rc-muted">Your finished runs and rep splits show up here.</p>';
    return log.map((r) => {
      const avg = r.dist && r.splits.length ? r.splits.reduce((a, b) => a + b, 0) / r.splits.length : 0;
      return `<div class="rc-log"><div><b>${esc(r.title)}</b><span>${esc(r.date)} · week ${r.week} · ${clock(r.totalMs)} total</span></div>
        ${r.splits.length ? `<div class="rc-splits">${r.splits.map((ms, i) => `<span>#${i + 1} ${clock(ms)}</span>`).join('')}${avg ? `<span class="rc-avg">avg ${pace(avg / 1000 / (r.dist / 1000))} / km</span>` : ''}</div>` : ''}</div>`;
    }).join('');
  }
  function zonesHTML() {
    return `<table class="rc-zones"><thead><tr><th>Zone</th><th>Feels like</th><th>Pace</th></tr></thead><tbody>${Object.keys(ZONES).map((k) => {
      const Z = ZONES[k]; const pz = zonePace(k);
      return `<tr><td><b>${esc(Z.name)}</b><small>RPE ${esc(Z.rpe)} · ${esc(Z.hr)}</small></td><td>${esc(Z.talk)}</td><td>${pz ? `${pace(pz[0])}–${pace(pz[1])}` : '—'}</td></tr>`;
    }).join('')}</tbody></table>
    <p class="rc-muted">Sub-60 needs ~${pace(GOAL_PACE)} / km across all 8 runs. “HYROX race pace” above is what you can hold <i>between stations</i> today — the gap closes as the block goes on.</p>`;
  }
  const GUIDE = [
    ['🏃 Form — 6 cues', `<ul>
      <li><b>Tall, slight lean from the ankles</b>, not the waist. Hips under you.</li>
      <li><b>Land under your hips</b>, not out in front. If your heel slaps far ahead, you’re over-striding.</li>
      <li><b>Quick steps:</b> ~170–180 steps a minute (your Apple Watch shows cadence). Over-striding? Add 5% cadence, not effort.</li>
      <li><b>Relaxed shoulders, 90° arms</b> swinging front-to-back, hands loose.</li>
      <li><b>Eyes 10–20 m ahead</b>, quiet feet — land softly.</li>
      <li><b>Breathing:</b> easy runs 3 steps in / 3 out (or nose-only); hard reps 2 / 2.</li></ul>`],
    ['🔥 Warm-up & strides', `<ol><li>10 min easy jog.</li><li>Leg swings 10 / side (front-back, side-side), 10 walking lunges.</li><li>A-skips 2 × 20 m, high knees 20 m, butt kicks 20 m.</li><li>4 × 20 s strides: build to fast-but-relaxed (not a sprint), walk back.</li></ol>`],
    ['🧭 Running in HYROX (compromised runs)', `<ul>
      <li><b>First 200 m after a station:</b> short quick steps, let your breathing settle, then build to pace. Don’t sprint out of the Roxzone.</li>
      <li><b>After sleds / lunges</b> legs feel like concrete — raise cadence, shorten stride; it passes in ~300 m.</li>
      <li><b>After wall balls / burpees</b> it’s the breathing — exhale hard for 3–4 breaths, then find rhythm.</li>
      <li><b>Jog the Roxzone</b> in and out — walking it costs 30–60 s over the race.</li>
      <li><b>Count your laps</b> — each 1 km is several laps of the venue loop; know the number before the start.</li>
      <li><b>Even splits:</b> run 1 should be no faster than run 5. Most people lose the race by going out too hard.</li></ul>`],
    ['🌧 6 AM in BC, Oct–Dec', `<ul><li>Dark mornings: headlamp + reflective vest, or use the treadmill.</li><li>Rain / cold: layers you can unzip; gloves and a hat, drop them after the warm-up.</li><li>Ice or frost: treadmill day — ankles matter more than being outside.</li></ul>`],
    ['👟 Shoes, surfaces, niggles', `<ul><li>Race shoe = a shoe with good grip on the venue floor; train in it at least 3–4 times before race day.</li><li>Shoes last ~600–800 km. Flat, even surfaces for the hard reps.</li><li>Shin, calf or Achilles pain that changes how you run → stop, swap to the bike (option 2 below) for 2–3 days and tell Claude.</li></ul>`],
    ['⌚ Apple Watch', `<ul><li>Start an <b>Outdoor Run</b> (or Indoor Run on the treadmill) at the same time as the guided session here.</li><li>Set <b>auto-lap to 1 km</b> and turn on the <b>heart-rate zones</b> view — Zone 2 on the watch ≈ “easy” here.</li><li>Your resting HR and sleep go into the Race Plan morning check each day.</li></ul>`],
  ];
  const OPTIONS = [
    ['🏃 Treadmill', 'Set 1% incline (matches outdoor effort). Same zones, same reps. Best for dark/icy mornings and even pacing. Straddle the belt for the rest jogs if you need.'],
    ['🚴 Bike (spin / Assault / air bike)', 'Sore legs, shins or a bad night. Same minutes and the same RPE. Intervals: each 1 km rep → 4 min at the same effort (2 km → 8 min), same rest. Easy runs: same time in Zone 2.'],
    ['🎿 SkiErg or RowErg', 'Upper-body share when legs need a break. Each 1 km rep → 1000 m at the same RPE, same rest. Easy runs: same minutes at conversational effort. Also trains two race stations.'],
  ];

  function render() {
    const w = week();
    if (!w) { host.innerHTML = ''; return; }
    const s = sessionFor(kind, w);
    const t5 = load(K5, 0);
    host.innerHTML = `
      <div class="race-plan-card rc-card" id="run">
        <span id="circuit-a" class="rc-anchor"></span>
        <div class="race-plan-top"><b>🏃 Run card · week ${w.n}</b><span class="race-plan-tag hard">Runs</span></div>
        <div class="rc-kinds" role="tablist">
          ${[['iv', 'Tue · Circuit A intervals'], ['easy', 'Thu · easy'], ['long', 'Sun · long']].map(([k, l]) => `<button type="button" class="race-preset-btn ${k === kind ? 'active' : ''}" data-rc-kind="${k}" ${live ? 'disabled' : ''}>${l}</button>`).join('')}
        </div>
        ${live ? liveHTML() : `
          <div class="race-plan-main">${esc(s.title)}</div>
          <div class="rc-muted">${esc(s.sub)}</div>
          ${s.kind === 'iv' ? `<ol class="race-plan-steps">${phasesFor(s).filter((p) => p.type !== 'rest').reduce((acc, p) => { if (p.type === 'work') { if (p.rep === 1) acc.push(`${s.iv.reps} × ${p.dist ? (p.dist >= 1000 ? p.dist / 1000 + ' km' : p.dist + ' m') : clock(p.secs * 1000)} ${ZONES[p.zone].name.toLowerCase()}, ${s.iv.rest} s easy jog between${paceTxt(p.zone, p.dist) ? ' — ' + paceTxt(p.zone, p.dist) : ''}`); } else acc.push(p.label + (p.secs ? ` (${clock(p.secs * 1000)})` : '')); return acc; }, []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`
            : `<div class="rc-muted">${esc(ZONES.easy.talk)} · ${esc(ZONES.easy.hr)}${paceTxt('easy') ? ' · ' + esc(paceTxt('easy')) : ''}. Halfway buzz included.</div>`}
          <div class="race-plan-actions">
            <button type="button" class="race-plan-btn" data-rc="start">▶ Start guided run</button>
            <a class="race-plan-btn ghost" href="${s.kind === 'iv' ? 'gym-alison.html?day=upper' : s.kind === 'easy' ? 'gym-alison.html?day=strC' : 'race-plan.html#today'}">${s.kind === 'iv' ? 'Upper strength (4:30) ›' : s.kind === 'easy' ? 'Strength C (4:30) ›' : 'Race Plan ›'}</a>
          </div>`}
        <label class="rc-5k">Recent 5 km time <input id="rc-5k" inputmode="numeric" placeholder="e.g. 24:30" value="${t5 ? clock(t5 * 1000) : ''}" /> <small>${t5 ? 'paces on' : 'add it for real paces — or use your benchmark 1 km average × 5'}</small></label>
        <details class="rc-sec"><summary>Effort zones &amp; paces</summary>${zonesHTML()}</details>
        ${GUIDE.map(([h, b]) => `<details class="rc-sec"><summary>${h}</summary>${b}</details>`).join('')}
        <details class="rc-sec"><summary>🔁 Can’t run today? 3 replacement options</summary>
          <div class="rc-opts">${OPTIONS.map(([h, b], i) => `<div class="rc-opt"><b>Option ${i + 1} · ${h}</b><span>${b}</span></div>`).join('')}</div></details>
        <details class="rc-sec" ${load(LOG, []).length ? 'open' : ''}><summary>📈 Recent runs</summary>${historyHTML()}</details>
      </div>`;
    if (live) paintLive();
  }

  host.addEventListener('click', (e) => {
    const k = e.target.closest('[data-rc-kind]');
    if (k && !live) { kind = k.dataset.rcKind; save(KIND, kind); render(); return; }
    const b = e.target.closest('[data-rc]'); if (!b) return;
    const a = b.dataset.rc;
    if (a === 'start') start(); else if (a === 'pause') togglePause(); else if (a === 'next') next(false); else if (a === 'stop') stop();
  });
  host.addEventListener('change', (e) => {
    if (e.target.id !== 'rc-5k') return;
    const m = /^(\d{1,2}):(\d{2})$/.exec(e.target.value.trim());
    if (!e.target.value.trim()) save(K5, 0);
    else if (m && +m[2] < 60) save(K5, +m[1] * 60 + +m[2]);
    else { toast('Use mm:ss, e.g. 24:30'); return; }
    render();
  });

  render();
  if (live) { requestWake(); loop(); }
})();
