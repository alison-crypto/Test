// hyrox.js — HYROX race simulator (gym-card format + timer, splits, ranks).
//
// A full race is 8 × 1 km runs interleaved with 8 functional stations. This
// page runs that simulation the way Alison's YMCA allows it: SkiErg + RowErg
// first with REAL treadmill runs (those machines sit by the treadmill), then
// every other station in the next room with the bike standing in for the run.
// Kit the Y doesn't have (sled, wall, sandbags) shows the real race target plus
// the working substitute — and every station has a ▾ Swap with 3 options.
//
// Each card keeps the gym look: an exercise image, a Swap menu, and Distance /
// Weight / Reps inputs. On top of that: a sticky total stopwatch, a Split button
// that records each segment's time, a benchmark/record comparison per station,
// and a rank "coin" (Rookie → Elite) whose XP bar fills as the finish time drops.
//
// The stopwatch is anchored to real wall-clock timestamps, so leaving/locking
// the screen never loses time — it recomputes on return. A Wake Lock keeps the
// screen awake during a race.
//
// Storage keys:
//   rtc_hyrox_sim_v1      — live attempt { date, running, accumMs, lastStart, splits{} }
//   rtc_hyrox_log_v1      — { segId:{d,w,r} } structured log, kept across sessions
//   rtc_hyrox_swaps_v1    — { segId: optionIndex } chosen swap
//   rtc_hyrox_pb_v1       — { ms, date } best finish time
//   rtc_hyrox_segpb_v1    — { segId: ms } best split per segment

// ============================================================
// Race definition — 16 segments, in the order he'll do them.
// bench = target split to chase (ms). img = free-exercise-db id or null (emoji).
// subs = 3 options for the ▾ Swap menu (first is the working default).
// ============================================================
const SEGMENTS = [
  { id: 'run1', kind: 'run', icon: '🏃', name: 'Run 1 · 1 km', target: '1 km run', bench: 360000,
    sub: 'Treadmill — steady & controlled, this is the easy one.', img: null,
    subs: ['Treadmill 1 km', 'Outdoor 1 km', 'Bike ~1 km hard'], video: 'treadmill+running+form' },
  { id: 'ski', kind: 'station', icon: '🎿', name: 'SkiErg', num: 1, target: '1000 m', bench: 300000,
    sub: 'Drive from the hips, not just arms. 400 m was easy — hold pace to 1 km.', img: null,
    subs: ['SkiErg 1000 m', 'Row 1000 m (if ski busy)', 'Banded lat pulldowns ×60 hard'], video: 'skierg+technique+hyrox' },
  { id: 'run2', kind: 'run', icon: '🏃', name: 'Run 2 · 1 km', target: '1 km run', bench: 360000,
    sub: 'Treadmill again (Ski + Row are by the treadmill).', img: null,
    subs: ['Treadmill 1 km', 'Outdoor 1 km', 'Bike ~1 km hard'], video: 'treadmill+running+form' },
  { id: 'row', kind: 'station', icon: '🚣', name: 'RowErg', num: 2, target: '1000 m', bench: 270000,
    sub: 'Legs–core–arms order. Long, strong strokes; don’t yank early.', img: 'Rowing_Stationary',
    subs: ['RowErg 1000 m', 'SkiErg 1000 m', 'Bike 2 km hard'], video: 'rowerg+technique+hyrox' },
  { id: 'bike3', kind: 'bike', icon: '🚴', name: 'Bike 3 · run sub', target: '≈ 1 km run effort', bench: 150000,
    sub: 'Other room from here → bike replaces every run. ~90 sec hard.', img: null,
    subs: ['Bike ~1 km hard', 'Treadmill 1 km', 'Row 1 km'], video: 'assault+bike+intervals' },
  { id: 'push', kind: 'station', icon: '🛷', name: 'Sled Push', num: 3, target: '50 m · ~152 kg (race)', bench: 120000,
    sub: 'YMCA has no sled → heavy DB/KB suitcase march 50 m, or a leg-press burnout.', img: 'Sled_Push',
    subs: ['Heavy DB/KB suitcase march 50 m', 'Leg-press burnout ×20–30', 'Prowler / hack-squat if free'], video: 'hyrox+sled+push+technique' },
  { id: 'bike4', kind: 'bike', icon: '🚴', name: 'Bike 4 · run sub', target: '≈ 1 km run effort', bench: 150000,
    sub: '~90 sec hard.', img: null,
    subs: ['Bike ~1 km hard', 'Treadmill 1 km', 'Row 1 km'], video: 'assault+bike+intervals' },
  { id: 'pull', kind: 'station', icon: '🪝', name: 'Sled Pull', num: 4, target: '50 m · ~103 kg (race)', bench: 120000,
    sub: 'No sled → hard seated cable rows / heavy DB bent rows, hand-over-hand tempo.', img: 'Sled_Row',
    subs: ['Seated cable row, hand-over-hand', 'Heavy DB bent row ×50', 'Ring / TRX row ×50'], video: 'hyrox+sled+pull+technique' },
  { id: 'bike5', kind: 'bike', icon: '🚴', name: 'Bike 5 · run sub', target: '≈ 1 km run effort', bench: 150000,
    sub: '~90 sec hard.', img: null,
    subs: ['Bike ~1 km hard', 'Treadmill 1 km', 'Row 1 km'], video: 'assault+bike+intervals' },
  { id: 'bbj', kind: 'station', icon: '🤸', name: 'Burpee Broad Jumps', num: 5, target: '80 m', bench: 270000,
    sub: '⚠️ Brace the lower back · control every landing (ankle). ~15–18 reps ≈ 80 m.', img: null,
    subs: ['Burpee broad jumps 80 m', 'Burpee + step forward (ankle-safe)', 'Squat-thrust + broad step 80 m'], video: 'burpee+broad+jump+form' },
  { id: 'bike6', kind: 'bike', icon: '🚴', name: 'Bike 6 · run sub', target: '≈ 1 km run effort', bench: 150000,
    sub: '~90 sec hard.', img: null,
    subs: ['Bike ~1 km hard', 'Treadmill 1 km', 'Row 1 km'], video: 'assault+bike+intervals' },
  { id: 'carry', kind: 'station', icon: '🧳', name: 'Farmers Carry', num: 6, target: '200 m · 2 × 24 kg (race)', bench: 150000,
    sub: 'Heaviest DBs you can grip — tall chest, brace, don’t shrug.', img: 'Farmers_Walk',
    subs: ['Farmers carry, heaviest DBs 200 m', 'KB rack carry 200 m', 'Trap-bar hold walk 200 m'], video: 'farmers+carry+technique' },
  { id: 'bike7', kind: 'bike', icon: '🚴', name: 'Bike 7 · run sub', target: '≈ 1 km run effort', bench: 150000,
    sub: '~90 sec hard.', img: null,
    subs: ['Bike ~1 km hard', 'Treadmill 1 km', 'Row 1 km'], video: 'assault+bike+intervals' },
  { id: 'lunge', kind: 'station', icon: '🦵', name: 'Sandbag Lunges', num: 7, target: '100 m · 20 kg (race)', bench: 270000,
    sub: 'No sandbags → DB/KB goblet reverse lunges, 100 m. Brace + control the ankle.', img: 'Dumbbell_Lunges',
    subs: ['DB/KB goblet reverse lunge 100 m', 'Walking lunge (bodyweight) 100 m', 'Split squats ×20 / leg'], video: 'goblet+reverse+lunge+form' },
  { id: 'bike8', kind: 'bike', icon: '🚴', name: 'Bike 8 · run sub', target: '≈ 1 km run effort', bench: 150000,
    sub: 'Last one — empty the tank.', img: null,
    subs: ['Bike ~1 km hard', 'Treadmill 1 km', 'Row 1 km'], video: 'assault+bike+intervals' },
  { id: 'wb', kind: 'station', icon: '🏐', name: 'Wall Balls', num: 8, target: '100 reps · 6 kg to 3 m', bench: 330000,
    sub: 'Can’t use the wall → med-ball throw-ups / DB thrusters × 100. Full squat, full extension.', img: null,
    subs: ['Med-ball throw-ups ×100', 'DB thrusters ×100', 'Wall balls ×100 (if wall free)'], video: 'wall+ball+shot+form' },
];

// Rank ladder — finish-time gates (Men's Open). Any completed race = Beginner;
// no finish yet = Rookie. Rank = fastest gate your best finish clears.
const RANKS = [
  { key: 'rookie',   name: 'Rookie',       emoji: '🥚', ms: Infinity },
  { key: 'beginner', name: 'Beginner',     emoji: '🐣', ms: 105 * 60000 },
  { key: 'rising',   name: 'Intermediate', emoji: '🔵', ms: 90 * 60000 },
  { key: 'advanced', name: 'Advanced',     emoji: '🟣', ms: 75 * 60000 },
  { key: 'expert',   name: 'Expert',       emoji: '🟠', ms: 65 * 60000 },
  { key: 'pro',      name: 'Pro',          emoji: '🔥', ms: 58 * 60000 },
  { key: 'elite',    name: 'Elite',        emoji: '🏆', ms: 54 * 60000 },
];

const SIM_KEY   = 'rtc_hyrox_sim_v1';
const LOG_KEY   = 'rtc_hyrox_log_v1';
const SWAPS_KEY = 'rtc_hyrox_swaps_v1';
const PB_KEY    = 'rtc_hyrox_pb_v1';
const SEGPB_KEY = 'rtc_hyrox_segpb_v1';

// free-exercise-db (shared cache with gym-extras)
const DB_URL       = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const DB_CACHE_KEY = 'rtc_exercise_db_v1';

// ============================================================
// Storage helpers
// ============================================================
function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch { return fallback; }
}
function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function todayStr() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

let sim = loadJSON(SIM_KEY, null);
if (!sim || sim.date !== todayStr()) {
  sim = { date: todayStr(), running: false, accumMs: 0, lastStart: null, splits: {} };
  saveJSON(SIM_KEY, sim);
}
const log   = loadJSON(LOG_KEY, {});     // { segId: {d,w,r} }
const swaps = loadJSON(SWAPS_KEY, {});   // { segId: index }
let pb      = loadJSON(PB_KEY, null);     // { ms, date }
const segPb = loadJSON(SEGPB_KEY, {});   // { segId: ms }

function persistSim() { saveJSON(SIM_KEY, sim); }

// ============================================================
// Time helpers
// ============================================================
function pad(n) { return String(n).padStart(2, '0'); }
function fmtClock(ms) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
function elapsedMs() {
  return sim.accumMs + (sim.running && sim.lastStart ? Date.now() - sim.lastStart : 0);
}
function prevCum(segId) {
  const idx = SEGMENTS.findIndex((s) => s.id === segId);
  for (let i = idx - 1; i >= 0; i--) {
    const v = sim.splits[SEGMENTS[i].id];
    if (v != null) return v;
  }
  return 0;
}
function segTime(segId) {
  const cum = sim.splits[segId];
  return cum == null ? null : cum - prevCum(segId);
}
function doneCount() { return Object.keys(sim.splits).length; }
function finishMs() {
  if (doneCount() < SEGMENTS.length) return null;
  return Math.max(...SEGMENTS.map((s) => sim.splits[s.id] || 0));
}
// live time on the segment in progress = elapsed minus the last recorded split
function currentSegMs() {
  const cums = Object.values(sim.splits);
  const last = cums.length ? Math.max(...cums) : 0;
  return Math.max(0, elapsedMs() - last);
}

// ============================================================
// Rank + XP
// ============================================================
function rankInfo() {
  const best = pb ? pb.ms : null;
  if (best == null) {
    // Rookie: XP = how far through your first full race you've gotten.
    const pct = Math.round((doneCount() / SEGMENTS.length) * 100);
    return { cur: RANKS[0], next: RANKS[1], pct, rookie: true };
  }
  // highest rank whose gate the best finish clears (skip Rookie/Infinity)
  let idx = 1;
  for (let i = RANKS.length - 1; i >= 1; i--) {
    if (best <= RANKS[i].ms) { idx = i; break; }
  }
  const cur = RANKS[idx];
  const next = RANKS[idx + 1] || null;
  let pct = 100;
  if (next) {
    // progress in TIME from this gate down to the next (faster) gate
    const span = cur.ms - next.ms;
    pct = span > 0 ? Math.round(Math.min(1, Math.max(0, (cur.ms - best) / span)) * 100) : 0;
  }
  return { cur, next, pct, rookie: false };
}

// ============================================================
// Image DB (best-effort; emoji fallback if offline)
// ============================================================
let imgDb = null;
async function loadImageDB() {
  try {
    const raw = localStorage.getItem(DB_CACHE_KEY);
    if (raw) { imgDb = JSON.parse(raw); return; }
  } catch {}
  try {
    const res = await fetch(DB_URL, { cache: 'force-cache' });
    if (res.ok) {
      imgDb = await res.json();
      try { localStorage.setItem(DB_CACHE_KEY, JSON.stringify(imgDb)); } catch {}
    }
  } catch { imgDb = null; }
}
function imgUrlFor(seg) {
  if (!seg.img || !imgDb) return null;
  const ex = imgDb.find((d) => d.id === seg.img);
  if (!ex || !ex.images || !ex.images.length) return null;
  return IMG_BASE_URL + ex.images[0];
}

// ============================================================
// Render
// ============================================================
const root = document.getElementById('race-root');
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function coinHTML() {
  const r = rankInfo();
  return `
    <div class="race-coin">
      <div class="race-coin-badge">${r.cur.emoji}</div>
      <div class="race-coin-main">
        <div class="race-coin-rank">${r.cur.name}${pb ? ` · best ${fmtClock(pb.ms)}` : ''}</div>
        <div class="race-coin-bar"><div class="race-coin-fill" style="width:${r.pct}%"></div></div>
        <div class="race-coin-next">${
          r.rookie ? `Finish a full race to rank up · ${r.pct}% there`
          : r.next ? `${r.pct}% to <b>${r.next.name}</b> (${fmtClock(r.next.ms)})`
          : 'Top rank — chase the world record 🏆'}</div>
      </div>
    </div>`;
}

function imgSlotHTML(seg) {
  const url = imgUrlFor(seg);
  return url
    ? `<div class="race-seg-img has-image"><img src="${esc(url)}" loading="lazy" alt="" /></div>`
    : `<div class="race-seg-img"><span>${seg.icon}</span>${seg.num ? `<span class="race-seg-num">${seg.num}</span>` : ''}</div>`;
}

function segCard(seg) {
  const cum = sim.splits[seg.id];
  const done = cum != null;
  const st = segTime(seg.id);
  const chosen = swaps[seg.id] || 0;
  const working = seg.subs[chosen] || seg.subs[0];
  const entry = log[seg.id] || {};
  const best = segPb[seg.id];

  const video = `<a class="race-seg-demo" href="https://www.youtube.com/results?search_query=${seg.video}" target="_blank" rel="noopener" title="Demo">📹</a>`;

  // benchmark compare line (shown once a split exists)
  let compare = '';
  if (done) {
    const delta = st - seg.bench;
    const sign = delta <= 0 ? '−' : '+';
    const cls = delta <= 0 ? 'good' : 'over';
    compare = `
      <div class="race-seg-splits">
        <span class="race-split-seg">${fmtClock(st)}</span>
        <span class="race-split-meta">
          <span class="race-cmp ${cls}">${sign}${fmtClock(Math.abs(delta))} vs target</span>
          <span class="race-cmp-t">target ${fmtClock(seg.bench)}${best != null ? ` · best ${fmtClock(best)}` : ''}</span>
          <span class="race-cmp-t">total ${fmtClock(cum)}</span>
        </span>
      </div>`;
  } else {
    compare = `<div class="race-seg-targetline">🎯 target split ${fmtClock(seg.bench)}${best != null ? ` · your best ${fmtClock(best)}` : ''}</div>`;
  }

  return `
    <div class="race-seg race-seg-${seg.kind} ${done ? 'done' : ''}" data-seg="${seg.id}">
      <div class="race-seg-top">
        ${imgSlotHTML(seg)}
        <div class="race-seg-body">
          <div class="race-seg-name">${esc(seg.name)}</div>
          <div class="race-seg-target">${esc(seg.target)}</div>
          <div class="race-seg-working">▶ ${esc(working)}</div>
          <div class="race-seg-sub">${esc(seg.sub)}</div>
        </div>
        <div class="race-seg-tools">
          ${video}
          <button type="button" class="race-rest-btn" data-seg="${seg.id}" title="Rest timer">⏱</button>
          <button type="button" class="race-swap-btn" data-seg="${seg.id}" title="Swap">▾</button>
        </div>
      </div>

      <div class="race-swap-panel" data-seg="${seg.id}" hidden>
        ${seg.subs.map((opt, i) => `
          <button type="button" class="race-swap-opt ${i === chosen ? 'active' : ''}" data-seg="${seg.id}" data-opt="${i}">
            ${esc(opt)}
          </button>`).join('')}
      </div>

      ${compare}

      <div class="race-seg-inputs">
        <label>Dist<input type="text" inputmode="decimal" data-seg="${seg.id}" data-f="d" value="${esc(entry.d || '')}" placeholder="m" /></label>
        <label>Wt<input type="text" inputmode="decimal" data-seg="${seg.id}" data-f="w" value="${esc(entry.w || '')}" placeholder="kg" /></label>
        <label>Reps<input type="text" inputmode="numeric" data-seg="${seg.id}" data-f="r" value="${esc(entry.r || '')}" placeholder="#" /></label>
        <button type="button" class="race-split-btn ${done ? 'logged' : ''}" data-seg="${seg.id}">${done ? '✓ Split' : 'Split'}</button>
      </div>
    </div>`;
}

function render() {
  root.innerHTML = `
    ${coinHTML()}

    <div class="race-timer">
      <div class="race-clock" id="race-clock">${fmtClock(elapsedMs())}</div>
      <div class="race-seg-live" id="race-seg-live"></div>
      <div class="race-timer-controls">
        <button type="button" class="race-btn race-btn-go" id="race-go">▶ Start</button>
        <button type="button" class="race-btn" id="race-reset">Reset</button>
      </div>
      <div class="race-progress">
        <div class="race-progress-bar"><div class="race-progress-fill" id="race-progress-fill"></div></div>
        <div class="race-progress-text" id="race-progress-text">0 / ${SEGMENTS.length}</div>
      </div>
      <div class="race-finish-banner" id="race-finish-banner"></div>
    </div>

    <div class="race-howto">
      Tap <b>Start</b>, then <b>Split</b> as you finish each run &amp; station — it stamps the segment time and
      compares it to the target. Log Distance / Weight / Reps to scale up week to week. <b>Beginner tip:</b> take
      <b>60–90 s rest</b> between stations (tap ⏱) and shrink it as you get fitter — race pace is minimal rest.
    </div>

    <div class="race-segs">${SEGMENTS.map(segCard).join('')}</div>

    <div class="race-actions">
      <button type="button" class="ghost-btn gym-save-tracker" id="race-save">Save to Tracker</button>
      <button type="button" class="ghost-btn" id="race-copy">Copy</button>
    </div>`;
  renderTimer();
}

function renderTimer() {
  const clk = document.getElementById('race-clock');
  if (clk) clk.textContent = fmtClock(elapsedMs());
  const live = document.getElementById('race-seg-live');
  if (live) {
    const dc = doneCount();
    live.textContent = (sim.running || elapsedMs() > 0) && dc < SEGMENTS.length
      ? `this segment: ${fmtClock(currentSegMs())}` : '';
  }
  const go = document.getElementById('race-go');
  if (go) {
    go.textContent = sim.running ? '❚❚ Pause' : (elapsedMs() > 0 ? '▶ Resume' : '▶ Start');
    go.classList.toggle('running', sim.running);
  }
  const pt = document.getElementById('race-progress-text');
  if (pt) pt.textContent = `${doneCount()} / ${SEGMENTS.length}`;
  const fill = document.getElementById('race-progress-fill');
  if (fill) fill.style.width = `${(doneCount() / SEGMENTS.length) * 100}%`;
  const fin = document.getElementById('race-finish-banner');
  if (fin) {
    const total = finishMs();
    if (total != null) {
      fin.classList.add('show');
      fin.innerHTML = `🏁 Complete — <b>${fmtClock(total)}</b>${pb && total <= pb.ms ? ' · new best!' : pb ? ` · best ${fmtClock(pb.ms)}` : ''}`;
    } else fin.classList.remove('show');
  }
}

// ============================================================
// Timer control (+ Wake Lock so the screen stays on mid-race)
// ============================================================
let tickId = null;
let wakeLock = null;
async function requestWake() {
  if (!('wakeLock' in navigator)) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
  catch {}
}
function releaseWake() { if (wakeLock) { try { wakeLock.release(); } catch {} wakeLock = null; } }

function startTick() { if (!tickId) tickId = setInterval(renderTimer, 250); }
function stopTick() { if (tickId) { clearInterval(tickId); tickId = null; } }

function toggleGo() {
  if (sim.running) {
    sim.accumMs += Date.now() - sim.lastStart;
    sim.running = false; sim.lastStart = null;
    stopTick(); releaseWake();
  } else {
    sim.running = true; sim.lastStart = Date.now();
    startTick(); requestWake();
  }
  persistSim(); renderTimer();
}

function resetRace() {
  if (!confirm('Reset the timer and all splits for a fresh race? (Your logged weights/reps + rank stay.)')) return;
  sim = { date: todayStr(), running: false, accumMs: 0, lastStart: null, splits: {} };
  stopTick(); releaseWake(); persistSim(); render();
}

function logSplit(segId) {
  if (sim.splits[segId] != null) {
    delete sim.splits[segId];
  } else {
    if (!sim.running && sim.accumMs === 0) { sim.running = true; sim.lastStart = Date.now(); startTick(); requestWake(); }
    sim.splits[segId] = elapsedMs();
    const st = segTime(segId);
    if (st != null && (segPb[segId] == null || st < segPb[segId])) { segPb[segId] = st; saveJSON(SEGPB_KEY, segPb); }
  }
  persistSim();
  maybeSetPB();
  render();
}

function maybeSetPB() {
  const total = finishMs();
  if (total == null) return;
  if (!pb || total < pb.ms) { pb = { ms: total, date: todayStr() }; saveJSON(PB_KEY, pb); }
}

// ============================================================
// Save to Tracker (same store the gym pages use)
// ============================================================
function saveToTracker() {
  const total = finishMs() ?? elapsedMs();
  const logged = SEGMENTS.filter((s) => sim.splits[s.id] != null || log[s.id]);
  if (!logged.length) { toast('Nothing logged yet — hit a few splits first.'); return; }
  const exercises = logged.map((s) => {
    const st = segTime(s.id);
    const e = log[s.id] || {};
    // w/r are strings (weight, split time) — non-numeric time won't touch the PR board.
    return {
      exId: 'hx_' + s.id,
      name: s.name,
      target: s.target,
      done: sim.splits[s.id] != null,
      sets: [{ w: e.w || '', r: st != null ? fmtClock(st) : (e.r || '') }],
    };
  });
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    date: todayStr(), person: 'him', day: 'hyrox',
    dayLabel: `Hyrox Race Sim · ${fmtClock(total)}`,
    exercises,
  };
  try {
    const KEY = 'rtc_tracker_training_v1';
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    arr.push(entry);
    localStorage.setItem(KEY, JSON.stringify(arr));
    toast('✓ Saved to Tracker');
  } catch { toast('Could not save (storage unavailable).'); }
}

function copyRace() {
  const lines = [`HYROX Race Sim — ${todayStr()}`];
  const total = finishMs();
  if (total != null) lines.push(`Finish: ${fmtClock(total)}`);
  SEGMENTS.forEach((s) => {
    const st = segTime(s.id);
    const e = log[s.id] || {};
    const bits = [e.d && `${e.d}m`, e.w && `${e.w}kg`, e.r && `${e.r} reps`].filter(Boolean).join(' · ');
    lines.push(`${s.name} — ${s.target}${bits ? ` · ${bits}` : ''} · ${st != null ? fmtClock(st) : '—'} (target ${fmtClock(s.bench)})`);
  });
  const text = lines.join('\n');
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('✓ Copied'), () => fallbackCopy(text));
  else fallbackCopy(text);
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('✓ Copied'); } catch { toast('Copy failed'); }
  ta.remove();
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 't-toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}

// ============================================================
// Rest timer — small countdown panel (default 75 s)
// ============================================================
let restEl = null, restState = null;
function ensureRestEl() {
  if (restEl) return restEl;
  restEl = document.createElement('div');
  restEl.className = 'race-rest';
  restEl.innerHTML = `
    <div class="race-rest-row"><span id="race-rest-name">Rest</span>
      <button type="button" id="race-rest-x" aria-label="Close">×</button></div>
    <div class="race-rest-time" id="race-rest-time">1:15</div>
    <div class="race-rest-ctrls">
      <button type="button" data-d="-15">−15s</button>
      <button type="button" id="race-rest-go">Start</button>
      <button type="button" data-d="15">+15s</button>
    </div>`;
  document.body.appendChild(restEl);
  restEl.querySelector('#race-rest-x').onclick = closeRest;
  restEl.querySelector('#race-rest-go').onclick = toggleRest;
  restEl.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => adjRest(parseInt(b.dataset.d, 10)));
  return restEl;
}
function openRest(name) {
  ensureRestEl();
  if (restState && restState.iv) clearInterval(restState.iv);
  restState = { name, remaining: 75, running: false, iv: null, endAt: null };
  restEl.classList.remove('done'); restEl.classList.add('open');
  paintRest();
}
function paintRest() {
  if (!restEl || !restState) return;
  restEl.querySelector('#race-rest-name').textContent = 'Rest · ' + restState.name;
  restEl.querySelector('#race-rest-time').textContent = fmtClock(restState.remaining * 1000);
  restEl.querySelector('#race-rest-go').textContent = restState.running ? 'Pause' : 'Start';
}
function adjRest(d) { if (restState) { restState.remaining = Math.max(0, restState.remaining + d); if (restState.running && restState.endAt) restState.endAt += d * 1000; restEl.classList.remove('done'); paintRest(); } }
function toggleRest() {
  if (!restState) return;
  if (restState.running) { restState.running = false; if (restState.iv) clearInterval(restState.iv); restState.iv = null; restState.endAt = null; }
  else { if (restState.remaining <= 0) restState.remaining = 75; restState.running = true; restState.endAt = Date.now() + restState.remaining * 1000; restState.iv = setInterval(tickRest, 250); }
  paintRest();
}
function tickRest() {
  if (!restState || !restState.running) return;
  const rem = Math.max(0, Math.ceil((restState.endAt - Date.now()) / 1000));
  restState.remaining = rem; paintRest();
  if (rem <= 0) { restState.running = false; clearInterval(restState.iv); restState.iv = null; restEl.classList.add('done'); try { navigator.vibrate && navigator.vibrate([200, 100, 300]); } catch {} }
}
function closeRest() { if (restState && restState.iv) clearInterval(restState.iv); restState = null; if (restEl) restEl.classList.remove('open', 'done'); }

// ============================================================
// Events (delegated)
// ============================================================
root.addEventListener('click', (e) => {
  const swapOpt = e.target.closest('.race-swap-opt');
  if (swapOpt) { swaps[swapOpt.dataset.seg] = parseInt(swapOpt.dataset.opt, 10); saveJSON(SWAPS_KEY, swaps); render(); return; }
  const swapBtn = e.target.closest('.race-swap-btn');
  if (swapBtn) {
    const panel = root.querySelector(`.race-swap-panel[data-seg="${swapBtn.dataset.seg}"]`);
    if (panel) panel.hidden = !panel.hidden;
    return;
  }
  const restBtn = e.target.closest('.race-rest-btn');
  if (restBtn) { const seg = SEGMENTS.find((s) => s.id === restBtn.dataset.seg); openRest(seg ? seg.name : 'station'); return; }
  const split = e.target.closest('.race-split-btn');
  if (split) { logSplit(split.dataset.seg); return; }
  if (e.target.closest('#race-go'))    { toggleGo(); return; }
  if (e.target.closest('#race-reset')) { resetRace(); return; }
  if (e.target.closest('#race-save'))  { saveToTracker(); return; }
  if (e.target.closest('#race-copy'))  { copyRace(); return; }
});

root.addEventListener('input', (e) => {
  const inp = e.target.closest('input[data-f]');
  if (!inp) return;
  const id = inp.dataset.seg;
  (log[id] || (log[id] = {}))[inp.dataset.f] = inp.value;
  saveJSON(LOG_KEY, log);
});

// Recompute after backgrounding (iOS throttles setInterval) + re-grab wake lock.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (sim.running && !wakeLock) requestWake();
  renderTimer();
});

// ============================================================
// Init
// ============================================================
render();
if (sim.running) { startTick(); requestWake(); }
loadImageDB().then(() => { if (imgDb) render(); });
