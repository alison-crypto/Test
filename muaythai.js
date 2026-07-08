// muaythai.js — 5-level partner Muay Thai class · landscape "class screen" player.
//
// Designed to run on a phone propped SIDEWAYS across the room:
//   ┌──────────────────────────────┬─────────┐
//   │  exercise card (3/4):        │ segment │  ← big countdown (3/4 of column)
//   │  BIG name · rep target ·     │  clock  │
//   │  short bullets               ├─────────┤
//   │                              │ ⏮ ⏸ ⏭  │  ← controls
//   │                              ├─────────┤
//   │                              │  class  │  ← main clock, runs all session
//   └──────────────────────────────┴─────────┘
// Targets are REP-based (time windows only drive the card changes): mobility →
// rope → shadowbox → 4 conditioning exercises (reps, no rest) → partner combos
// (×20 reps each, 🔁 switch bell at half — holder rests while holding) → power
// strikes ×50 each → daily-rotating core. A 💧 water break lands after every
// 2 cards. Alarms: 3 high = work · 2 mid = switch pads · 1 long low = water ·
// ticks on the last 3 s · rising bell = class done. Wall-anchored (survives
// phone lock), Wake Lock keeps the screen on.
//
// Storage: rtc_mt_level_v1 (level), rtc_mt_state_v1 (live class state).

const LEVELS = [
  { key: 'l1', label: 'L1', name: 'Foundation' },
  { key: 'l2', label: 'L2', name: 'Builder' },
  { key: 'l3', label: 'L3', name: 'Eight Limbs' },
  { key: 'l4', label: 'L4', name: 'Fight Flow' },
  { key: 'l5', label: 'L5', name: 'Elite' },
];

// Numbers: 1 jab · 2 cross · 3 lead hook · 4 rear hook · 5 lead uppercut · 6 rear uppercut.
const COMBOS = {
  l1: [
    { name: '1 – 2', bullets: ['Jab – cross, snap and return to guard', 'Full hip on the cross', 'Holder: firm pads at head height'] },
    { name: '1 – 1 – 2', bullets: ['Double jab steals the range', 'Cross comes up the middle', 'Stay tall — no leaning in'] },
    { name: '1 – 2 + Lead Teep', bullets: ['Punch, then push them off', 'Knee up first, hip through the teep', 'Re-chamber — don’t fall forward'] },
    { name: '1 – 2 + Rear Body Kick', bullets: ['Step out 45°, pivot fully', 'Shin through the pad, not the foot', 'Arm swings down for torque'] },
  ],
  l2: [
    { name: '1 – 2 – 3', bullets: ['Pivot the lead foot on the hook', 'Elbow stays ~90° on the 3', 'Guard tall between shots'] },
    { name: '1 – 2 + Switch Kick', bullets: ['Quick scissor-switch — small hop', 'Fire the lead-leg kick instantly', 'No pause after the switch'] },
    { name: '2 – 3 + Low Kick', bullets: ['Cross–hook turns them', 'Chop the rear kick to the thigh pad', 'Slight downward angle'] },
    { name: '1 – 2 – 5 – 2', bullets: ['Dip the knees for the uppercut', 'Drive UP through the legs', 'Finish with a clean cross'] },
  ],
  l3: [
    { name: '1 – 2 – 3 + Rear Knee', bullets: ['Punch flow into khao trong', 'Hips spear the knee through', 'Rise onto the ball of the support foot'] },
    { name: '1 – 2 + Horizontal Elbow', bullets: ['Step IN — elbows are short range', 'Sok tat slashes across, palm down', 'Body rotates, not just the arm'] },
    { name: 'Teep + 2 – 3 + Low Kick', bullets: ['Teep makes the space', 'Close with hands', 'Finish downstairs'] },
    { name: 'Check → 2 + Body Kick', bullets: ['Holder feeds a light kick — CHECK it', 'Knee up and out, stay upright', 'Counter cross + kick immediately'] },
    { name: '1 – 2 – 3 – 2 + Body Kick', bullets: ['Long flow — breathe through it', 'Every punch full rotation', 'Kick lands as they cover'] },
  ],
  l4: [
    { name: '1 – 2 + Body Kick ×2', bullets: ['Same-side double kick', 'First light, second FULL', 'Re-pivot between kicks'] },
    { name: 'Catch → Sweep → 2', bullets: ['Scoop the fed body kick', 'Sweep the standing leg — CONTROL', 'Land the cross as they recover'] },
    { name: '1 – 6 – 3 + Low Kick', bullets: ['Rear uppercut splits the middle', 'Hook wheels around', 'Chop the leg on the exit'] },
    { name: 'Clinch → 3 Knees → Push + Kick', bullets: ['Collar tie, posture TALL', '3 alternating knees, pull them in', 'Shove off, kick as they exit'] },
    { name: '2 – 3 + Spinning Backfist', bullets: ['Hook turns you halfway', 'LOOK over the shoulder first', 'Whip the back of the fist through'] },
  ],
  l5: [
    { name: '1 – 2 + Question-Mark Kick', bullets: ['Chamber like a teep — sell it', 'Whip over the guard to the head pad', 'Hip mobility: warm up first'] },
    { name: '3 – 2 + Spinning Elbow', bullets: ['Hook-cross squares them up', 'Step across the centerline', 'Sok klap — look, then spin'] },
    { name: 'Teep-Fake → Superman + Low Kick', bullets: ['Kick the rear leg BACK as the cross launches', 'Land forward into stance', 'Low kick finishes the exit'] },
    { name: '1 – 2 + Flying Knee', bullets: ['Step-hop off the rear leg', 'Khao loi — knee up as you rise', 'Frame with the arms, land balanced'] },
    { name: 'Free Flow — All 8 Limbs', bullets: ['Holder calls anything L1–L5', 'React, flow, breathe', 'Quality over speed'] },
  ],
};

// Variable core — rotates daily.
const CORES = [
  { name: 'Plank Hold', reps: 'max hold', bullets: ['Straight line, glutes tight', 'Don’t let the hips sag'] },
  { name: 'Hollow-Body Hold', reps: 'max hold', bullets: ['Low back pressed to the floor', 'Arms and legs long'] },
  { name: 'Russian Twists', reps: '×40 total', bullets: ['Feet up, shoulder-to-shoulder', 'Controlled — no bouncing'] },
  { name: 'Leg Raises', reps: '×20', bullets: ['Slow up, slower down', 'Low back stays glued down'] },
  { name: 'Side Plank', reps: 'switch halfway', bullets: ['Hips tall', 'Top arm to the ceiling'] },
  { name: 'Sit-Up Ladder', reps: 'max reps', bullets: ['Count them — beat it next week', 'Full range, no neck pulling'] },
  { name: 'Dead Bug', reps: '×20 total', bullets: ['Opposite arm/leg reach', 'Exhale hard every rep'] },
];

const S = 1000, M = 60000;

// Build the class. Each card: {group, name, reps, bullets, dur, sw?, water?}
function buildSegments(lvlKey) {
  const hard = lvlKey === 'l4' || lvlKey === 'l5';
  const cards = [];

  // Warm-up — mobility first (no rest), then rope, then shadowbox.
  cards.push({ group: 'Warm-up', name: 'Dynamic Mobility', reps: 'flow, no rest', dur: 3 * M,
    bullets: ['Leg swings · hip circles · ankle rolls', 'Arm circles · neck easy', 'Walking lunge + twist'] });
  cards.push({ group: 'Warm-up', name: 'Skip Rope', reps: 'steady rhythm', dur: 3 * M,
    bullets: ['Balls of the feet', 'Wrists spin the rope', 'Mix in the Thai two-foot bounce'] });
  cards.push({ group: 'Warm-up', name: 'Shadowbox', reps: 'light combos', dur: 2 * M,
    bullets: ['Move the WHOLE round', 'Stance · rhythm march · checks', 'Light combos from your level'] });

  // Conditioning — 4 different exercises, rep targets, straight through.
  const cond = hard
    ? [['Burpees', '×12'], ['Jump Squats', '×15'], ['Push-Ups', '×15'], ['Mountain Climbers', '×30 total']]
    : [['Squats', '×20'], ['Push-Ups', '×12'], ['Jumping Jacks', '×30'], ['Mountain Climbers', '×20 total']];
  cond.forEach(([n, r]) => cards.push({ group: 'Conditioning', name: n, reps: r + ' · no rest', dur: 60 * S,
    bullets: n === 'Push-Ups' ? ['Rigid plank, elbows ~45°', 'Chest to fist height'] :
             n === 'Burpees' ? ['Chest to floor', 'Jump with feet together'] :
             ['Hard pace, clean reps', 'Straight into the next one'] }));

  // Partner combos — ×20 reps each, switch bell at half. Holder rests by holding.
  COMBOS[lvlKey].forEach((c, i) => {
    cards.push({ group: 'Combos', name: `Combo ${i + 1}: ${c.name}`, reps: '×20 reps each · 🔁 switch at bell',
      dur: 4 * M, sw: true, bullets: c.bullets });
  });

  // Power strikes — 50 each, full strength.
  cards.push({ group: 'Power', name: 'Power Kicks — LEFT', reps: '×50 full strength', dur: 150 * S,
    bullets: ['Full pivot EVERY kick', 'Sets of 5–10, partner counts', 'Shin through the pad'] });
  cards.push({ group: 'Power', name: 'Power Kicks — RIGHT', reps: '×50 full strength', dur: 150 * S,
    bullets: ['Same standard — no arm-only swings', 'Breathe out sharp on impact', 'Last 10 = hardest 10'] });
  cards.push({ group: 'Power', name: 'Power Punches', reps: '×50 per side, full strength', dur: 90 * S,
    bullets: ['Straight 1-2s, full rotation', 'Sprint the last 20 seconds', 'Hands back to guard every rep'] });

  // Core — variable, rotates daily.
  const core = CORES[Math.floor(Date.now() / 86400000) % CORES.length];
  for (let r = 1; r <= 2; r++) {
    cards.push({ group: 'Core', name: `${core.name} — round ${r}/2`, reps: core.reps, dur: 60 * S, bullets: core.bullets });
  }

  // 💧 water break after every 2 cards (never last).
  const out = [];
  let since = 0;
  cards.forEach((c, i) => {
    out.push(c);
    since += 1;
    if (since === 2 && i < cards.length - 1) {
      out.push({
        group: 'Break', name: 'Water Break', reps: 'sip · shake out · gloves on',
        dur: 45 * S, water: true,
        bullets: ['Breathe through the nose', `Next: ${cards[i + 1].name}`],
      });
      since = 0;
    }
  });
  return out;
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

let st = loadJSON(ST_KEY, null);
if (!st || st.lvl !== lvl || st.n !== SEGS.length) st = freshState();
function freshState() {
  return { lvl, n: SEGS.length, i: 0, running: false, remainMs: SEGS[0].dur, endAt: null, totalMs: 0, totalAnchor: null, swFired: false, done: false };
}
function persist() { saveJSON(ST_KEY, st); }

function pad(n) { return String(n).padStart(2, '0'); }
function fmt(ms) { const s = Math.ceil(Math.max(0, ms) / 1000); return `${Math.floor(s / 60)}:${pad(s % 60)}`; }
function totalElapsed() { return st.totalMs + (st.running && st.totalAnchor ? Date.now() - st.totalAnchor : 0); }
function segRemain() { return st.running && st.endAt ? st.endAt - Date.now() : st.remainMs; }

// ============================================================
// Sounds + vibration
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
  if (kind === 'water')  { tone(440, now, 0.6, 0.5); try { navigator.vibrate && navigator.vibrate(400); } catch {} }
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
  document.body.classList.add('mt-live');
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
  if (!confirm('Reset the class?')) return;
  stopTick(); releaseWake();
  document.body.classList.remove('mt-live');
  st = freshState(); persist(); paint();
}
function goTo(i, ringBell) {
  st.i = Math.max(0, Math.min(SEGS.length - 1, i));
  st.swFired = false; st.done = false;
  st.remainMs = SEGS[st.i].dur;
  if (st.running) st.endAt = Date.now() + st.remainMs;
  persist();
  if (ringBell) bell(SEGS[st.i].water ? 'water' : 'work');
  paint();
}
function advance() {
  if (st.i >= SEGS.length - 1) {
    st.done = true; st.running = false;
    st.totalMs += st.totalAnchor ? Date.now() - st.totalAnchor : 0;
    st.totalAnchor = null; st.endAt = null; st.remainMs = 0;
    persist(); stopTick(); releaseWake();
    bell('done');
    document.body.classList.remove('mt-live');
    paint();
    return;
  }
  st.i += 1; st.swFired = false;
  const seg = SEGS[st.i];
  st.endAt = (st.endAt || Date.now()) + seg.dur;
  st.remainMs = seg.dur;
  persist();
  bell(seg.water ? 'water' : 'work');
  paint();
}
function onTick() {
  if (!st.running) return;
  const rem = st.endAt - Date.now();
  const seg = SEGS[st.i];
  if (seg.sw && !st.swFired && rem <= seg.dur / 2) { st.swFired = true; bell('switch'); persist(); paint(); }
  const sec = Math.ceil(rem / 1000);
  if (sec !== lastTickSec && sec <= 3 && sec >= 1) { lastTickSec = sec; bell('tick'); }
  if (rem <= 0) { advance(); return; }
  paintClock();
}
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
  const exercises = SEGS.filter((s) => !s.water).map((s, i) => ({
    exId: `mt_${lvl}_${i}`, name: s.name, target: s.reps || fmt(s.dur),
    done: st.done || st.i > SEGS.indexOf(s), sets: [{ w: '', r: s.reps || '' }],
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
// Render — landscape class-screen player
// ============================================================
const root = document.getElementById('mt-root');
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function paintClock() {
  const seg = SEGS[st.i];
  const rem = segRemain();
  const sc = document.getElementById('mtv-segclock'); if (sc) sc.textContent = st.done ? '🏁' : fmt(rem);
  const mc = document.getElementById('mtv-mainclock'); if (mc) mc.textContent = fmt(totalElapsed());
  const bar = document.getElementById('mtv-bar');
  if (bar) bar.style.width = `${Math.max(0, Math.min(100, (1 - rem / seg.dur) * 100))}%`;
  const ph = document.getElementById('mtv-phase');
  if (ph) {
    ph.textContent = st.done ? 'DONE' : seg.water ? '💧 WATER' : seg.sw ? (st.swFired ? '🔁 B STRIKES' : '🥊 A STRIKES') : 'WORK';
    ph.className = 'mtv-phase ' + (seg.water ? 'is-rest' : 'is-work');
  }
}

function paint() {
  const seg = SEGS[st.i];
  const next = SEGS[st.i + 1];
  const nonWater = SEGS.filter((s) => !s.water);
  const cardNo = nonWater.indexOf(seg) + 1;

  root.innerHTML = `
    <div class="mt-setup">
      <div class="race-preset">
        <span class="race-preset-lbl">Level →</span>
        ${LEVELS.map((L) => `<button type="button" class="race-preset-btn ${L.key === lvl ? 'grpg-active' : ''}" data-lvl="${L.key}">${L.label}</button>`).join('')}
      </div>
      <div class="lib-blurb"><b>${esc(LEVELS.find((L) => L.key === lvl).name)}</b> · ${COMBOS[lvl].length} combos ×20 each · power strikes ×50 · ~${Math.round(SEGS.reduce((a, s) => a + s.dur, 0) / 60000)} min.
      Turn the phone <b>sideways 📱→🖥️</b> and prop it up — big screen mode kicks in. Sound ON: the bell runs the class.</div>
    </div>

    <div class="mtv ${st.done ? 'mtv-done' : ''} ${seg.water ? 'mtv-water' : ''}">
      <div class="mtv-main">
        <div class="mtv-group">${esc(seg.group)}${seg.water ? '' : ` · ${cardNo}/${nonWater.length}`}${st.done ? ' · CLASS COMPLETE 🏁' : ''}</div>
        <div class="mtv-name">${st.done ? 'Great work! 🙌' : esc(seg.name)}</div>
        <div class="mtv-reps">${st.done ? `total ${fmt(totalElapsed())}` : esc(seg.reps || '')}</div>
        <ul class="mtv-bullets">${(st.done ? ['Save it to the Tracker', 'Stretch + water', 'Same time next week?'] : seg.bullets).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        ${next && !st.done ? `<div class="mtv-next">NEXT → ${esc(next.name)}</div>` : ''}
        <div class="mtv-barwrap"><div class="mtv-barfill" id="mtv-bar"></div></div>
      </div>
      <div class="mtv-side">
        <div class="mtv-segwrap">
          <div class="mtv-phase" id="mtv-phase"></div>
          <div class="mtv-segclock" id="mtv-segclock">${fmt(segRemain())}</div>
        </div>
        <div class="mtv-ctrl">
          <button type="button" id="mt-prev" aria-label="Rewind">⏮</button>
          <button type="button" id="mt-toggle" aria-label="Play/Pause">${st.running ? '⏸' : '▶'}</button>
          <button type="button" id="mt-skip" aria-label="Skip">⏭</button>
        </div>
        <div class="mtv-mainwrap"><span class="mtv-mainlbl">CLASS</span><span class="mtv-mainclock" id="mtv-mainclock">${fmt(totalElapsed())}</span></div>
      </div>
    </div>

    <div class="mt-setup race-actions">
      <button type="button" class="ghost-btn gym-save-tracker" id="mt-save">Save to Tracker</button>
      <button type="button" class="ghost-btn ghost-btn-danger" id="mt-reset">Reset class</button>
    </div>

    <div class="mt-setup mt-list">
      ${SEGS.map((s, i) => `
        <div class="mt-seg ${i === st.i && !st.done ? 'active' : ''} ${st.done || i < st.i ? 'past' : ''} ${s.water ? 'mt-seg-water' : ''}" data-i="${i}">
          <div class="mt-seg-time">${fmt(s.dur)}</div>
          <div class="mt-seg-body">
            <div class="mt-seg-name">${esc(s.name)}${s.sw ? ' <span class="mt-sw">🔁</span>' : ''}</div>
            <div class="mt-seg-detail">${esc(s.reps || '')}</div>
          </div>
          <div class="mt-seg-mark">${st.done || i < st.i ? '✓' : i === st.i ? '▶' : ''}</div>
        </div>`).join('')}
    </div>`;
  paintClock();
}

root.addEventListener('click', (e) => {
  const lvlBtn = e.target.closest('[data-lvl]');
  if (lvlBtn) {
    if (totalElapsed() > 0 && !confirm('Change level? The class resets.')) return;
    lvl = lvlBtn.dataset.lvl; saveJSON(LVL_KEY, lvl);
    SEGS = buildSegments(lvl);
    stopTick(); releaseWake(); document.body.classList.remove('mt-live');
    st = freshState(); persist(); paint();
    return;
  }
  if (e.target.closest('#mt-toggle')) { st.running ? pauseClass() : startClass(); return; }
  if (e.target.closest('#mt-prev'))   { ensureAudio(); goTo(st.i - 1, true); return; }
  if (e.target.closest('#mt-skip'))   { ensureAudio(); st.i >= SEGS.length - 1 ? advance() : goTo(st.i + 1, true); return; }
  if (e.target.closest('#mt-reset'))  { resetClass(); return; }
  if (e.target.closest('#mt-save'))   { saveToTracker(); return; }
  const segCard = e.target.closest('.mt-seg');
  if (segCard) { ensureAudio(); goTo(Number(segCard.dataset.i), true); return; }
});

// resume a running class after reload
if (st.running) {
  while (st.running && st.endAt - Date.now() <= 0) advance();
  if (st.running) { startTick(); requestWake(); document.body.classList.add('mt-live'); }
}
paint();
