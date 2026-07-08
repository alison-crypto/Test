// muaythai.js — 5-level partner Muay Thai class with an auto-running round timer.
//
// Format (~45–50 min): warm-up + conditioning intervals → partner combo rounds
// (one holds pads while the other performs ~10-rep combos; a SWITCH bell at
// half-time swaps holder/striker) → full-power finisher (both legs + hands) →
// a variable core exercise (rotates daily).
//
// Combos are leveled from real gym curricula (fundamentals → hooks/kicks →
// knees/elbows/clinch → sweeps/spins → elite flow): L1 punches+teep+basic kick,
// L2 hooks/uppercuts+switch kick, L3 knees+elbows+counters, L4 clinch/sweeps/
// spinning backfist, L5 question-mark kick/spinning elbow/flying knee.
//
// The clock is wall-anchored (locking the phone never loses time), auto-advances
// through every segment, and rings distinct alarms: work start (3 high beeps),
// pad switch (2 mid), rest start (1 long low), class done (rising bell), plus
// tick-tick-tick on the last 3 seconds. Wake Lock keeps the screen on.
//
// Storage: rtc_mt_level_v1 (chosen level), rtc_mt_state_v1 (live class state).

const LEVELS = [
  { key: 'l1', label: 'L1', name: 'Foundation' },
  { key: 'l2', label: 'L2', name: 'Builder' },
  { key: 'l3', label: 'L3', name: 'Eight Limbs' },
  { key: 'l4', label: 'L4', name: 'Fight Flow' },
  { key: 'l5', label: 'L5', name: 'Elite' },
];

// Combos per level. Numbers: 1 jab · 2 cross · 3 lead hook · 4 rear hook ·
// 5 lead uppercut · 6 rear uppercut. ~10 reps per turn, partner holds pads.
const COMBOS = {
  l1: [
    { name: '1 – 2', detail: 'Jab – Cross. The bread and butter — snap and return to guard.' },
    { name: '1 – 1 – 2', detail: 'Double jab – cross. Second jab is the range-stealer.' },
    { name: '1 – 2 + Lead Teep', detail: 'Punches then push them off with the teep — knee up first, hip through.' },
    { name: '1 – 2 + Rear Body Kick', detail: 'Step out 45°, pivot fully, shin through the pad.' },
  ],
  l2: [
    { name: '1 – 2 – 3', detail: 'Jab – cross – lead hook. Pivot the lead foot on the hook.' },
    { name: '1 – 2 + Switch Kick', detail: 'Quick scissor-switch, lead-leg kick — no pause after the switch.' },
    { name: '2 – 3 + Low Kick', detail: 'Cross – hook, then chop the rear kick to the thigh pad.' },
    { name: '1 – 2 – 5 – 2', detail: 'Uppercut splits the guard — dip the knees, drive up, finish with the cross.' },
  ],
  l3: [
    { name: '1 – 2 – 3 + Rear Knee', detail: 'Punch flow into a straight knee (khao trong) — hips spear through.' },
    { name: '1 – 2 + Horizontal Elbow', detail: 'Close the distance, sok tat slashes across — short-range only.' },
    { name: 'Teep + 2 – 3 + Low Kick', detail: 'Teep to create range, close with hands, finish downstairs.' },
    { name: 'Check → 2 + Body Kick', detail: 'Holder throws a light kick — CHECK it, counter cross + kick.' },
    { name: '1 – 2 – 3 – 2 + Body Kick', detail: 'Long flow — keep the guard tall between shots.' },
  ],
  l4: [
    { name: '1 – 2 + Body Kick ×2', detail: 'Same-side double kick — first one light, second one full.' },
    { name: 'Catch → Sweep → 2', detail: 'Holder feeds a body kick — scoop it, sweep the standing leg (control!), land the cross.' },
    { name: '1 – 6 – 3 + Low Kick', detail: 'Rear uppercut splits the middle, hook wheels around, chop the leg.' },
    { name: 'Clinch → 3 Knees → Push + Kick', detail: 'Collar tie, 3 alternating knees, shove off, body kick as they exit.' },
    { name: '2 – 3 + Spinning Backfist', detail: 'Hook turns you halfway — keep spinning, LOOK first, whip the backfist.' },
  ],
  l5: [
    { name: '1 – 2 + Question-Mark Kick', detail: 'Chamber like a teep, whip it over the guard — sell the fake.' },
    { name: '3 – 2 + Spinning Elbow', detail: 'Hook-cross turns them square, step across, sok klap through the pad.' },
    { name: 'Teep-Fake → Superman + Low Kick', detail: 'Kradot chok — kick the rear leg back as the cross launches, land into the low kick.' },
    { name: '1 – 2 + Flying Knee', detail: 'Step-hop off the rear leg, khao loi — frame with the arms, land balanced.' },
    { name: 'Free Flow — All 8 Limbs', detail: 'Holder calls anything from L1–L5. React, flow, breathe.' },
  ],
};

// Variable core finisher — rotates daily.
const CORES = [
  { name: 'Plank Hold', detail: 'Straight line, glutes tight — breathe shallow and hold.' },
  { name: 'Hollow-Body Hold', detail: 'Low back pressed down, arms and legs long.' },
  { name: 'Russian Twists', detail: 'Feet up, rotate shoulder to shoulder — controlled, no bouncing.' },
  { name: 'Leg Raises', detail: 'Slow up, slower down, low back stays glued to the floor.' },
  { name: 'Side Plank (switch halfway)', detail: 'Hips tall, top arm to the ceiling.' },
  { name: 'Sit-Up Ladder', detail: 'Max clean sit-ups in the round — remember the number, beat it next week.' },
  { name: 'Dead Bug', detail: 'Opposite arm/leg reach, exhale hard every rep.' },
];

const S = 1000;
const M = 60000;

// Build the level's segment list. Each: {group, name, detail, work, rest, switch}
function buildSegments(lvlKey) {
  const segs = [];
  const hard = lvlKey === 'l4' || lvlKey === 'l5';

  // ---- Warm-up + conditioning (~13 min) ----
  segs.push({ group: 'Warm-up', name: 'Skip Rope / Jog', detail: 'Balls of the feet, easy rhythm — wake the calves up.', work: 3 * M, rest: 30 * S });
  segs.push({ group: 'Warm-up', name: 'Dynamic Mobility', detail: 'Leg swings · hip circles · ankle rolls · arm circles · walking lunges with twist.', work: 3 * M, rest: 15 * S });
  segs.push({ group: 'Warm-up', name: 'Shadowbox Round', detail: 'Move the whole round — stance, rhythm march, checks, light combos from your level.', work: 2 * M, rest: 30 * S });
  const condMoves = hard ? 'Burpees · squats · push-ups · mountain climbers' : 'Squats · push-ups · jumping jacks';
  for (let r = 1; r <= 4; r++) {
    segs.push({ group: 'Warm-up', name: `Conditioning ${r}/4`, detail: `${condMoves} — rotate each interval, hard pace.`, work: 30 * S, rest: 15 * S });
  }

  // ---- Partner combos (~19–24 min) ----
  COMBOS[lvlKey].forEach((c, i) => {
    segs.push({
      group: 'Combos', name: `Combo ${i + 1}: ${c.name}`,
      detail: `${c.detail} ~10 reps per turn, partner holds pads — SWITCH bell at half-time swaps striker & holder.`,
      work: 4 * M, rest: 45 * S, switch: true,
    });
  });

  // ---- Full-power finisher (~7 min) ----
  segs.push({ group: 'Finisher', name: 'Power Kicks — LEFT leg', detail: 'Full-strength roundhouses on the pads/bag. Both partners alternate sets of 5.', work: 2 * M, rest: 20 * S });
  segs.push({ group: 'Finisher', name: 'Power Kicks — RIGHT leg', detail: 'Same — full pivot every kick, no arm-only swings.', work: 2 * M, rest: 20 * S });
  segs.push({ group: 'Finisher', name: 'All-Out Punches', detail: 'Non-stop straight punches on the pads/bag — sprint the last 20 seconds.', work: 90 * S, rest: 30 * S });

  // ---- Variable core (~3 min) ----
  const day = Math.floor(Date.now() / 86400000);
  const core = CORES[day % CORES.length];
  for (let r = 1; r <= 2; r++) {
    segs.push({ group: 'Core', name: `Core ${r}/2: ${core.name}`, detail: core.detail, work: 60 * S, rest: r === 1 ? 30 * S : 0 });
  }
  return segs;
}

// Flatten segments into a timeline of work/rest entries.
function buildTimeline(segs) {
  const t = [];
  segs.forEach((seg, si) => {
    t.push({ type: 'work', si, dur: seg.work, sw: !!seg.switch });
    if (seg.rest > 0) t.push({ type: 'rest', si, dur: seg.rest });
  });
  return t;
}

// ============================================================
// State
// ============================================================
const LVL_KEY = 'rtc_mt_level_v1';
const ST_KEY  = 'rtc_mt_state_v1';
function loadJSON(k, f) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch { return f; } }
function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

let lvl = loadJSON(LVL_KEY, 'l1');
if (!COMBOS[lvl]) lvl = 'l1';
let SEGS = buildSegments(lvl);
let TL = buildTimeline(SEGS);

// st: {i, running, remainMs, endAt, totalMs, totalAnchor, swFired, done}
let st = loadJSON(ST_KEY, null);
if (!st || st.lvl !== lvl) st = freshState();
function freshState() {
  return { lvl, i: 0, running: false, remainMs: TL[0].dur, endAt: null, totalMs: 0, totalAnchor: null, swFired: false, done: false };
}
function persist() { saveJSON(ST_KEY, st); }

function pad(n) { return String(n).padStart(2, '0'); }
function fmt(ms) {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
function totalElapsed() { return st.totalMs + (st.running && st.totalAnchor ? Date.now() - st.totalAnchor : 0); }
function segRemain() { return st.running && st.endAt ? st.endAt - Date.now() : st.remainMs; }

// ============================================================
// Sounds — distinct alarm per transition + last-3s ticks
// ============================================================
let actx = null;
function ensureAudio() {
  if (actx) return;
  try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { actx = new AC(); if (actx.state === 'suspended') actx.resume().catch(() => {}); } } catch {}
}
function tone(freq, at, dur, vol) {
  if (!actx) return;
  try {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(actx.destination);
    o.start(at); o.stop(at + dur + 0.05);
  } catch {}
}
function bell(kind) {
  ensureAudio();
  if (!actx) return;
  const now = actx.currentTime;
  if (kind === 'work')   { [0, 0.22, 0.44].forEach((d) => tone(880, now + d, 0.18, 0.5)); try { navigator.vibrate && navigator.vibrate([150, 80, 150, 80, 150]); } catch {} }
  if (kind === 'switch') { [0, 0.25].forEach((d) => tone(660, now + d, 0.22, 0.5)); try { navigator.vibrate && navigator.vibrate([250, 100, 250]); } catch {} }
  if (kind === 'rest')   { tone(440, now, 0.6, 0.5); try { navigator.vibrate && navigator.vibrate(400); } catch {} }
  if (kind === 'tick')   { tone(660, now, 0.09, 0.35); }
  if (kind === 'done')   { [[880, 0], [1100, 0.2], [1320, 0.4]].forEach(([f, d]) => tone(f, now + d, 0.3, 0.5)); try { navigator.vibrate && navigator.vibrate([200, 100, 200, 100, 500]); } catch {} }
}

// ============================================================
// Wake lock
// ============================================================
let wakeLock = null;
async function requestWake() {
  if (!('wakeLock' in navigator)) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } catch {}
}
function releaseWake() { if (wakeLock) { try { wakeLock.release(); } catch {} wakeLock = null; } }

// ============================================================
// Engine
// ============================================================
let tickId = null, lastTickSec = null;
function startTick() { if (!tickId) tickId = setInterval(onTick, 200); }
function stopTick() { if (tickId) { clearInterval(tickId); tickId = null; } }

function startClass() {
  if (st.running || st.done) return;
  ensureAudio();
  st.running = true;
  st.endAt = Date.now() + st.remainMs;
  st.totalAnchor = Date.now();
  persist(); startTick(); requestWake();
  bell('work');
  paint();
}
function pauseClass() {
  if (!st.running) return;
  st.remainMs = Math.max(0, st.endAt - Date.now());
  st.totalMs += Date.now() - st.totalAnchor;
  st.running = false; st.endAt = null; st.totalAnchor = null;
  persist(); stopTick(); releaseWake(); paint();
}
function resetClass() {
  if (!confirm('Reset the class timer?')) return;
  stopTick(); releaseWake();
  st = freshState(); persist(); paint();
}
function jumpTo(tlIndex, silent) {
  st.i = Math.max(0, Math.min(TL.length - 1, tlIndex));
  st.swFired = false; st.done = false;
  const dur = TL[st.i].dur;
  if (st.running) st.endAt = Date.now() + dur;
  st.remainMs = dur;
  persist();
  if (!silent) bell(TL[st.i].type === 'rest' ? 'rest' : 'work');
  paint();
}
function advance() {
  if (st.i >= TL.length - 1) {
    st.done = true; st.running = false;
    st.totalMs += st.totalAnchor ? Date.now() - st.totalAnchor : 0;
    st.totalAnchor = null; st.endAt = null; st.remainMs = 0;
    persist(); stopTick(); releaseWake();
    bell('done');
    paint();
    return;
  }
  st.i += 1; st.swFired = false;
  const e = TL[st.i];
  st.endAt = (st.endAt || Date.now()) + e.dur;   // chain precisely from the last boundary
  st.remainMs = e.dur;
  persist();
  bell(e.type === 'rest' ? 'rest' : 'work');
  paint();
}

function onTick() {
  if (!st.running) return;
  const rem = st.endAt - Date.now();
  const e = TL[st.i];
  // half-time pad switch bell on combo work
  if (e.type === 'work' && e.sw && !st.swFired && rem <= e.dur / 2) { st.swFired = true; bell('switch'); persist(); }
  // last-3-seconds ticks
  const sec = Math.ceil(rem / 1000);
  if (sec !== lastTickSec && sec <= 3 && sec >= 1) { lastTickSec = sec; bell('tick'); }
  if (rem <= 0) { advance(); return; }
  paintClock();
}

// Catch up after the phone was locked/backgrounded.
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !st.running) return;
  while (st.running && st.endAt - Date.now() <= 0) advance();
  if (st.running && !wakeLock) requestWake();
  paint();
});

// ============================================================
// Save to Tracker
// ============================================================
function todayStr() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
function saveToTracker() {
  const doneCount = st.done ? SEGS.length : TL[st.i] ? TL[st.i].si : 0;
  const exercises = SEGS.map((s, i) => ({
    exId: `mt_${lvl}_${i}`, name: s.name, target: fmt(s.work),
    done: st.done || i < doneCount, sets: [{ w: '', r: fmt(s.work) }],
  }));
  try {
    const KEY = 'rtc_tracker_training_v1';
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    arr.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), date: todayStr(),
      person: 'him', day: 'muaythai', dayLabel: `Muay Thai ${lvl.toUpperCase()} class · ${fmt(totalElapsed())}`, exercises });
    localStorage.setItem(KEY, JSON.stringify(arr));
    toast('✓ Saved to Tracker');
  } catch { toast('Could not save.'); }
}
function toast(msg) { const t = document.createElement('div'); t.className = 't-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }

// ============================================================
// Render
// ============================================================
const root = document.getElementById('mt-root');
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const RING = 2 * Math.PI * 52;

function paintClock() {
  const e = TL[st.i];
  const seg = SEGS[e.si];
  const rem = segRemain();
  const clk = document.getElementById('mt-clock'); if (clk) clk.textContent = fmt(rem);
  const tot = document.getElementById('mt-total'); if (tot) tot.textContent = `class ${fmt(totalElapsed())}`;
  const ring = document.getElementById('mt-ring');
  if (ring) ring.style.strokeDashoffset = String(RING * (1 - Math.max(0, Math.min(1, rem / e.dur))));
  const lbl = document.getElementById('mt-seg');
  if (lbl) lbl.textContent = st.done ? '🏁 Class complete!' : (e.type === 'rest' ? `REST — next: ${SEGS[TL[Math.min(st.i + 1, TL.length - 1)].si].name}` : seg.name);
  const phase = document.getElementById('mt-phase');
  if (phase) {
    phase.textContent = st.done ? '' : e.type === 'rest' ? '😮‍💨 rest' : e.sw ? (st.swFired ? '🔁 partner B strikes' : '🥊 partner A strikes') : '🔥 work';
    phase.className = 'mt-phase ' + (e.type === 'rest' ? 'is-rest' : 'is-work');
  }
}

function paint() {
  const cur = TL[st.i];
  let listHTML = '';
  let group = '';
  SEGS.forEach((s, si) => {
    if (s.group !== group) { group = s.group; listHTML += `<div class="lib-group-title">${esc(group)}</div>`; }
    const active = cur && cur.si === si && !st.done;
    const past = st.done || (cur && cur.si > si);
    const tlIndex = TL.findIndex((e) => e.si === si && e.type === 'work');
    listHTML += `
      <div class="mt-seg ${active ? 'active' : ''} ${past ? 'past' : ''}" data-tl="${tlIndex}">
        <div class="mt-seg-time">${fmt(s.work)}${s.rest ? `<span> +${Math.round(s.rest / 1000)}s rest</span>` : ''}</div>
        <div class="mt-seg-body">
          <div class="mt-seg-name">${esc(s.name)}${s.switch ? ' <span class="mt-sw">🔁 switch @ half</span>' : ''}</div>
          <div class="mt-seg-detail">${esc(s.detail)}</div>
        </div>
        <div class="mt-seg-mark">${past ? '✓' : active ? '▶' : ''}</div>
      </div>`;
  });

  root.innerHTML = `
    <div class="race-preset">
      <span class="race-preset-lbl">Level →</span>
      ${LEVELS.map((L) => `<button type="button" class="race-preset-btn ${L.key === lvl ? 'grpg-active' : ''}" data-lvl="${L.key}">${L.label}</button>`).join('')}
    </div>
    <div class="lib-blurb"><b>${esc(LEVELS.find((L) => L.key === lvl).name)}</b> — ${COMBOS[lvl].length} partner combos · ~${Math.round(SEGS.reduce((a, s) => a + s.work + s.rest, 0) / 60000)} min total. One strikes ~10-rep combos, one holds pads — the 🔁 bell swaps you. Keep sound ON.</div>

    <div class="race-timer">
      <div class="race-dial">
        <svg class="race-ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle class="race-ring-bg" cx="60" cy="60" r="52"></circle>
          <circle class="race-ring-fg" id="mt-ring" cx="60" cy="60" r="52" stroke-dasharray="326.7" stroke-dashoffset="0" transform="rotate(-90 60 60)"></circle>
        </svg>
        <div class="race-dial-c">
          <div class="race-clock" id="mt-clock">${fmt(segRemain())}</div>
          <div class="mt-phase" id="mt-phase"></div>
          <div class="race-seg-live" id="mt-total">class ${fmt(totalElapsed())}</div>
        </div>
      </div>
      <div class="mt-seg-label" id="mt-seg"></div>
      <div class="race-timer-controls">
        <button type="button" class="race-btn race-btn-go" id="mt-go" ${st.done ? 'disabled' : ''}>▶ ${totalElapsed() > 0 ? 'Resume' : 'Start class'}</button>
        <button type="button" class="race-btn" id="mt-pause" ${!st.running ? 'disabled' : ''}>❚❚ Pause</button>
        <button type="button" class="race-btn" id="mt-skip" ${st.done ? 'disabled' : ''}>Skip ▸</button>
        <button type="button" class="race-btn" id="mt-reset">Reset</button>
      </div>
    </div>

    ${listHTML}

    <div class="race-actions">
      <button type="button" class="ghost-btn gym-save-tracker" id="mt-save">Save to Tracker</button>
    </div>`;
  paintClock();
}

root.addEventListener('click', (e) => {
  const lvlBtn = e.target.closest('[data-lvl]');
  if (lvlBtn) {
    if (totalElapsed() > 0 && !confirm('Change level? The class timer resets.')) return;
    lvl = lvlBtn.dataset.lvl; saveJSON(LVL_KEY, lvl);
    SEGS = buildSegments(lvl); TL = buildTimeline(SEGS);
    stopTick(); releaseWake(); st = freshState(); persist(); paint();
    return;
  }
  if (e.target.closest('#mt-go'))    { startClass(); return; }
  if (e.target.closest('#mt-pause')) { pauseClass(); return; }
  if (e.target.closest('#mt-skip'))  { ensureAudio(); advance(); return; }
  if (e.target.closest('#mt-reset')) { resetClass(); return; }
  if (e.target.closest('#mt-save'))  { saveToTracker(); return; }
  const segCard = e.target.closest('.mt-seg');
  if (segCard) { ensureAudio(); jumpTo(Number(segCard.dataset.tl), false); return; }
});

// resume a running class after reload
if (st.running) {
  while (st.running && st.endAt - Date.now() <= 0) advance();
  if (st.running) { startTick(); requestWake(); }
}
paint();
