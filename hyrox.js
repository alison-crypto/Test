// hyrox.js — HYROX race simulator.
//
// A full race is 8 × 1 km runs interleaved with 8 functional stations. This
// page runs that simulation the way Alison's YMCA actually allows it:
//   • SkiErg + RowErg sit by the treadmill, so those two go first with REAL runs.
//   • The rest of the stations are in the next room, so their "runs" are done on
//     the bike instead (same ~1 km / ~90 sec hard effort).
//   • The Y has no sled, no wall-ball wall and no sandbags, so those stations show
//     the real race target PLUS the working substitute he can actually do there.
//
// Each segment shows the true competition rep/distance, a box to log what he
// actually did that day (so he can scale up week to week), and a split button.
// A total timer runs up top; every split records the segment time + cumulative.
// A goal ladder (first-timer → elite/pro → world-record) tracks the finish time.
//
// Storage keys:
//   rtc_hyrox_sim_v1      — live attempt { date, running, accumMs, lastStart, splits{} }
//   rtc_hyrox_actuals_v1  — { segId: text } persisted across attempts (last-time log)
//   rtc_hyrox_pb_v1       — { ms, date } personal best finish time

// ============================================================
// Race definition — 16 segments, in the order he'll do them
// ============================================================
const SEGMENTS = [
  { id: 'run1', kind: 'run', icon: '🏃', name: 'Run 1 · 1 km',
    target: '1 km run', sub: 'Treadmill — steady & controlled, this is the easy one.' },
  { id: 'ski', kind: 'station', icon: '🎿', name: 'SkiErg', num: 1,
    target: '1000 m', sub: 'Drive from the hips, not just arms. You said 400 m was easy — hold pace to 1 km.',
    video: 'skierg+technique+hyrox' },
  { id: 'run2', kind: 'run', icon: '🏃', name: 'Run 2 · 1 km',
    target: '1 km run', sub: 'Treadmill again (Ski + Row are by the treadmill).' },
  { id: 'row', kind: 'station', icon: '🚣', name: 'RowErg', num: 2,
    target: '1000 m', sub: 'Legs–core–arms order. Long, strong strokes; don’t yank early.',
    video: 'rowerg+technique+hyrox' },
  { id: 'bike3', kind: 'bike', icon: '🚴', name: 'Bike 3 · run sub',
    target: '≈ 1 km run effort', sub: 'Other room from here → bike replaces every run. ~90 sec hard.' },
  { id: 'push', kind: 'station', icon: '🛷', name: 'Sled Push', num: 3,
    target: '50 m · ~152 kg (race)', sub: 'YMCA has no sled → heavy DB/KB suitcase march 50 m, or a leg-press burnout.',
    video: 'hyrox+sled+push+technique' },
  { id: 'bike4', kind: 'bike', icon: '🚴', name: 'Bike 4 · run sub',
    target: '≈ 1 km run effort', sub: '~90 sec hard.' },
  { id: 'pull', kind: 'station', icon: '🪝', name: 'Sled Pull', num: 4,
    target: '50 m · ~103 kg (race)', sub: 'No sled → hard seated cable rows / heavy DB bent-over rows, hand-over-hand tempo.',
    video: 'hyrox+sled+pull+technique' },
  { id: 'bike5', kind: 'bike', icon: '🚴', name: 'Bike 5 · run sub',
    target: '≈ 1 km run effort', sub: '~90 sec hard.' },
  { id: 'bbj', kind: 'station', icon: '🤸', name: 'Burpee Broad Jumps', num: 5,
    target: '80 m', sub: '⚠️ Brace the lower back · control every landing (ankle). ~15–18 reps ≈ 80 m.',
    video: 'burpee+broad+jump+form' },
  { id: 'bike6', kind: 'bike', icon: '🚴', name: 'Bike 6 · run sub',
    target: '≈ 1 km run effort', sub: '~90 sec hard.' },
  { id: 'carry', kind: 'station', icon: '🧳', name: 'Farmers Carry', num: 6,
    target: '200 m · 2 × 24 kg (race)', sub: 'Heaviest DBs you can grip — tall chest, brace, don’t shrug.',
    video: 'farmers+carry+technique' },
  { id: 'bike7', kind: 'bike', icon: '🚴', name: 'Bike 7 · run sub',
    target: '≈ 1 km run effort', sub: '~90 sec hard.' },
  { id: 'lunge', kind: 'station', icon: '🦵', name: 'Sandbag Lunges', num: 7,
    target: '100 m · 20 kg (race)', sub: 'No sandbags → DB/KB goblet reverse lunges, 100 m. Brace + control the ankle.',
    video: 'goblet+reverse+lunge+form' },
  { id: 'bike8', kind: 'bike', icon: '🚴', name: 'Bike 8 · run sub',
    target: '≈ 1 km run effort', sub: 'Last one — empty the tank.' },
  { id: 'wb', kind: 'station', icon: '🏐', name: 'Wall Balls', num: 8,
    target: '100 reps · 6 kg to 3 m', sub: 'Can’t use the wall → med-ball throw-ups / DB thrusters × 100. Full squat, full extension.',
    video: 'wall+ball+shot+form' },
];

// Goal ladder — whole-race finish times. Anchors from real HYROX (Men, Open):
// average first-timers land ~1:30–1:45; strong amateurs ~1:10–1:15; the elite
// men's benchmark sits around 0:54. Beat a tier → it lights up.
const LADDER = [
  { key: 'firsttimer', label: 'First-timer · just finish', emoji: '🐣', ms: 105 * 60000 },
  { key: 'finisher',   label: 'Solid finisher',           emoji: '🟢', ms: 90 * 60000 },
  { key: 'intermed',   label: 'Intermediate',             emoji: '🔵', ms: 75 * 60000 },
  { key: 'advanced',   label: 'Advanced',                 emoji: '🟣', ms: 65 * 60000 },
  { key: 'elite',      label: 'Elite / Pro',              emoji: '🟠', ms: 58 * 60000 },
  { key: 'wr',         label: 'World-record benchmark',   emoji: '🏆', ms: 54 * 60000 },
];

const SIM_KEY     = 'rtc_hyrox_sim_v1';
const ACTUALS_KEY = 'rtc_hyrox_actuals_v1';
const PB_KEY      = 'rtc_hyrox_pb_v1';

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
const actuals = loadJSON(ACTUALS_KEY, {});
const pb = loadJSON(PB_KEY, null);

function persistSim() { saveJSON(SIM_KEY, sim); }

// ============================================================
// Time helpers
// ============================================================
function pad(n) { return String(n).padStart(2, '0'); }
function fmtClock(ms) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function elapsedMs() {
  return sim.accumMs + (sim.running && sim.lastStart ? Date.now() - sim.lastStart : 0);
}

// Cumulative time recorded at each *completed* segment, walked in race order,
// so a segment's own split = its cum minus the previous completed segment's cum.
function prevCum(segId) {
  const idx = SEGMENTS.findIndex((s) => s.id === segId);
  for (let i = idx - 1; i >= 0; i--) {
    const v = sim.splits[SEGMENTS[i].id];
    if (v != null) return v;
  }
  return 0;
}
function doneCount() { return Object.keys(sim.splits).length; }
function finishMs() {
  // Total = the latest cumulative split once every segment is logged.
  if (doneCount() < SEGMENTS.length) return null;
  return Math.max(...SEGMENTS.map((s) => sim.splits[s.id] || 0));
}

// ============================================================
// Render
// ============================================================
const root = document.getElementById('race-root');

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function segCard(seg) {
  const cum = sim.splits[seg.id];
  const done = cum != null;
  const segMs = done ? cum - prevCum(seg.id) : null;
  const actual = actuals[seg.id] || '';
  const video = seg.video
    ? `<a class="race-seg-demo" href="https://www.youtube.com/results?search_query=${seg.video}" target="_blank" rel="noopener">📹</a>`
    : '';
  const splitReadout = done
    ? `<div class="race-seg-splits">
         <span class="race-split-seg">${fmtClock(segMs)}</span>
         <span class="race-split-cum">total ${fmtClock(cum)}</span>
       </div>`
    : '';
  return `
    <div class="race-seg race-seg-${seg.kind} ${done ? 'done' : ''}" data-seg="${seg.id}">
      <div class="race-seg-top">
        <div class="race-seg-icon">${seg.icon}${seg.num ? `<span class="race-seg-num">${seg.num}</span>` : ''}</div>
        <div class="race-seg-body">
          <div class="race-seg-name">${esc(seg.name)}</div>
          <div class="race-seg-target">${esc(seg.target)}</div>
          <div class="race-seg-sub">${esc(seg.sub)}</div>
        </div>
        ${video}
        <button type="button" class="race-split-btn ${done ? 'logged' : ''}" data-seg="${seg.id}">
          ${done ? '✓' : 'Split'}
        </button>
      </div>
      ${splitReadout}
      <input type="text" class="race-actual" data-seg="${seg.id}"
             value="${esc(actual)}" placeholder="What I did today (distance · weight · reps)…" />
    </div>`;
}

function ladderHTML() {
  const best = pb ? pb.ms : null;
  const rows = LADDER.map((t) => {
    const beat = best != null && best <= t.ms;
    return `
      <div class="race-ladder-row ${beat ? 'beat' : ''}">
        <span class="race-ladder-emoji">${t.emoji}</span>
        <span class="race-ladder-label">${esc(t.label)}</span>
        <span class="race-ladder-time">${fmtClock(t.ms)}</span>
        <span class="race-ladder-mark">${beat ? '✓' : ''}</span>
      </div>`;
  }).join('');
  const pbLine = pb
    ? `<div class="race-pb">Your best: <b>${fmtClock(pb.ms)}</b> <span>· ${esc(pb.date)}</span></div>`
    : `<div class="race-pb race-pb-empty">No finish logged yet — complete all 16 splits to set your first time.</div>`;
  return `
    <div class="race-ladder">
      <div class="race-ladder-head">🎯 Goal ladder — finish time</div>
      ${pbLine}
      ${rows}
      <div class="race-ladder-note">≈ elite benchmarks for HYROX Men’s Open. Chase the next tier up — most first-timers land near 1:30–1:45, then it falls fast as the runs and stations get familiar.</div>
    </div>`;
}

function renderTimer() {
  const el = document.getElementById('race-clock');
  if (el) el.textContent = fmtClock(elapsedMs());
  const goBtn = document.getElementById('race-go');
  if (goBtn) {
    goBtn.textContent = sim.running ? '❚❚ Pause' : (elapsedMs() > 0 ? '▶ Resume' : '▶ Start');
    goBtn.classList.toggle('running', sim.running);
  }
  const prog = document.getElementById('race-progress-text');
  if (prog) prog.textContent = `${doneCount()} / ${SEGMENTS.length} segments`;
  const fill = document.getElementById('race-progress-fill');
  if (fill) fill.style.width = `${(doneCount() / SEGMENTS.length) * 100}%`;
  const fin = document.getElementById('race-finish-banner');
  if (fin) {
    const total = finishMs();
    if (total != null) {
      fin.classList.add('show');
      fin.innerHTML = `🏁 Race complete — <b>${fmtClock(total)}</b>${
        pb && total <= pb.ms ? ' · new best!' : pb ? ` · best ${fmtClock(pb.ms)}` : ''}`;
    } else {
      fin.classList.remove('show');
    }
  }
}

function render() {
  root.innerHTML = `
    <div class="race-timer">
      <div class="race-clock" id="race-clock">${fmtClock(elapsedMs())}</div>
      <div class="race-timer-controls">
        <button type="button" class="race-btn race-btn-go" id="race-go">▶ Start</button>
        <button type="button" class="race-btn" id="race-reset">Reset</button>
      </div>
      <div class="race-progress">
        <div class="race-progress-bar"><div class="race-progress-fill" id="race-progress-fill"></div></div>
        <div class="race-progress-text" id="race-progress-text">0 / ${SEGMENTS.length} segments</div>
      </div>
      <div class="race-finish-banner" id="race-finish-banner"></div>
    </div>

    <div class="race-howto">
      Tap <b>Start</b> when you begin. Hit <b>Split</b> as you finish each run &amp; station — it stamps your
      segment time and running total. Log what you actually did in each box so you can scale up next week.
    </div>

    <div class="race-segs">
      ${SEGMENTS.map(segCard).join('')}
    </div>

    ${ladderHTML()}

    <div class="race-actions">
      <button type="button" class="ghost-btn gym-save-tracker" id="race-save">Save to Tracker</button>
      <button type="button" class="ghost-btn" id="race-copy">Copy</button>
    </div>`;
  renderTimer();
}

// ============================================================
// Timer control
// ============================================================
let tickId = null;
function startTick() {
  if (tickId) return;
  tickId = setInterval(renderTimer, 250);
}
function stopTick() {
  if (tickId) { clearInterval(tickId); tickId = null; }
}

function toggleGo() {
  if (sim.running) {
    // pause
    sim.accumMs += Date.now() - sim.lastStart;
    sim.running = false;
    sim.lastStart = null;
    stopTick();
  } else {
    sim.running = true;
    sim.lastStart = Date.now();
    startTick();
  }
  persistSim();
  renderTimer();
}

function resetRace() {
  if (!confirm('Reset the timer and all splits for a fresh race? (Your logged weights/reps stay.)')) return;
  sim = { date: todayStr(), running: false, accumMs: 0, lastStart: null, splits: {} };
  stopTick();
  persistSim();
  render();
}

function logSplit(segId) {
  if (sim.splits[segId] != null) {
    delete sim.splits[segId];        // tap again to undo
  } else {
    // auto-start the clock on the first split if it isn't running yet
    if (!sim.running && sim.accumMs === 0) {
      sim.running = true;
      sim.lastStart = Date.now();
      startTick();
    }
    sim.splits[segId] = elapsedMs();
  }
  persistSim();
  maybeSetPB();
  render();
}

function maybeSetPB() {
  const total = finishMs();
  if (total == null) return;
  if (!pb || total < pb.ms) {
    saveJSON(PB_KEY, { ms: total, date: todayStr() });
  }
}

// ============================================================
// Save to Tracker (same store the gym pages use)
// ============================================================
function saveToTracker() {
  const total = finishMs() ?? elapsedMs();
  const logged = SEGMENTS.filter((s) => sim.splits[s.id] != null || (actuals[s.id] || '').trim());
  if (!logged.length) {
    toast('Nothing logged yet — hit a few splits first.');
    return;
  }
  const exercises = logged.map((s) => {
    const cum = sim.splits[s.id];
    const split = cum != null ? fmtClock(cum - prevCum(s.id)) : '';
    return {
      exId: 'hx_' + s.id,
      name: s.name,
      target: s.target,
      done: cum != null,
      // w/r are strings (distance/weight, split) — non-numeric, so they never
      // pollute the numeric PR board in the tracker.
      sets: [{ w: (actuals[s.id] || '').trim(), r: split }],
    };
  });
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    date: todayStr(),
    person: 'him',
    day: 'hyrox',
    dayLabel: `Hyrox Race Sim · ${fmtClock(total)}`,
    exercises,
  };
  try {
    const KEY = 'rtc_tracker_training_v1';
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    arr.push(entry);
    localStorage.setItem(KEY, JSON.stringify(arr));
    toast('✓ Saved to Tracker');
  } catch {
    toast('Could not save (storage unavailable).');
  }
}

function copyRace() {
  const lines = [`HYROX Race Sim — ${todayStr()}`];
  const total = finishMs();
  if (total != null) lines.push(`Finish: ${fmtClock(total)}`);
  SEGMENTS.forEach((s) => {
    const cum = sim.splits[s.id];
    const split = cum != null ? fmtClock(cum - prevCum(s.id)) : '—';
    const a = (actuals[s.id] || '').trim();
    lines.push(`${s.name} — ${s.target}${a ? ` · did: ${a}` : ''} · split ${split}`);
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
  const t = document.createElement('div');
  t.className = 't-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ============================================================
// Events (delegated)
// ============================================================
root.addEventListener('click', (e) => {
  const split = e.target.closest('.race-split-btn');
  if (split) { logSplit(split.dataset.seg); return; }
  if (e.target.closest('#race-go'))    { toggleGo();      return; }
  if (e.target.closest('#race-reset')) { resetRace();     return; }
  if (e.target.closest('#race-save'))  { saveToTracker(); return; }
  if (e.target.closest('#race-copy'))  { copyRace();      return; }
});

root.addEventListener('input', (e) => {
  const inp = e.target.closest('.race-actual');
  if (!inp) return;
  actuals[inp.dataset.seg] = inp.value;
  saveJSON(ACTUALS_KEY, actuals);
});

// Recompute after backgrounding (iOS throttles setInterval).
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderTimer(); });

// ============================================================
// Init
// ============================================================
render();
if (sim.running) startTick();
