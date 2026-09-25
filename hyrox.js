// hyrox.js — HYROX race simulator (gym-card format + timer, splits, RPG ranks).
//
// 8 × 1 km runs interleaved with 8 stations, in the OFFICIAL competition order
// (Run → Ski → Run → Sled Push → Run → Sled Pull → Run → Burpee Broad Jumps →
// Run → Row → Run → Farmers Carry → Run → Lunges → Run → Wall Balls). Kit the Y
// lacks (sled/wall/sandbags): every slot's ▾ menu offers the official station
// plus 3 researched replacement cards (hyrox-options.js), each a full card
// with its own dial, race-equivalent target, time table, cues and picture.
//
// TIMERS: every card has its OWN Start/Stop timer that measures only that
// station, so the gym can be done in any order (machine taken → do another one
// first) without corrupting any split. The big clock is the whole-session
// total: it starts/resumes when any station starts, can be paused while waiting
// for a machine, and stops itself when the last station is done. Only one
// station runs at a time — starting another auto-stops the one still running.
//
// TWO INDEPENDENT DIALS per station:
//   • Distance / weight tier — how much you do (−/+), Beginner → Competition.
//   • Time tier — how fast you aim (named chips: Beginner/Amateur/Intermediate/
//     Competition/Elite), with REAL HYROX benchmark times that scale to the
//     distance you picked. You can do a Competition distance at an Amateur time,
//     or the reverse — both change freely.
//
// Stopping a station means "I did the current target" (auto-fills the metric), so
// it counts as a full clear; edit the box down only if you did less. Records + XP commit
// ONLY on "Save & Log XP" — nothing counts by accident. Best times are tracked
// per distance so 500 m and 1 km are compared fairly. Wall-clock timer survives
// backgrounding; a Wake Lock keeps the screen awake.
//
// Storage:
//   rtc_hyrox_sim_v1       — live attempt { running, accumMs, lastStart, segs:{id:{acc,start,done}}, finishMs, edited:{id:true} }
//   rtc_hyrox_log_v1       — { segId:{d,w,r} } structured log
//   rtc_hyrox_tier_v1      — { segId: distance/weight target }
//   rtc_hyrox_timetier_v1  — { segId: timeTierKey }
//   rtc_hyrox_swaps_v2     — { segId: version } 0 = official station, 1–3 = replacement cards (hyrox-options.js)
//   rtc_hyrox_pb_v1        — { ms, date } best finish
//   rtc_hyrox_segpb_v3     — { segId: { amountKey: ms } } best station time per distance
//                            (v3: station-only Start→Stop time; v2 held the old split
//                            times that included walking/rest, kept but no longer read)
//   rtc_hyrox_xp_v1        — { xp, prs, log[] }

// ============================================================
// Benchmark times (ms) to complete the RACE amount, by tier. Sourced from HYROX
// result analyses (Men's Open avg ~5:15–5:30/km run, Ski ~4:30, Row ~4:45,
// Wall Balls ~6:00, Farmers ~2:20, Lunges ~4:30, Burpees ~5:00; elite ~30–40%
// faster; beginners run/walk ~8–9/km). Times scale linearly with distance.
// ============================================================
const T = (m, s) => (m * 60 + s) * 1000;
// Official Men's Open six-tier times now live in hyrox-options.js
// (HX_OPTIONS[x].officialTimes), next to the three replacement cards.

const TIME_TIERS = [
  { key: 'beginner', label: 'Beg' },
  { key: 'amateur', label: 'Am' },
  { key: 'intermediate', label: 'Int' },
  { key: 'competition', label: 'Comp' },
  { key: 'elite', label: 'Elite' },
  { key: 'wr', label: '🌍WR' },
];

// 16 slots in race order. Every slot has 4 versions (the ▾ menu): option 0 is
// the official station below; options 1–3 are the researched replacement
// cards from hyrox-options.js, each with its own dial, target and time table.
// `hx` = which option set a slot uses; `defOpt` = default version (the YMCA has
// no sled, so sled slots default to a replacement; runs 3–8 to the air bike).
function runSlot(id, n, sub, defOpt) {
  return { id, hx: 'run', kind: 'run', icon: '🏃', name: `Run ${n} · 1 km`, img: 'Running_Treadmill', video: 'treadmill+running+form',
    scale: 'amount', unit: 'm', start: 1000, race: 1000, step: 100, sub, defOpt };
}
const SEGMENTS = [
  runSlot('run1', 1, 'Treadmill — steady & controlled, this is the easy one.', 0),
  { id: 'ski', hx: 'ski', kind: 'station', icon: '🎿', num: 1, name: 'SkiErg', img: 'Straight-Arm_Pulldown', video: 'skierg+technique+hyrox',
    scale: 'amount', unit: 'm', start: 400, race: 1000, step: 100,
    sub: 'Drive from the hips, not just arms. Build the distance, then the speed.' },
  runSlot('run2', 2, 'Treadmill again — hold the same pace as Run 1.', 0),
  { id: 'push', hx: 'push', kind: 'station', icon: '🛷', num: 2, name: 'Sled Push', img: 'Sled_Push', video: 'hyrox+sled+push+technique',
    scale: 'weight', unit: 'm', dist: 50, startW: 102, raceW: 152, stepW: 10, wUnit: 'kg sled', compNote: 'race 152 kg', tk0: 'push@0', defOpt: 2,
    sub: 'Arms locked, hips low, short fast steps · 4 × 12.5 m lanes. No sled at the gym? Pick a replacement card ▾.' },
  runSlot('bike3', 3, 'Match a race 1 km effort.', 2),
  { id: 'pull', hx: 'pull', kind: 'station', icon: '🪝', num: 3, name: 'Sled Pull', img: 'Sled_Row', video: 'hyrox+sled+pull+technique',
    scale: 'weight', unit: 'm', dist: 50, startW: 63, raceW: 103, stepW: 10, wUnit: 'kg sled', compNote: 'race 103 kg', tk0: 'pull@0', defOpt: 1,
    sub: 'Anchor low, long hand-over-hand pulls, walk back to reset each lane. No sled? Pick a replacement card ▾.' },
  runSlot('bike4', 4, 'Match a race 1 km effort.', 2),
  { id: 'bbj', hx: 'bbj', kind: 'station', icon: '🤸', num: 4, name: 'Burpee Broad Jumps', img: 'Freehand_Jump_Squat', video: 'burpee+broad+jump+form',
    scale: 'amount', unit: 'm', start: 40, race: 80, step: 10,
    sub: '⚠️ Brace the lower back · control every landing (ankle). ~40–45 jumps ≈ 80 m.' },
  runSlot('bike5', 5, 'Match a race 1 km effort.', 2),
  { id: 'row', hx: 'row', kind: 'station', icon: '🚣', num: 5, name: 'RowErg', img: 'Rowing_Stationary', video: 'rowerg+technique+hyrox',
    scale: 'amount', unit: 'm', start: 400, race: 1000, step: 100,
    sub: 'Legs–core–arms order. Long, strong strokes; don’t yank early.' },
  runSlot('bike6', 6, 'Match a race 1 km effort.', 2),
  { id: 'carry', hx: 'carry', kind: 'station', icon: '🧳', num: 6, name: 'Farmers Carry', img: 'Farmers_Walk', video: 'farmers+carry+technique',
    scale: 'weight', unit: 'm', dist: 200, startW: 12, raceW: 24, stepW: 2, wUnit: 'kg/hand', compNote: 'race 2 × 24 kg',
    sub: 'Heaviest DBs you can grip — tall chest, brace, don’t shrug.' },
  runSlot('bike7', 7, 'Match a race 1 km effort.', 2),
  { id: 'lunge', hx: 'lunge', kind: 'station', icon: '🦵', num: 7, name: 'Sandbag Lunges', img: 'Dumbbell_Lunges', video: 'hyrox+sandbag+lunge+technique',
    scale: 'weight', unit: 'm', dist: 100, startW: 8, raceW: 20, stepW: 2, wUnit: 'kg bag', compNote: 'race 20 kg sandbag',
    sub: 'Bag on the shoulders, back knee touches every rep. Brace + control the ankle. No sandbag? Pick a replacement ▾.' },
  runSlot('bike8', 8, 'Last one — empty the tank.', 2),
  { id: 'wb', hx: 'wb', kind: 'station', icon: '🏐', num: 8, name: 'Wall Balls', img: 'Medicine_Ball_Scoop_Throw', video: 'wall+ball+shot+form',
    scale: 'amount', unit: 'reps', start: 40, race: 100, step: 10,
    sub: 'Full squat, full extension, ball to the 3 m target. Wall busy? Pick a replacement ▾.' },
];
SEGMENTS.forEach((s) => { s.times = HX_OPTIONS[s.hx].officialTimes; });

// ---- versions: option 0 = official slot config, 1–3 = replacement cards ----
const CONFIG_KEYS = ['scale', 'unit', 'start', 'race', 'step', 'dist', 'wUnit', 'startW', 'raceW', 'stepW', 'compNote', 'times', 'img', 'kind'];
function versionsOf(seg) { return [null, ...HX_OPTIONS[seg.hx].alts]; }
function shortOptName(name) { return String(name).replace(/\s*\(.*\)\s*$/, ''); }
function optIndex(seg) {
  const v = swaps[seg.id];
  const n = versionsOf(seg).length;
  return Number.isInteger(v) && v >= 0 && v < n ? v : (seg.defOpt || 0);
}
function tierKey(seg, i) { return i === 0 ? (seg.tk0 || seg.id) : `${seg.id}@${i}`; }
// effective card for a slot: the slot merged with its chosen version
function E(seg, forceOpt) {
  if (seg.__eff && forceOpt == null) return seg;
  const base = seg.__base || seg;
  const i = forceOpt != null ? forceOpt : optIndex(base);
  const x = Object.assign({}, base, { __eff: true, __base: base, opt: i, tk: tierKey(base, i) });
  if (i > 0) {
    const o = versionsOf(base)[i];
    CONFIG_KEYS.forEach((k) => { x[k] = o[k]; });
    x.kind = o.kind || base.kind;
    x.altName = shortOptName(o.name); x.why = o.why; x.cues = o.cues || []; x.mistake = o.mistake;
    x.equip = o.equip; x.video = encodeURIComponent(o.video || o.name + ' technique');
  }
  return x;
}
function defaultTier(x) {
  if (x.hx === 'run') return x.race;                    // runs: full 1 km equivalent
  return x.scale === 'weight' ? x.startW : x.start;
}
function specText(x) {
  return x.scale === 'weight' ? `${x.dist} ${x.unit} · ${x.raceW} ${x.wUnit}` : `${x.race} ${x.unit}`;
}

const RANKS = [
  { key: 'rookie',   name: 'Rookie',       emoji: '🥚', ms: Infinity },
  { key: 'beginner', name: 'Beginner',     emoji: '🐣', ms: 105 * 60000 },
  { key: 'rising',   name: 'Intermediate', emoji: '🔵', ms: 90 * 60000 },
  { key: 'advanced', name: 'Advanced',     emoji: '🟣', ms: 75 * 60000 },
  { key: 'expert',   name: 'Expert',       emoji: '🟠', ms: 65 * 60000 },
  { key: 'pro',      name: 'Pro',          emoji: '🔥', ms: 58 * 60000 },
  { key: 'elite',    name: 'Elite',        emoji: '🏆', ms: 54 * 60000 },
];

const SIM_KEY      = 'rtc_hyrox_sim_v1';
const LOG_KEY      = 'rtc_hyrox_log_v1';
const TIER_KEY     = 'rtc_hyrox_tier_v1';
const TIMETIER_KEY = 'rtc_hyrox_timetier_v1';
const SWAPS_KEY    = 'rtc_hyrox_swaps_v2';   // v2: 0 = official, 1–3 = replacement cards
const PB_KEY       = 'rtc_hyrox_pb_v1';
const SEGPB_KEY    = 'rtc_hyrox_segpb_v3';
const XP_KEY       = 'rtc_hyrox_xp_v1';

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

// `splits: {}` stays only so an older app version loaded the same day can't crash on this object.
function freshSim() { return { date: todayStr(), running: false, accumMs: 0, lastStart: null, segs: {}, finishMs: null, edited: {}, splits: {} }; }
let sim = loadJSON(SIM_KEY, null);
if (!sim || sim.date !== todayStr()) {
  sim = freshSim();
  saveJSON(SIM_KEY, sim);
} else if (!sim.segs) {
  // old in-order "cumulative split" format → keep today's main clock, drop the
  // order-dependent splits (they can't be turned into honest station times).
  sim.segs = {}; sim.finishMs = null; sim.edited = {}; sim.splits = {};
  saveJSON(SIM_KEY, sim);
}
if (!sim.edited) sim.edited = {};
const log      = loadJSON(LOG_KEY, {});
const swaps    = loadJSON(SWAPS_KEY, {});
let pb         = loadJSON(PB_KEY, null);
const segPb    = loadJSON(SEGPB_KEY, {});     // { segId: { amountKey: ms } }
const xpState  = loadJSON(XP_KEY, { xp: 0, prs: 0, log: [] });
const tiers    = loadJSON(TIER_KEY, {});
const timeTier = loadJSON(TIMETIER_KEY, {});
SEGMENTS.forEach((s) => {
  versionsOf(s).forEach((_, i) => { const x = E(s, i); if (tiers[x.tk] == null) tiers[x.tk] = defaultTier(x); });
  if (timeTier[s.id] == null) timeTier[s.id] = 'amateur';
});
// one-time: Saturday runs move up to the full 1 km (Sep 2026) — still adjustable
const RUNS1K_KEY = 'rtc_hyrox_runs1k_v1';
try {
  if (!localStorage.getItem(RUNS1K_KEY)) {
    SEGMENTS.forEach((s) => { if (s.hx === 'run') tiers[s.id] = s.race; });
    localStorage.setItem(RUNS1K_KEY, '1');
  }
} catch {}
saveJSON(TIER_KEY, tiers);
saveJSON(TIMETIER_KEY, timeTier);

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
function elapsedMs() { return sim.accumMs + (sim.running && sim.lastStart ? Date.now() - sim.lastStart : 0); }
// Per-station timers — each station owns its time, independent of order.
function segElapsed(segId) {
  const st = sim.segs[segId];
  if (!st) return 0;
  return st.acc + (st.start ? Math.max(0, Date.now() - st.start) : 0);
}
function segRunning(segId) { const st = sim.segs[segId]; return !!(st && st.start); }
function segDone(segId) { const st = sim.segs[segId]; return !!(st && st.done && !st.start); }
function segTime(segId) { return segDone(segId) ? segElapsed(segId) : null; }
function runningSeg() { return SEGMENTS.find((s) => segRunning(s.id)) || null; }
function doneCount() { return SEGMENTS.filter((s) => segDone(s.id)).length; }
function allDone() { return doneCount() >= SEGMENTS.length; }
// time spent actually working stations (excludes walking/waiting between them)
function workMs() { return SEGMENTS.reduce((t, s) => t + (segDone(s.id) ? segElapsed(s.id) : 0), 0); }
// race finish = whole-session clock when the last station stopped (like a real
// race, transitions count); never less than the stations' own total.
function finishMs() {
  if (!allDone()) return null;
  return Math.max(sim.finishMs != null ? sim.finishMs : 0, workMs());
}
function shortName(seg) { return seg.name.split(' · ')[0]; }
// tiny label for the dial (must fit inside the ring)
const DIAL_NAME = { push: 'Sled Push', pull: 'Sled Pull', bbj: 'BBJ', row: 'Row', ski: 'Ski', carry: 'Farmers', lunge: 'Lunges', wb: 'Wall Balls' };
function dialName(seg) { return DIAL_NAME[seg.id] || shortName(seg); }
// A real station takes well over 10 s (even a 100 m run at world-record pace is
// ~17 s), so anything shorter is a mis-tap / wrong card and is never recorded.
const MIN_SEG_MS = 10000;
// ignore a second tap on the same card's button this soon after the first
const SEG_TAP_GUARD_MS = 700;
let lastSegTap = { id: null, t: 0 };

// ============================================================
// Two dials: distance/weight tier + time tier
// ============================================================
function curTarget(seg) { seg = E(seg); return tiers[seg.tk]; }
function targetAmount(seg) { seg = E(seg); return seg.scale === 'weight' ? seg.dist : curTarget(seg); }
function curTimeTier(seg) { return timeTier[seg.id] || 'amateur'; }
// time to hit a tier at the CURRENT distance (weight stations: fixed distance → no scale)
function tierTime(seg, tierKey) {
  seg = E(seg);
  const base = seg.times[tierKey];
  return seg.scale === 'weight' ? base : Math.round(base * curTarget(seg) / seg.race);
}
function targetTime(seg) { return tierTime(seg, curTimeTier(seg)); }
function distPct(seg) { seg = E(seg); return seg.scale === 'weight' ? curTarget(seg) / seg.raceW : curTarget(seg) / seg.race; }
function distTierLabel(seg) {
  seg = E(seg);
  let p = distPct(seg);
  if (seg.opt) {
    // replacement cards start well above 40% of race-equivalent, so rate the
    // level by progress from the card's start value to its race value
    const lo = seg.scale === 'weight' ? seg.startW : seg.start, hi = seg.scale === 'weight' ? seg.raceW : seg.race;
    const prog = hi > lo ? (curTarget(seg) - lo) / (hi - lo) : 1;
    p = prog <= 0 ? 0.3 : 0.4 + 0.6 * Math.min(1, prog);
  }
  if (p >= 1) return 'Competition';
  if (p >= 0.8) return 'Pro';
  if (p >= 0.6) return 'Intermediate';
  if (p >= 0.4) return 'Amateur';
  return 'Beginner';
}
function atMax(seg) { seg = E(seg); return seg.scale === 'weight' ? curTarget(seg) >= seg.raceW : curTarget(seg) >= seg.race; }
function atMin(seg) { seg = E(seg); return curTarget(seg) <= (seg.scale === 'weight' ? 4 : seg.step); }
function stepTarget(segId, dir) {
  const raw = SEGMENTS.find((s) => s.id === segId);
  if (!raw) return;
  const seg = E(raw);
  if (seg.scale === 'weight') tiers[seg.tk] = Math.max(Math.min(seg.stepW, 4), Math.min(seg.raceW, curTarget(seg) + dir * seg.stepW));
  else tiers[seg.tk] = Math.max(seg.step, Math.min(seg.race, curTarget(seg) + dir * seg.step));
  saveJSON(TIER_KEY, tiers);
  render();
}
// set every run (treadmill + bike stand-ins) to one distance in a tap
const RUN_DISTS = [500, 600, 800, 1000];
function runSegs() { return SEGMENTS.filter((s) => s.hx === 'run'); }
// the same run-equivalent for every version (e.g. 600 m ≈ 36 cal bike ≈ 700 m row)
function runEquiv(x, m) { return snapVal(x.race * m / 1000, x.step, x.step, x.race); }
function setAllRuns(m) {
  runSegs().forEach((s) => versionsOf(s).forEach((_, i) => { const x = E(s, i); tiers[x.tk] = runEquiv(x, m); }));
  saveJSON(TIER_KEY, tiers); render();
  toast(`All runs → ${m >= 1000 ? m / 1000 + ' km' : m + ' m'}`);
}
function selectTimeTier(segId, key) { timeTier[segId] = key; saveJSON(TIMETIER_KEY, timeTier); render(); }

// Global preset — set every station's distance/weight + time tier in one tap, so
// you can start easy and customize individual stations as you level up.
const PRESET_FRAC = { beginner: 0.4, amateur: 0.6, intermediate: 0.8, competition: 1.0 };
function snapVal(v, step, min, max) { return Math.max(min, Math.min(max, Math.round(v / step) * step)); }
function applyPreset(level) {
  const frac = PRESET_FRAC[level];
  if (frac == null) return;
  SEGMENTS.forEach((raw) => {
    const seg = E(raw);
    timeTier[seg.id] = level;
    if (seg.hx === 'run') return;          // runs have their own "All runs" row
    if (seg.scale === 'weight') tiers[seg.tk] = snapVal(seg.raceW * frac, seg.stepW, Math.min(seg.stepW, 4), seg.raceW);
    else tiers[seg.tk] = snapVal(seg.race * frac, seg.step, seg.step, seg.race);
  });
  saveJSON(TIER_KEY, tiers); saveJSON(TIMETIER_KEY, timeTier);
  render();
  toast(`All stations → ${level[0].toUpperCase() + level.slice(1)}`);
}

// best time is tracked per distance/weight so 500 m and 1 km compare fairly
function amountKey(seg) { return String(curTarget(E(seg))); }
function bestFor(seg) { seg = E(seg); const m = segPb[seg.tk]; return m ? m[amountKey(seg)] : undefined; }

function isFullClear(seg) {
  seg = E(seg);
  if (!segDone(seg.id)) return false;
  const e = log[seg.id] || {};
  if (seg.scale === 'weight') { const w = parseFloat(e.w); return !isNaN(w) && w >= curTarget(seg); }
  const metric = seg.unit === 'm' ? parseFloat(e.d) : parseFloat(e.r);   // reps / cal / steps → the 3rd box
  return !isNaN(metric) && metric >= targetAmount(seg);
}

// ============================================================
// Rank title + Hero Level (XP)
// ============================================================
function levelStartXp(L) { return 50 * (L - 1) * L; }
function levelInfo() {
  const xp = xpState.xp || 0;
  let L = 1;
  while (levelStartXp(L + 1) <= xp) L++;
  const start = levelStartXp(L), next = levelStartXp(L + 1);
  return { level: L, xp, inLevel: xp - start, span: next - start, pct: Math.round((xp - start) / (next - start) * 100), toNext: next - xp };
}
function rankInfo() {
  const best = pb ? pb.ms : null;
  if (best == null) return { cur: RANKS[0], next: RANKS[1], rookie: true };
  let idx = 1;
  for (let i = RANKS.length - 1; i >= 1; i--) { if (best <= RANKS[i].ms) { idx = i; break; } }
  return { cur: RANKS[idx], next: RANKS[idx + 1] || null, rookie: false };
}

// ============================================================
// Image DB
// ============================================================
let imgDb = null;
async function loadImageDB() {
  try { const raw = localStorage.getItem(DB_CACHE_KEY); if (raw) { imgDb = JSON.parse(raw); return; } } catch {}
  try {
    const res = await fetch(DB_URL, { cache: 'force-cache' });
    if (res.ok) { imgDb = await res.json(); try { localStorage.setItem(DB_CACHE_KEY, JSON.stringify(imgDb)); } catch {} }
  } catch { imgDb = null; }
}
function imgUrlFor(seg, chosen) {
  if (!imgDb) return null;
  const id = E(seg).img;
  if (!id) return null;
  const ex = imgDb.find((d) => d.id === id);
  return ex && ex.images && ex.images.length ? IMG_BASE_URL + ex.images[0] : null;
}

// ============================================================
// Render
// ============================================================
const root = document.getElementById('race-root');
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function coinHTML() {
  const r = rankInfo(), L = levelInfo();
  return `
    <div class="race-coin">
      <div class="race-coin-badge"><span class="race-coin-emoji">${r.cur.emoji}</span><span class="race-coin-lvl">L${L.level}</span></div>
      <div class="race-coin-main">
        <div class="race-coin-rank">Level ${L.level} · ${r.cur.name}${pb ? ` <span class="race-coin-best">· best ${fmtClock(pb.ms)}</span>` : ''}</div>
        <div class="race-coin-bar"><div class="race-coin-fill" style="width:${L.pct}%"></div></div>
        <div class="race-coin-next">
          <span>${L.inLevel} / ${L.span} XP → Lvl ${L.level + 1}</span>
          <span class="race-coin-title">${r.rookie ? 'Finish a race for your first title' : r.next ? `Next: <b>${r.next.name}</b> @ ${fmtClock(r.next.ms)}` : 'Top title · Elite 🏆'}</span>
        </div>
      </div>
    </div>`;
}

function recordsHTML() {
  const rows = SEGMENTS.map((raw) => {
    const s = E(raw);
    const b = bestFor(s), tt = targetTime(s), delta = b != null ? b - tt : null;
    const amt = s.scale === 'weight' ? `${curTarget(s)} ${s.wUnit}` : `${curTarget(s)} ${s.unit}`;
    return `<tr>
      <td>${esc(s.opt ? `${s.altName} (${shortName(s)})` : s.name)}<span class="rec-tier">${esc(amt)}</span></td>
      <td class="rec-best">${b != null ? fmtClock(b) : '—'}</td>
      <td class="rec-tgt">${fmtClock(tt)}</td>
      <td class="${delta == null ? '' : delta <= 0 ? 'rec-good' : 'rec-over'}">${b != null ? (delta <= 0 ? '−' : '+') + fmtClock(Math.abs(delta)) : ''}</td>
    </tr>`;
  }).join('');
  const recent = (xpState.log || []).slice(0, 6).map((e) => `<li><span>${esc(e.label)}</span><b>+${e.pts}</b></li>`).join('')
    || '<li class="rec-empty">Set a record and hit Save to start earning XP.</li>';
  return `
    <details class="race-records">
      <summary>🏅 Records &amp; progress · ${xpState.prs || 0} PRs · ${xpState.xp || 0} XP</summary>
      <div class="race-records-body">
        <div class="race-records-fin">${pb ? `Best finish <b>${fmtClock(pb.ms)}</b> · ${esc(pb.date)}` : 'No full race finished yet.'}</div>
        <table class="race-rec-table">
          <thead><tr><th>Station · target</th><th>Best</th><th>Aim</th><th>Δ</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="race-rec-xp-head">Recent XP</div>
        <ul class="race-rec-xp">${recent}</ul>
      </div>
    </details>`;
}

function imgSlotHTML(seg, chosen) {
  const url = imgUrlFor(seg, chosen);
  return url
    ? `<div class="race-seg-img has-image"><img src="${esc(url)}" loading="lazy" alt="" /></div>`
    : `<div class="race-seg-img"><span>${seg.icon}</span>${seg.num ? `<span class="race-seg-num">${seg.num}</span>` : ''}</div>`;
}

// distance / weight dial (−/+) with tier label + competition reference
function distLineHTML(seg) {
  seg = E(seg);
  const label = distTierLabel(seg);
  let now, comp;
  if (seg.scale === 'weight') {
    now = `${seg.dist} ${seg.unit} · ${curTarget(seg)} ${seg.wUnit}`;
    comp = seg.opt ? `race ≈ ${seg.raceW} ${seg.wUnit}` : seg.compNote;
  } else { now = `${curTarget(seg)} ${seg.unit}`; comp = `${seg.opt ? 'race ≈' : 'comp'} ${seg.race} ${seg.unit}`; }
  return `
    <div class="race-seg-goal">
      <span class="race-goal-now">${esc(now)}</span>
      <span class="race-goal-tier tier-${label.toLowerCase()}">${esc(label)}</span>
      <span class="race-goal-comp">${esc(comp)}</span>
      <span class="race-step">
        <button type="button" class="race-step-btn" data-seg="${seg.id}" data-dir="-1" ${atMin(seg) ? 'disabled' : ''}>−</button>
        <button type="button" class="race-step-btn" data-seg="${seg.id}" data-dir="1" ${atMax(seg) ? 'disabled' : ''}>+</button>
      </span>
    </div>`;
}

// time dial — named tier chips, each showing the time at the CURRENT distance
function timeTierHTML(seg) {
  const active = curTimeTier(seg);
  const chips = TIME_TIERS.map((t) =>
    `<button type="button" class="race-tchip ${t.key === active ? 'active' : ''}" data-seg="${seg.id}" data-tier="${t.key}">
       <span class="race-tchip-l">${t.label}</span><span class="race-tchip-t">${fmtClock(tierTime(seg, t.key))}</span>
     </button>`).join('');
  return `<div class="race-tiers"><span class="race-tiers-lbl">🎯 aim</span>${chips}</div>`;
}

function doneMetaHTML(seg, st, tt, full) {
  const delta = st - tt, sign = delta <= 0 ? '−' : '+', cls = delta <= 0 ? 'good' : 'over';
  return `${full ? `<span class="race-cmp ${cls}">${sign}${fmtClock(Math.abs(delta))} vs aim</span>`
                 : `<span class="race-cmp partial">partial — logged less than the target</span>`}
          <span class="race-cmp-t">${full ? 'record set on Save' : `full target = ${seg.scale === 'weight' ? curTarget(seg) + ' ' + seg.wUnit : targetAmount(seg) + ' ' + seg.unit}`}</span>`;
}

function segCard(raw) {
  const seg = E(raw);
  const done = segDone(seg.id);
  const running = segRunning(seg.id);
  const el = segElapsed(seg.id);
  const st = segTime(seg.id);
  const chosen = seg.opt;
  const swapped = chosen > 0;
  // A replacement card is a full card: its own name, dial, race-equivalent
  // target, time table, demo, cues — the station stays as a "for …" tag.
  const displayName = swapped ? seg.altName : seg.name;
  const workLine = swapped ? `🛠 ${seg.equip || ''}` : '';
  const subText = swapped ? `${seg.why || ''} ${seg.compNote ? '≈ ' + seg.compNote : ''}`.trim() : seg.sub;
  const videoQ = seg.video;
  const coach = swapped && (seg.cues.length || seg.mistake)
    ? `<div class="race-seg-coach">${seg.cues.map((c) => `<span>✓ ${esc(c)}</span>`).join('')}${seg.mistake ? `<span class="race-seg-miss">✗ ${esc(seg.mistake)}</span>` : ''}</div>` : '';
  const e = log[seg.id] || {};
  const best = bestFor(seg);
  const tt = targetTime(seg);
  const full = isFullClear(seg);
  const video = `<a class="race-seg-demo" href="https://www.youtube.com/results?search_query=${videoQ}" target="_blank" rel="noopener" title="Demo">📹</a>`;

  // Station timer strip — its own Start/Stop, so any order gives honest times.
  let meta;
  if (done) {
    meta = `<span class="race-split-meta">${doneMetaHTML(seg, st, tt, full)}</span>`;
  } else {
    meta = `<span class="race-split-meta"><span class="race-seg-aim">aim ${fmtClock(tt)}</span>
      <span class="race-cmp-t">${running ? 'running — tap Stop when done' : el > 0 ? '' : 'tap Start when you begin'}</span></span>`;
  }
  const goLabel = running ? '■ Stop' : done ? '▶ Resume' : '▶ Start';
  const goCls = running ? 'stop' : done ? 'resume' : '';
  const timer = `
      <div class="race-seg-timer ${running ? 'running' : ''}">
        <span class="race-seg-clock ${running && el > tt ? 'over' : ''}" data-segclock="${seg.id}">${fmtClock(el)}</span>
        ${meta}
        <button type="button" class="race-seg-go ${goCls}" data-seg="${seg.id}">${goLabel}</button>
        ${el > 0 || done || running
          ? `<button type="button" class="race-seg-redo" data-seg="${seg.id}" title="Clear this station's time" aria-label="Clear time">↺</button>`
          : `<button type="button" class="race-seg-redo is-empty" tabindex="-1" aria-hidden="true" disabled>↺</button>`}
      </div>`;

  // Dist / Wt / 3rd box (reps, cal or steps — whatever this version counts)
  const fixed = seg.scale === 'weight' ? seg.dist : curTarget(seg);
  const dPlace = seg.unit === 'm' ? String(fixed) : 'm';
  const wPlace = seg.scale === 'weight' ? String(curTarget(seg)) : 'kg';
  const rPlace = seg.unit === 'm' ? '#' : String(fixed);
  const rLabel = seg.unit === 'cal' ? 'Cal' : seg.unit === 'steps' ? 'Steps' : 'Reps';

  return `
    <div class="race-seg race-seg-${seg.kind} ${done ? 'done' : ''} ${running ? 'running' : ''}" data-seg="${seg.id}">
      <div class="race-seg-top">
        ${imgSlotHTML(seg)}
        <div class="race-seg-body">
          <div class="race-seg-name">${esc(displayName)}${swapped ? ` <span class="race-swapped-tag">for ${esc(shortName(seg))}</span>` : ''}</div>
          ${distLineHTML(seg)}
          ${workLine ? `<div class="race-seg-working">${esc(workLine)}</div>` : ''}
          <div class="race-seg-sub">${esc(subText)}</div>
          ${coach}
        </div>
        <div class="race-seg-tools">
          ${video}
          <button type="button" class="race-rest-btn" data-seg="${seg.id}" title="Rest timer">⏱</button>
          <button type="button" class="race-swap-btn" data-seg="${seg.id}" title="Choose version">▾</button>
        </div>
      </div>

      <div class="race-swap-panel" data-seg="${seg.id}">
        <div class="race-swap-head">Choose version · each has its own target &amp; times</div>
        ${versionsOf(seg.__base).map((_, i) => {
          const v = E(seg.__base, i);
          const nm = i === 0 ? `${seg.__base.name} — race standard` : v.altName;
          return `
          <button type="button" class="race-swap-opt ${i === chosen ? 'active' : ''}" data-seg="${seg.id}" data-opt="${i}">
            <b>${esc(nm)}</b><span>race ≈ ${esc(specText(v))} · ${esc(TIME_TIERS.find((t) => t.key === curTimeTier(v)).label)} aim ${fmtClock(v.times[curTimeTier(v)])}</span>
          </button>`;
        }).join('')}
      </div>

      ${timeTierHTML(seg)}
      ${best != null ? `<div class="race-seg-best">your best at ${esc(seg.scale === 'weight' ? curTarget(seg) + ' ' + seg.wUnit : curTarget(seg) + ' ' + seg.unit)}: <b>${fmtClock(best)}</b></div>` : ''}
      ${timer}

      <div class="race-seg-inputs">
        <label>Dist<input type="text" inputmode="decimal" data-seg="${seg.id}" data-f="d" value="${esc(e.d || '')}" placeholder="${esc(dPlace)}" /></label>
        <label>Wt<input type="text" inputmode="decimal" data-seg="${seg.id}" data-f="w" value="${esc(e.w || '')}" placeholder="${esc(wPlace)}" /></label>
        <label>${rLabel}<input type="text" inputmode="numeric" data-seg="${seg.id}" data-f="r" value="${esc(e.r || '')}" placeholder="${esc(rPlace)}" /></label>
      </div>
    </div>`;
}

function render() {
  root.innerHTML = `
    <div class="race-preset">
      <span class="race-preset-lbl">Set all&nbsp;→</span>
      <button type="button" class="race-preset-btn" data-preset="beginner">Beginner</button>
      <button type="button" class="race-preset-btn" data-preset="amateur">Amateur</button>
      <button type="button" class="race-preset-btn" data-preset="intermediate">Inter</button>
      <button type="button" class="race-preset-btn" data-preset="competition">Comp</button>
    </div>
    <div class="race-preset race-runset">
      <span class="race-preset-lbl">All runs&nbsp;→</span>
      ${RUN_DISTS.map((m) => {
        const on = runSegs().every((s) => { const x = E(s); return curTarget(x) === runEquiv(x, m); });
        return `<button type="button" class="race-preset-btn race-runset-btn ${on ? 'active' : ''}" data-runs="${m}">${m >= 1000 ? m / 1000 + ' km' : m + ' m'}</button>`;
      }).join('')}
    </div>

    ${coinHTML()}

    <div class="race-timer">
      <div class="race-dial">
        <svg class="race-ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle class="race-ring-bg" cx="60" cy="60" r="52"></circle>
          <circle class="race-ring-fg" id="race-ring-fg" cx="60" cy="60" r="52"
            stroke-dasharray="326.7" stroke-dashoffset="326.7" transform="rotate(-90 60 60)"></circle>
        </svg>
        <div class="race-dial-c">
          <div class="race-clock" id="race-clock">${fmtClock(elapsedMs())}</div>
          <div class="race-dial-count" id="race-progress-text">0 / ${SEGMENTS.length}</div>
          <div class="race-seg-live" id="race-seg-live"></div>
        </div>
      </div>
      <div class="race-timer-controls">
        <button type="button" class="race-btn race-btn-go" id="race-go">▶ Start</button>
        <button type="button" class="race-btn race-btn-pause" id="race-pause">❚❚ Pause</button>
        <button type="button" class="race-btn" id="race-reset">Reset</button>
      </div>
      <div class="race-finish-banner" id="race-finish-banner"></div>
    </div>

    ${recordsHTML()}

    <div class="race-howto">
      Two dials per station: <b>−/+</b> sets the <b>distance/weight</b>, the <b>🎯 aim</b> chips set your <b>time tier</b>
      (real HYROX benchmarks that scale to your distance). Do a Competition distance at an Amateur pace, or the reverse —
      both change freely. Every card has its <b>own ▶ Start / ■ Stop</b> timer, so you can do stations in <b>any order</b>
      when the gym is busy — times stay right. Stop logs the target (edit down if you did less); <b>↺</b> clears a station.
      Waiting for a machine? <b>Pause</b> the big clock — it resumes when you start the next station.
      <b>XP banks only on “Save & Log XP.”</b> Beginner tip: rest 60–90 s between stations (⏱).
    </div>

    <div class="race-wrnote">🌍 Just for fun — the HYROX solo world record is ≈ <b>0:54</b> (men) · ≈ <b>0:56</b> (women). Each station's <b>🌍WR</b> aim chip is a world-class split scaled to your distance.</div>

    <div class="race-segs">${SEGMENTS.map(segCard).join('')}</div>

    <div class="race-actions">
      <button type="button" class="ghost-btn gym-save-tracker" id="race-save">Save &amp; Log XP</button>
      <button type="button" class="ghost-btn" id="race-copy">Copy</button>
    </div>`;
  renderTimer();
}

const RING_CIRC = 2 * Math.PI * 52;
function renderTimer() {
  const clk = document.getElementById('race-clock');
  if (clk) { const t = fmtClock(allDone() ? finishMs() : elapsedMs()); clk.textContent = t; clk.classList.toggle('long', t.length > 5); }
  const live = document.getElementById('race-seg-live');
  const rs = runningSeg();
  if (live) live.innerHTML = rs ? `<span class="race-live-nm">▶ ${esc(dialName(rs))}</span><b>${fmtClock(segElapsed(rs.id))}</b>` : '';
  // live station clocks
  SEGMENTS.forEach((s) => {
    if (!segRunning(s.id)) return;
    const c = root.querySelector(`[data-segclock="${s.id}"]`);
    if (!c) return;
    const ms = segElapsed(s.id);
    c.textContent = fmtClock(ms);
    c.classList.toggle('over', ms > targetTime(s));
  });
  const go = document.getElementById('race-go');
  if (go) {
    const fin = allDone();
    go.textContent = fin ? '🏁 Finished' : elapsedMs() > 0 ? '▶ Resume' : '▶ Start';
    go.disabled = sim.running || fin;
  }
  const pause = document.getElementById('race-pause'); if (pause) pause.disabled = !sim.running;
  const pt = document.getElementById('race-progress-text'); if (pt) pt.textContent = `${doneCount()} / ${SEGMENTS.length}`;
  const ring = document.getElementById('race-ring-fg');
  if (ring) ring.style.strokeDashoffset = String(RING_CIRC * (1 - doneCount() / SEGMENTS.length));
  const fin = document.getElementById('race-finish-banner');
  if (fin) {
    const total = finishMs();
    if (total != null) { fin.classList.add('show'); fin.innerHTML = `🏁 All ${SEGMENTS.length} done — <b>${fmtClock(total)}</b> · stations ${fmtClock(workMs())} · tap “Save &amp; Log XP”`; }
    else fin.classList.remove('show');
  }
}

// ============================================================
// Timer control (+ Wake Lock)
// ============================================================
let tickId = null, wakeLock = null, wakePending = false;
async function requestWake() {
  if (!('wakeLock' in navigator) || wakeLock || wakePending) return;
  wakePending = true;
  try {
    const lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null; });
    // everything may have stopped while the request was pending
    if (sim.running || runningSeg()) wakeLock = lock; else lock.release().catch(() => {});
  } catch {} finally { wakePending = false; }
}
function releaseWake() { if (wakeLock) { try { wakeLock.release(); } catch {} wakeLock = null; } }
function startTick() { if (!tickId) tickId = setInterval(renderTimer, 250); }
function stopTick() { if (tickId) { clearInterval(tickId); tickId = null; } }
// keep ticking + screen awake while the main clock OR any station runs
function syncTick() {
  if (sim.running || runningSeg()) { startTick(); if (!wakeLock) requestWake(); }
  else { stopTick(); releaseWake(); }
}

// an explicit Pause/Resume of the big clock is the user's call — a later
// mis-tap undo must not override it
function markMainTouched() {
  const rs = runningSeg();
  const u = rs && sim.segs[rs.id].undo;
  if (u) u.mainTouched = true;
}
function startTimer() {
  if (sim.running || allDone()) return;
  sim.running = true; sim.lastStart = Date.now();
  markMainTouched(); syncTick(); persistSim(); renderTimer();
}
function pauseTimer() {
  if (!sim.running) return;
  sim.accumMs += Date.now() - sim.lastStart; sim.running = false; sim.lastStart = null;
  markMainTouched(); syncTick(); persistSim(); renderTimer();
}
function resetRace() {
  if (!confirm('Reset the clock and every station time for a fresh race? (Your targets, records + XP stay.)')) return;
  sim = freshSim();
  syncTick(); persistSim(); render();
}

// ---- per-station Start / Stop ----
// Every Start remembers what it changed (`undo`: the big clock, the frozen
// finish, and any station it auto-stopped). A fresh station stopped under 10 s,
// or a Resume stopped within 10 s, is a mis-tap: it's taken back and all of
// that is put back — including the station you were really doing.
function mainSnap() { return { running: sim.running, accumMs: sim.accumMs, lastStart: sim.lastStart }; }
function restoreMain(m) { sim.running = m.running; sim.accumMs = m.accumMs; sim.lastStart = m.lastStart; }
// backTo: undefined = the user tapped Stop (roll everything back);
//         an id = another station is being started — roll back only if it's
//         the very station this mis-tap interrupted, otherwise keep going.
// the interrupted station can only be put back if nobody touched it since the
// auto-stop (not cleared, resumed or restarted in the meantime)
function otherIntact(u) {
  const o = u && u.other;
  const cur = o && sim.segs[o.id];
  return !!(cur && cur.done && !cur.start && cur.acc === o.stoppedAcc);
}
function undoSideEffects(u, backTo) {
  if (!u) return null;
  const otherBack = otherIntact(u) && (backTo == null || backTo === u.other.id);
  if (backTo != null && !otherBack) return null;
  if (!u.mainTouched) restoreMain(u.main);   // an explicit Pause/Resume since then wins
  sim.finishMs = u.finish;
  if (otherBack) { sim.segs[u.other.id] = u.other.st; return u.other.id; }
  return null;
}
// safety net: a finish exists exactly when all 16 are done, and the big clock
// is stopped then
function settle() {
  if (allDone()) {
    if (sim.finishMs == null) sim.finishMs = elapsedMs();
    if (sim.running) { sim.accumMs = elapsedMs(); sim.running = false; sim.lastStart = null; }
  } else if (sim.finishMs != null) sim.finishMs = null;
}

function startSeg(segId) {
  const seg = SEGMENTS.find((s) => s.id === segId);
  if (!seg || segRunning(segId)) return;
  let prevMain = mainSnap(), prevFinish = sim.finishMs;
  // one station at a time — stop the one still running (forgot to tap Stop)
  const other = runningSeg();
  let autoStopped = null;
  if (other) {
    const { undo: _ignored, ...before } = sim.segs[other.id];
    const r = stopSeg(other.id, segId);
    if (r && r.back === segId) {       // `other` was a mis-tap → back to this station
      toast(`${shortName(other)} ${r.kind === 'reverted' ? 'resume undone' : 'under 10 s — not counted'} · ${shortName(seg)} continues`, 'warn', 4000);
      syncTick(); persistSim(); render();
      return;
    }
    if (r && r.kind === 'done') {
      autoStopped = { id: other.id, st: before, stoppedAcc: sim.segs[other.id].acc };
      toast(`${shortName(other)} auto-stopped at ${fmtClock(segElapsed(other.id))}`, 'warn', 4500);
    } else if (r && (r.kind === 'cancelled' || r.kind === 'reverted')) {
      toast(`${shortName(other)} ${r.kind === 'reverted' ? 'resume undone — time unchanged' : 'under 10 s — not counted'}`, 'warn', 4000);
      // chained mis-taps: this start takes over the first mis-tap's "before"
      // state, so undoing it still returns to how things were before any of them
      if (r.undo) {
        if (!r.undo.mainTouched) { prevMain = r.undo.main; }
        prevFinish = r.undo.finish;
        autoStopped = otherIntact(r.undo) ? r.undo.other : null;
      }
    }
  }
  const st = sim.segs[segId] || (sim.segs[segId] = { acc: 0, start: null, done: false });
  st.undo = { resumed: st.acc > 0, main: prevMain, finish: prevFinish, other: autoStopped };
  st.start = Date.now(); st.done = false;
  sim.finishMs = null;
  // starting a station starts / resumes the whole-session clock
  if (!sim.running) { sim.running = true; sim.lastStart = Date.now(); }
  syncTick(); persistSim(); render();
}
// returns { kind: 'done' | 'cancelled' | 'reverted', back: id-of-restored-station|null } or null if not running
function stopSeg(segId, backTo) {
  const st = sim.segs[segId];
  if (!st || !st.start) return null;
  const added = Math.max(0, Date.now() - st.start);
  const u = st.undo;
  if (u && u.resumed && added < MIN_SEG_MS) {      // accidental Resume → time unchanged
    st.start = null; st.done = true; delete st.undo;
    const back = undoSideEffects(u, backTo);
    settle(); persistSim();
    return { kind: 'reverted', back, undo: u };
  }
  if (st.acc + added < MIN_SEG_MS) {               // mis-tap / wrong card → not a result
    delete sim.segs[segId];
    const back = undoSideEffects(u, backTo);
    settle(); persistSim();
    return { kind: 'cancelled', back, undo: u };
  }
  st.acc += added; st.start = null; st.done = true; delete st.undo;
  // stopping = "I did the target": write the CURRENT target (so last week's
  // 600 m doesn't read as a partial at 800 m) unless you typed a value this
  // session — then only blanks are filled. Edit down if you did less.
  const rawSeg = SEGMENTS.find((s) => s.id === segId);
  if (rawSeg) {
    const seg = E(rawSeg);
    const e = (log[segId] || (log[segId] = {}));
    const keep = !!sim.edited[segId];
    const put = (f, v) => { if (!keep || !e[f]) e[f] = String(v); };
    const amtField = seg.unit === 'm' ? 'd' : 'r';
    if (seg.scale === 'weight') { put('w', curTarget(seg)); put(amtField, seg.dist); }
    else put(amtField, targetAmount(seg));
    saveJSON(LOG_KEY, log);
  }
  // last station done → freeze the whole-session clock as the finish time
  if (allDone()) {
    sim.finishMs = elapsedMs();
    if (sim.running) { sim.accumMs = elapsedMs(); sim.running = false; sim.lastStart = null; }
  }
  settle();
  try { navigator.vibrate && navigator.vibrate(60); } catch {}
  persistSim();
  return { kind: 'done', back: null, undo: null };
}
function toggleSeg(segId) {
  const now = Date.now();
  // sliding guard: taps on the same card closer than 0.7 s apart are ignored,
  // and every ignored tap extends it — mashing Stop can never turn into Resume
  const recent = lastSegTap.id === segId && now - lastSegTap.t < SEG_TAP_GUARD_MS;
  lastSegTap = { id: segId, t: now };
  if (recent) return;
  if (segRunning(segId)) {
    const r = stopSeg(segId);
    const back = r && r.back ? SEGMENTS.find((s) => s.id === r.back) : null;
    const tail = back ? ` · ${shortName(back)} continues` : '';
    if (r && r.kind === 'cancelled') toast(`Under 10 s — not counted${tail}`, 'warn', 3500);
    else if (r && r.kind === 'reverted') toast(`Resume undone — time unchanged${tail}`, 'warn', 3500);
    syncTick(); render();
  } else startSeg(segId);
}
function clearSeg(segId) {
  const seg = SEGMENTS.find((s) => s.id === segId);
  const st = sim.segs[segId];
  if (!seg || !st) return;
  if (!confirm(`Clear the time for ${seg.name}?`)) return;
  delete sim.segs[segId];
  // clearing a station that's running: put back what its Start changed
  // (big clock, finish, the station it interrupted) — same as a quick Stop
  const back = st.start && st.undo ? undoSideEffects(st.undo) : null;
  settle();
  if (back) { const b = SEGMENTS.find((s) => s.id === back); toast(`Cleared · ${shortName(b)} continues`, 'warn', 3500); }
  syncTick(); persistSim(); render();
}

// ============================================================
// Save & Log XP — the ONLY place records + XP commit.
// ============================================================
function saveToTracker() {
  let gained = 0;
  const events = [];
  SEGMENTS.forEach((raw) => {
    const seg = E(raw);
    if (!isFullClear(seg)) return;
    const st = segTime(seg.id);
    if (st == null || st < MIN_SEG_MS) return;
    const key = amountKey(seg);
    const bucket = segPb[seg.tk] || (segPb[seg.tk] = {});
    if (bucket[key] == null || st < bucket[key]) {
      const first = bucket[key] == null;
      bucket[key] = st;
      const pts = first ? 25 : 40;
      gained += pts; events.push({ label: `${seg.opt ? seg.altName : seg.name} ${first ? 'logged' : 'PB!'}`, pts });
    }
  });
  const allFull = SEGMENTS.every((s) => isFullClear(s));
  if (allFull) {
    const total = finishMs();
    if (total != null && (!pb || total < pb.ms)) {
      const first = !pb;
      pb = { ms: total, date: todayStr() };
      gained += 150; events.push({ label: first ? 'First finish!' : 'Finish PB!', pts: 150 });
    }
  }
  const logged = SEGMENTS.filter((s) => segDone(s.id));
  if (!logged.length) { toast('Nothing timed yet — Start and Stop a station first.'); return; }

  if (gained > 0) {
    const before = levelInfo().level;
    xpState.xp = (xpState.xp || 0) + gained;
    xpState.prs = (xpState.prs || 0) + events.length;
    (xpState.log = xpState.log || []);
    events.forEach((e) => xpState.log.unshift({ date: todayStr(), label: e.label, pts: e.pts }));
    if (xpState.log.length > 40) xpState.log.length = 40;
    saveJSON(XP_KEY, xpState); saveJSON(SEGPB_KEY, segPb); saveJSON(PB_KEY, pb);
    const after = levelInfo().level;
    toast(after > before ? `⚡ LEVEL ${after}! +${gained} XP banked` : `✓ Saved · +${gained} XP`);
  } else {
    toast('✓ Saved · no new records this time');
  }

  const total = finishMs() ?? elapsedMs();
  const exercises = logged.map((s) => {
    const st = segTime(s.id), e = log[s.id] || {};
    const x = E(s);
    const name = x.opt > 0 ? `${x.altName} (for ${s.name})` : s.name;
    return { exId: 'hx_' + s.id, name, target: x.scale === 'weight' ? `${x.dist} ${x.unit} @ ${curTarget(x)} ${x.wUnit}` : `${targetAmount(x)} ${x.unit}`,
      done: segDone(s.id), sets: [{ w: e.w || '', r: st != null ? fmtClock(st) : (e.r || '') }] };
  });
  try {
    const KEY = 'rtc_tracker_training_v1';
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    arr.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), date: todayStr(),
      person: 'him', day: 'hyrox', dayLabel: `Hyrox Race Sim · ${fmtClock(total)}`, exercises });
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {}
  render();
}

function copyRace() {
  const lines = [`HYROX Race Sim — ${todayStr()}`];
  const total = finishMs();
  if (total != null) lines.push(`Finish: ${fmtClock(total)} · stations ${fmtClock(workMs())}`);
  SEGMENTS.forEach((raw) => {
    const s = E(raw);
    const st = segTime(s.id), e = log[s.id] || {};
    const bits = [e.d && `${e.d}m`, e.w && `${e.w}kg`, e.r && `${e.r} ${s.unit === 'm' ? 'reps' : s.unit}`].filter(Boolean).join(' · ');
    const nm = s.opt ? `${s.altName} (for ${raw.name})` : raw.name;
    lines.push(`${nm} — ${curTimeTier(s)} aim${bits ? ` · ${bits}` : ''} · ${st != null ? fmtClock(st) : '—'} (aim ${fmtClock(targetTime(s))})`);
  });
  const text = lines.join('\n');
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('✓ Copied'), () => fallbackCopy(text));
  else fallbackCopy(text);
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('✓ Copied'); } catch { toast('Copy failed'); } ta.remove();
}
function toast(msg, kind, ms) {
  const life = ms || 2800;
  const t = document.createElement('div');
  t.className = 't-toast' + (kind ? ' ' + kind : '');
  t.textContent = msg;
  // fade out just before removal, however long this toast lives
  t.style.animationDelay = `0s, ${Math.max(0, life - 300)}ms`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), life);
}

// ============================================================
// Rest timer
// ============================================================
let restEl = null, restState = null;
function ensureRestEl() {
  if (restEl) return restEl;
  restEl = document.createElement('div');
  restEl.className = 'race-rest';
  restEl.innerHTML = `
    <div class="race-rest-row"><span id="race-rest-name">Rest</span><button type="button" id="race-rest-x" aria-label="Close">×</button></div>
    <div class="race-rest-time" id="race-rest-time">1:15</div>
    <div class="race-rest-ctrls"><button type="button" data-d="-15">−15s</button><button type="button" id="race-rest-go">Start</button><button type="button" data-d="15">+15s</button></div>`;
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
  restEl.classList.remove('done'); restEl.classList.add('open'); paintRest();
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
  const runset = e.target.closest('.race-runset-btn');
  if (runset) { setAllRuns(parseInt(runset.dataset.runs, 10)); return; }
  const preset = e.target.closest('.race-preset-btn');
  if (preset) { applyPreset(preset.dataset.preset); return; }
  const step = e.target.closest('.race-step-btn');
  if (step) { if (!step.disabled) stepTarget(step.dataset.seg, parseInt(step.dataset.dir, 10)); return; }
  const tchip = e.target.closest('.race-tchip');
  if (tchip) { selectTimeTier(tchip.dataset.seg, tchip.dataset.tier); return; }
  const swapOpt = e.target.closest('.race-swap-opt');
  if (swapOpt) { swaps[swapOpt.dataset.seg] = parseInt(swapOpt.dataset.opt, 10); saveJSON(SWAPS_KEY, swaps); render(); return; }
  const swapBtn = e.target.closest('.race-swap-btn');
  if (swapBtn) { const p = root.querySelector(`.race-swap-panel[data-seg="${swapBtn.dataset.seg}"]`); if (p) p.classList.toggle('open'); return; }
  const restBtn = e.target.closest('.race-rest-btn');
  if (restBtn) { const s = SEGMENTS.find((x) => x.id === restBtn.dataset.seg); openRest(s ? s.name : 'station'); return; }
  const segGo = e.target.closest('.race-seg-go');
  if (segGo) { toggleSeg(segGo.dataset.seg); return; }
  const segRedo = e.target.closest('.race-seg-redo');
  if (segRedo) { clearSeg(segRedo.dataset.seg); return; }
  if (e.target.closest('#race-go'))    { startTimer(); return; }
  if (e.target.closest('#race-pause')) { pauseTimer(); return; }
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
  if (!sim.edited[id]) { sim.edited[id] = true; persistSim(); }
  const seg = SEGMENTS.find((s) => s.id === id);
  const card = inp.closest('.race-seg');
  if (seg && card && segDone(id)) {
    const meta = card.querySelector('.race-split-meta');
    if (meta) meta.innerHTML = doneMetaHTML(seg, segTime(id), targetTime(seg), isFullClear(seg));
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) return; if ((sim.running || runningSeg()) && !wakeLock) requestWake(); renderTimer(); });

// ============================================================
// Init
// ============================================================
render();
syncTick();
loadImageDB().then(() => { if (imgDb) render(); });
