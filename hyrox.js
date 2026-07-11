// hyrox.js — HYROX race simulator (gym-card format + timer, splits, RPG ranks).
//
// 8 × 1 km runs interleaved with 8 stations, in the order Alison runs them at
// the YMCA: Ski + Row first with real treadmill runs, the rest in the next room
// with the bike replacing each run. Kit the Y lacks (sled/wall/sandbags) shows
// the real target plus a working substitute; every station has a ▾ Swap menu
// (which also swaps the card image).
//
// TWO INDEPENDENT DIALS per station:
//   • Distance / weight tier — how much you do (−/+), Beginner → Competition.
//   • Time tier — how fast you aim (named chips: Beginner/Amateur/Intermediate/
//     Competition/Elite), with REAL HYROX benchmark times that scale to the
//     distance you picked. You can do a Competition distance at an Amateur time,
//     or the reverse — both change freely.
//
// A split means "I did the current target" (auto-fills the metric), so it counts
// as a full clear; edit the box down only if you did less. Records + XP commit
// ONLY on "Save & Log XP" — nothing counts by accident. Best times are tracked
// per distance so 500 m and 1 km are compared fairly. Wall-clock timer survives
// backgrounding; a Wake Lock keeps the screen awake.
//
// Storage:
//   rtc_hyrox_sim_v1       — live attempt
//   rtc_hyrox_log_v1       — { segId:{d,w,r} } structured log
//   rtc_hyrox_tier_v1      — { segId: distance/weight target }
//   rtc_hyrox_timetier_v1  — { segId: timeTierKey }
//   rtc_hyrox_swaps_v1     — { segId: optionIndex }
//   rtc_hyrox_pb_v1        — { ms, date } best finish
//   rtc_hyrox_segpb_v2     — { segId: { amountKey: ms } } best split per distance
//   rtc_hyrox_xp_v1        — { xp, prs, log[] }

// ============================================================
// Benchmark times (ms) to complete the RACE amount, by tier. Sourced from HYROX
// result analyses (Men's Open avg ~5:15–5:30/km run, Ski ~4:30, Row ~4:45,
// Wall Balls ~6:00, Farmers ~2:20, Lunges ~4:30, Burpees ~5:00; elite ~30–40%
// faster; beginners run/walk ~8–9/km). Times scale linearly with distance.
// ============================================================
const T = (m, s) => (m * 60 + s) * 1000;
const RUN_TIMES   = { beginner: T(9, 0),  amateur: T(7, 30), intermediate: T(6, 0),  competition: T(5, 0),  elite: T(3, 45), wr: T(2, 45) };
const SKI_TIMES   = { beginner: T(6, 0),  amateur: T(5, 15), intermediate: T(4, 45), competition: T(4, 0),  elite: T(3, 30), wr: T(3, 0) };
const ROW_TIMES   = { beginner: T(5, 45), amateur: T(5, 10), intermediate: T(4, 45), competition: T(4, 10), elite: T(3, 45), wr: T(3, 0) };
const BBJ_TIMES   = { beginner: T(6, 30), amateur: T(5, 30), intermediate: T(5, 0),  competition: T(4, 0),  elite: T(3, 15), wr: T(2, 45) };
const CARRY_TIMES = { beginner: T(3, 0),  amateur: T(2, 40), intermediate: T(2, 20), competition: T(2, 0),  elite: T(1, 40), wr: T(1, 20) };
const LUNGE_TIMES = { beginner: T(5, 30), amateur: T(5, 0),  intermediate: T(4, 30), competition: T(3, 45), elite: T(3, 0),  wr: T(2, 30) };
const WB_TIMES    = { beginner: T(7, 30), amateur: T(6, 30), intermediate: T(6, 0),  competition: T(4, 30), elite: T(3, 30), wr: T(3, 15) };
const SLED_TIMES  = { beginner: T(2, 30), amateur: T(2, 10), intermediate: T(1, 50), competition: T(1, 30), elite: T(1, 10), wr: T(0, 50) };

const TIME_TIERS = [
  { key: 'beginner', label: 'Beg' },
  { key: 'amateur', label: 'Am' },
  { key: 'intermediate', label: 'Int' },
  { key: 'competition', label: 'Comp' },
  { key: 'elite', label: 'Elite' },
  { key: 'wr', label: '🌍WR' },
];

const BIKE_SUBS = ['Bike ~4–5 min hard (~2.5–3 km)', 'Row 1 km hard', 'Treadmill 1 km if free'];

// scale: 'amount' (distance/reps scale start→race) | 'weight' (weight scales, distance fixed)
const SEGMENTS = [
  { id: 'run1', kind: 'run', icon: '🏃', name: 'Run 1 · 1 km', img: 'Running_Treadmill', video: 'treadmill+running+form',
    scale: 'amount', unit: 'm', start: 1000, race: 1000, step: 100, times: RUN_TIMES,
    sub: 'Treadmill — steady & controlled, this is the easy one.',
    subs: ['Treadmill', 'Outdoor', 'Bike ~4–5 min hard'] },
  { id: 'ski', kind: 'station', icon: '🎿', num: 1, name: 'SkiErg', img: 'Straight-Arm_Pulldown', video: 'skierg+technique+hyrox',
    scale: 'amount', unit: 'm', start: 400, race: 1000, step: 100, times: SKI_TIMES,
    sub: 'Drive from the hips, not just arms. Build the distance, then the speed.',
    subs: ['SkiErg', 'Row (if ski busy)', 'Banded lat pulldowns hard'] },
  { id: 'run2', kind: 'run', icon: '🏃', name: 'Run 2 · 1 km', img: 'Running_Treadmill', video: 'treadmill+running+form',
    scale: 'amount', unit: 'm', start: 1000, race: 1000, step: 100, times: RUN_TIMES,
    sub: 'Treadmill again (Ski + Row are by the treadmill).',
    subs: ['Treadmill', 'Outdoor', 'Bike ~4–5 min hard'] },
  { id: 'row', kind: 'station', icon: '🚣', num: 2, name: 'RowErg', img: 'Rowing_Stationary', video: 'rowerg+technique+hyrox',
    scale: 'amount', unit: 'm', start: 400, race: 1000, step: 100, times: ROW_TIMES,
    sub: 'Legs–core–arms order. Long, strong strokes; don’t yank early.',
    subs: ['RowErg', 'SkiErg', 'Bike 2 km hard'] },
  { id: 'bike3', kind: 'bike', icon: '🚴', name: 'Bike 3 · run sub', img: 'Bicycling_Stationary', video: 'assault+bike+intervals',
    scale: 'amount', unit: 'm', start: 1000, race: 1000, step: 100, times: RUN_TIMES,
    sub: 'Bike replaces the run here (next room). Run-equivalent: ~2.5–3 km hard on the bike per 1 km.',
    subs: BIKE_SUBS },
  { id: 'push', kind: 'station', icon: '🛷', num: 3, name: 'Sled Push', img: 'Sled_Push', video: 'hyrox+sled+push+technique',
    scale: 'weight', unit: 'm', dist: 50, startW: 12, raceW: 24, stepW: 2, wUnit: 'kg/hand', compNote: 'race sled ≈ 152 kg', times: SLED_TIMES,
    sub: 'YMCA has no sled → heavy DB/KB suitcase march 50 m. Build the weight toward race feel.',
    subs: ['DB/KB suitcase march', 'Leg-press burnout', 'Prowler / hack-squat if free'] },
  { id: 'bike4', kind: 'bike', icon: '🚴', name: 'Bike 4 · run sub', img: 'Bicycling_Stationary', video: 'assault+bike+intervals',
    scale: 'amount', unit: 'm', start: 1000, race: 1000, step: 100, times: RUN_TIMES,
    sub: 'Hard 4–5 min effort — match a 1 km run.', subs: BIKE_SUBS },
  { id: 'pull', kind: 'station', icon: '🪝', num: 4, name: 'Sled Pull', img: 'Sled_Row', video: 'hyrox+sled+pull+technique',
    scale: 'weight', unit: 'm', dist: 50, startW: 12, raceW: 24, stepW: 2, wUnit: 'kg', compNote: 'race sled ≈ 103 kg', times: SLED_TIMES,
    sub: 'No sled → hard seated cable rows / heavy DB bent rows, hand-over-hand tempo.',
    subs: ['Seated cable row', 'Heavy DB bent row', 'Ring / TRX row'] },
  { id: 'bike5', kind: 'bike', icon: '🚴', name: 'Bike 5 · run sub', img: 'Bicycling_Stationary', video: 'assault+bike+intervals',
    scale: 'amount', unit: 'm', start: 1000, race: 1000, step: 100, times: RUN_TIMES,
    sub: 'Hard 4–5 min effort — match a 1 km run.', subs: BIKE_SUBS },
  { id: 'bbj', kind: 'station', icon: '🤸', num: 5, name: 'Burpee Broad Jumps', img: 'Freehand_Jump_Squat', video: 'burpee+broad+jump+form',
    scale: 'amount', unit: 'm', start: 40, race: 80, step: 10, times: BBJ_TIMES,
    sub: '⚠️ Brace the lower back · control every landing (ankle). ~15–18 reps ≈ 80 m.',
    subs: ['Burpee broad jumps', 'Burpee + step forward', 'Squat-thrust + broad step'] },
  { id: 'bike6', kind: 'bike', icon: '🚴', name: 'Bike 6 · run sub', img: 'Bicycling_Stationary', video: 'assault+bike+intervals',
    scale: 'amount', unit: 'm', start: 1000, race: 1000, step: 100, times: RUN_TIMES,
    sub: 'Hard 4–5 min effort — match a 1 km run.', subs: BIKE_SUBS },
  { id: 'carry', kind: 'station', icon: '🧳', num: 6, name: 'Farmers Carry', img: 'Farmers_Walk', video: 'farmers+carry+technique',
    scale: 'weight', unit: 'm', dist: 200, startW: 12, raceW: 24, stepW: 2, wUnit: 'kg/hand', compNote: 'race 2 × 24 kg', times: CARRY_TIMES,
    sub: 'Heaviest DBs you can grip — tall chest, brace, don’t shrug.',
    subs: ['Farmers carry, heaviest DBs', 'KB rack carry', 'Trap-bar hold walk'] },
  { id: 'bike7', kind: 'bike', icon: '🚴', name: 'Bike 7 · run sub', img: 'Bicycling_Stationary', video: 'assault+bike+intervals',
    scale: 'amount', unit: 'm', start: 1000, race: 1000, step: 100, times: RUN_TIMES,
    sub: 'Hard 4–5 min effort — match a 1 km run.', subs: BIKE_SUBS },
  { id: 'lunge', kind: 'station', icon: '🦵', num: 7, name: 'Sandbag Lunges', img: 'Dumbbell_Lunges', video: 'goblet+reverse+lunge+form',
    scale: 'weight', unit: 'm', dist: 100, startW: 8, raceW: 20, stepW: 2, wUnit: 'kg goblet', compNote: 'race 20 kg sandbag', times: LUNGE_TIMES,
    sub: 'No sandbags → DB/KB goblet reverse lunges. Brace + control the ankle.',
    subs: ['DB/KB goblet reverse lunge', 'Walking lunge (bodyweight)', 'Split squats ×20 / leg'] },
  { id: 'bike8', kind: 'bike', icon: '🚴', name: 'Bike 8 · run sub', img: 'Bicycling_Stationary', video: 'assault+bike+intervals',
    scale: 'amount', unit: 'm', start: 1000, race: 1000, step: 100, times: RUN_TIMES,
    sub: 'Last one — empty the tank. Hard 4–5 min.', subs: BIKE_SUBS },
  { id: 'wb', kind: 'station', icon: '🏐', num: 8, name: 'Wall Balls', img: 'Medicine_Ball_Scoop_Throw', video: 'wall+ball+shot+form',
    scale: 'amount', unit: 'reps', start: 40, race: 100, step: 10, times: WB_TIMES,
    sub: 'Can’t use the wall → med-ball throw-ups / DB thrusters. Full squat, full extension.',
    subs: ['Med-ball throw-ups', 'DB thrusters', 'Wall balls (if wall free)'] },
];

// Swap-option images (parallel to `subs`) — picking an option swaps the picture.
const BIKE_SUBIMG = ['Bicycling_Stationary', 'Rowing_Stationary', 'Running_Treadmill'];
const SUBIMG = {
  run1: ['Running_Treadmill', 'Running_Treadmill', 'Bicycling_Stationary'],
  run2: ['Running_Treadmill', 'Running_Treadmill', 'Bicycling_Stationary'],
  ski: ['Straight-Arm_Pulldown', 'Rowing_Stationary', 'Straight-Arm_Pulldown'],
  row: ['Rowing_Stationary', 'Straight-Arm_Pulldown', 'Bicycling_Stationary'],
  bike3: BIKE_SUBIMG, bike4: BIKE_SUBIMG, bike5: BIKE_SUBIMG, bike6: BIKE_SUBIMG, bike7: BIKE_SUBIMG, bike8: BIKE_SUBIMG,
  push: ['Farmers_Walk', 'Leg_Press', 'Sled_Push'],
  pull: ['Seated_Cable_Rows', 'Bent_Over_Two-Dumbbell_Row', 'Inverted_Row'],
  bbj: ['Standing_Long_Jump', 'Standing_Long_Jump', 'Standing_Long_Jump'],
  carry: ['Farmers_Walk', 'Farmers_Walk', 'Trap_Bar_Deadlift'],
  lunge: ['Dumbbell_Rear_Lunge', 'Bodyweight_Walking_Lunge', 'Split_Squat_with_Dumbbells'],
  wb: ['Medicine_Ball_Scoop_Throw', 'Kettlebell_Thruster', 'Medicine_Ball_Scoop_Throw'],
};

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
const SWAPS_KEY    = 'rtc_hyrox_swaps_v1';
const PB_KEY       = 'rtc_hyrox_pb_v1';
const SEGPB_KEY    = 'rtc_hyrox_segpb_v2';
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

let sim = loadJSON(SIM_KEY, null);
if (!sim || sim.date !== todayStr()) {
  sim = { date: todayStr(), running: false, accumMs: 0, lastStart: null, splits: {} };
  saveJSON(SIM_KEY, sim);
}
const log      = loadJSON(LOG_KEY, {});
const swaps    = loadJSON(SWAPS_KEY, {});
let pb         = loadJSON(PB_KEY, null);
const segPb    = loadJSON(SEGPB_KEY, {});     // { segId: { amountKey: ms } }
const xpState  = loadJSON(XP_KEY, { xp: 0, prs: 0, log: [] });
const tiers    = loadJSON(TIER_KEY, {});
const timeTier = loadJSON(TIMETIER_KEY, {});
SEGMENTS.forEach((s) => {
  if (tiers[s.id] == null) tiers[s.id] = s.scale === 'weight' ? s.startW : s.start;
  if (timeTier[s.id] == null) timeTier[s.id] = 'amateur';
});
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
function prevCum(segId) {
  const idx = SEGMENTS.findIndex((s) => s.id === segId);
  for (let i = idx - 1; i >= 0; i--) { const v = sim.splits[SEGMENTS[i].id]; if (v != null) return v; }
  return 0;
}
function segTime(segId) { const c = sim.splits[segId]; return c == null ? null : c - prevCum(segId); }
function doneCount() { return Object.keys(sim.splits).length; }
function allSplit() { return doneCount() >= SEGMENTS.length; }
function finishMs() { return allSplit() ? Math.max(...SEGMENTS.map((s) => sim.splits[s.id] || 0)) : null; }
function currentSegMs() {
  const cums = Object.values(sim.splits);
  return Math.max(0, elapsedMs() - (cums.length ? Math.max(...cums) : 0));
}

// ============================================================
// Two dials: distance/weight tier + time tier
// ============================================================
function curTarget(seg) { return tiers[seg.id]; }
function targetAmount(seg) { return seg.scale === 'weight' ? seg.dist : curTarget(seg); }
function curTimeTier(seg) { return timeTier[seg.id] || 'amateur'; }
// time to hit a tier at the CURRENT distance (weight stations: fixed distance → no scale)
function tierTime(seg, tierKey) {
  const base = seg.times[tierKey];
  return seg.scale === 'weight' ? base : Math.round(base * curTarget(seg) / seg.race);
}
function targetTime(seg) { return tierTime(seg, curTimeTier(seg)); }
function distPct(seg) { return seg.scale === 'weight' ? curTarget(seg) / seg.raceW : curTarget(seg) / seg.race; }
function distTierLabel(seg) {
  const p = distPct(seg);
  if (p >= 1) return 'Competition';
  if (p >= 0.8) return 'Pro';
  if (p >= 0.6) return 'Intermediate';
  if (p >= 0.4) return 'Amateur';
  return 'Beginner';
}
function atMax(seg) { return seg.scale === 'weight' ? curTarget(seg) >= seg.raceW : curTarget(seg) >= seg.race; }
function atMin(seg) { return curTarget(seg) <= (seg.scale === 'weight' ? 4 : seg.step); }
function stepTarget(segId, dir) {
  const seg = SEGMENTS.find((s) => s.id === segId);
  if (!seg) return;
  if (seg.scale === 'weight') tiers[segId] = Math.max(4, Math.min(seg.raceW, curTarget(seg) + dir * seg.stepW));
  else tiers[segId] = Math.max(seg.step, Math.min(seg.race, curTarget(seg) + dir * seg.step));
  saveJSON(TIER_KEY, tiers);
  render();
}
function selectTimeTier(segId, key) { timeTier[segId] = key; saveJSON(TIMETIER_KEY, timeTier); render(); }

// Global preset — set every station's distance/weight + time tier in one tap, so
// you can start easy and customize individual stations as you level up.
const PRESET_FRAC = { beginner: 0.4, amateur: 0.6, intermediate: 0.8, competition: 1.0 };
function snapVal(v, step, min, max) { return Math.max(min, Math.min(max, Math.round(v / step) * step)); }
function applyPreset(level) {
  const frac = PRESET_FRAC[level];
  if (frac == null) return;
  SEGMENTS.forEach((seg) => {
    timeTier[seg.id] = level;
    if (seg.scale === 'weight') tiers[seg.id] = snapVal(seg.raceW * frac, seg.stepW, 4, seg.raceW);
    else tiers[seg.id] = snapVal(seg.race * frac, seg.step, seg.step, seg.race);
  });
  saveJSON(TIER_KEY, tiers); saveJSON(TIMETIER_KEY, timeTier);
  render();
  toast(`All stations → ${level[0].toUpperCase() + level.slice(1)}`);
}

// best time is tracked per distance/weight so 500 m and 1 km compare fairly
function amountKey(seg) { return String(curTarget(seg)); }
function bestFor(seg) { const m = segPb[seg.id]; return m ? m[amountKey(seg)] : undefined; }

function isFullClear(seg) {
  if (sim.splits[seg.id] == null) return false;
  const e = log[seg.id] || {};
  if (seg.scale === 'weight') { const w = parseFloat(e.w); return !isNaN(w) && w >= curTarget(seg); }
  const metric = seg.unit === 'reps' ? parseFloat(e.r) : parseFloat(e.d);
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
  const id = (SUBIMG[seg.id] && SUBIMG[seg.id][chosen || 0]) || seg.img;
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
  const rows = SEGMENTS.map((s) => {
    const b = bestFor(s), tt = targetTime(s), delta = b != null ? b - tt : null;
    const amt = s.scale === 'weight' ? `${curTarget(s)} ${s.wUnit}` : `${curTarget(s)} ${s.unit}`;
    return `<tr>
      <td>${esc(s.name)}<span class="rec-tier">${esc(amt)}</span></td>
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
  const label = distTierLabel(seg);
  let now, comp;
  if (seg.scale === 'weight') { now = `${seg.dist} m · ${curTarget(seg)} ${seg.wUnit}`; comp = seg.compNote; }
  else { now = `${curTarget(seg)} ${seg.unit}`; comp = `comp ${seg.race} ${seg.unit}`; }
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

function segCard(seg) {
  const cum = sim.splits[seg.id];
  const done = cum != null;
  const st = segTime(seg.id);
  const chosen = swaps[seg.id] || 0;
  const working = seg.subs[chosen] || seg.subs[0];
  const swapped = chosen > 0;
  // A swap fully transforms the card: name, demo video, and notes all follow
  // the chosen alternative — the station only remains as a small "replaces" tag.
  const displayName = swapped ? working : seg.name;
  const workLine = swapped ? `↩ replaces ${seg.name} — same target & aim` : `▶ ${working}`;
  const subText = swapped ? 'Substitute movement — match the station’s distance/reps and chase the same time.' : seg.sub;
  const videoQ = swapped ? encodeURIComponent(working + ' exercise technique') : seg.video;
  const e = log[seg.id] || {};
  const best = bestFor(seg);
  const tt = targetTime(seg);
  const full = isFullClear(seg);
  const video = `<a class="race-seg-demo" href="https://www.youtube.com/results?search_query=${videoQ}" target="_blank" rel="noopener" title="Demo">📹</a>`;

  let result = '';
  if (done) {
    const delta = st - tt, sign = delta <= 0 ? '−' : '+', cls = delta <= 0 ? 'good' : 'over';
    result = `
      <div class="race-seg-splits">
        <span class="race-split-seg">${fmtClock(st)}</span>
        <span class="race-split-meta">
          ${full ? `<span class="race-cmp ${cls}">${sign}${fmtClock(Math.abs(delta))} vs aim</span>`
                 : `<span class="race-cmp partial">partial — logged less than the target</span>`}
          <span class="race-cmp-t">${full ? 'record set on Save' : `full target = ${seg.scale === 'weight' ? curTarget(seg) + ' ' + seg.wUnit : targetAmount(seg) + ' ' + seg.unit}`}</span>
        </span>
      </div>`;
  }

  const dPlace = seg.scale === 'weight' ? String(seg.dist) : (seg.unit === 'm' ? String(curTarget(seg)) : 'm');
  const wPlace = seg.scale === 'weight' ? String(curTarget(seg)) : 'kg';
  const rPlace = seg.scale === 'amount' && seg.unit === 'reps' ? String(curTarget(seg)) : '#';

  return `
    <div class="race-seg race-seg-${seg.kind} ${done ? 'done' : ''}" data-seg="${seg.id}">
      <div class="race-seg-top">
        ${imgSlotHTML(seg, chosen)}
        <div class="race-seg-body">
          <div class="race-seg-name">${esc(displayName)}${swapped ? ' <span class="race-swapped-tag">swapped</span>' : ''}</div>
          ${distLineHTML(seg)}
          <div class="race-seg-working">${esc(workLine)}</div>
          <div class="race-seg-sub">${esc(subText)}</div>
        </div>
        <div class="race-seg-tools">
          ${video}
          <button type="button" class="race-rest-btn" data-seg="${seg.id}" title="Rest timer">⏱</button>
          <button type="button" class="race-swap-btn" data-seg="${seg.id}" title="Swap exercise">▾</button>
        </div>
      </div>

      <div class="race-swap-panel" data-seg="${seg.id}">
        <div class="race-swap-head">Swap exercise</div>
        ${seg.subs.map((opt, i) => `
          <button type="button" class="race-swap-opt ${i === chosen ? 'active' : ''}" data-seg="${seg.id}" data-opt="${i}">${esc(opt)}</button>`).join('')}
      </div>

      ${timeTierHTML(seg)}
      ${best != null ? `<div class="race-seg-best">your best at ${esc(seg.scale === 'weight' ? curTarget(seg) + ' ' + seg.wUnit : curTarget(seg) + ' ' + seg.unit)}: <b>${fmtClock(best)}</b></div>` : ''}
      ${result}

      <div class="race-seg-inputs">
        <label>Dist<input type="text" inputmode="decimal" data-seg="${seg.id}" data-f="d" value="${esc(e.d || '')}" placeholder="${esc(dPlace)}" /></label>
        <label>Wt<input type="text" inputmode="decimal" data-seg="${seg.id}" data-f="w" value="${esc(e.w || '')}" placeholder="${esc(wPlace)}" /></label>
        <label>Reps<input type="text" inputmode="numeric" data-seg="${seg.id}" data-f="r" value="${esc(e.r || '')}" placeholder="${esc(rPlace)}" /></label>
        <button type="button" class="race-split-btn ${done ? 'logged' : ''}" data-seg="${seg.id}">${done ? '✓ Split' : 'Split'}</button>
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
      both change freely. Tap <b>Split</b> when done (it logs the target; edit down if you did less). <b>XP banks only on
      “Save & Log XP.”</b> Beginner tip: rest 60–90 s between stations (⏱).
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
  const clk = document.getElementById('race-clock'); if (clk) clk.textContent = fmtClock(elapsedMs());
  const live = document.getElementById('race-seg-live');
  if (live) live.textContent = (sim.running || elapsedMs() > 0) && !allSplit() ? `seg ${fmtClock(currentSegMs())}` : '';
  const go = document.getElementById('race-go');
  if (go) { go.textContent = elapsedMs() > 0 ? '▶ Resume' : '▶ Start'; go.disabled = sim.running; }
  const pause = document.getElementById('race-pause'); if (pause) pause.disabled = !sim.running;
  const pt = document.getElementById('race-progress-text'); if (pt) pt.textContent = `${doneCount()} / ${SEGMENTS.length}`;
  const ring = document.getElementById('race-ring-fg');
  if (ring) ring.style.strokeDashoffset = String(RING_CIRC * (1 - doneCount() / SEGMENTS.length));
  const fin = document.getElementById('race-finish-banner');
  if (fin) {
    const total = finishMs();
    if (total != null) { fin.classList.add('show'); fin.innerHTML = `🏁 All splits in — <b>${fmtClock(total)}</b> · tap “Save &amp; Log XP”`; }
    else fin.classList.remove('show');
  }
}

// ============================================================
// Timer control (+ Wake Lock)
// ============================================================
let tickId = null, wakeLock = null;
async function requestWake() {
  if (!('wakeLock' in navigator)) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } catch {}
}
function releaseWake() { if (wakeLock) { try { wakeLock.release(); } catch {} wakeLock = null; } }
function startTick() { if (!tickId) tickId = setInterval(renderTimer, 250); }
function stopTick() { if (tickId) { clearInterval(tickId); tickId = null; } }

function startTimer() {
  if (sim.running) return;
  sim.running = true; sim.lastStart = Date.now(); startTick(); requestWake();
  persistSim(); renderTimer();
}
function pauseTimer() {
  if (!sim.running) return;
  sim.accumMs += Date.now() - sim.lastStart; sim.running = false; sim.lastStart = null; stopTick(); releaseWake();
  persistSim(); renderTimer();
}
function resetRace() {
  if (!confirm('Reset the timer and all splits for a fresh race? (Your targets, records + XP stay.)')) return;
  sim = { date: todayStr(), running: false, accumMs: 0, lastStart: null, splits: {} };
  stopTick(); releaseWake(); persistSim(); render();
}
function logSplit(segId) {
  if (sim.splits[segId] != null) delete sim.splits[segId];
  else {
    if (!sim.running && sim.accumMs === 0) { sim.running = true; sim.lastStart = Date.now(); startTick(); requestWake(); }
    sim.splits[segId] = elapsedMs();
    const seg = SEGMENTS.find((s) => s.id === segId);
    if (seg) {
      const e = (log[segId] || (log[segId] = {}));
      if (seg.scale === 'weight') { if (!e.w) e.w = String(curTarget(seg)); if (!e.d) e.d = String(seg.dist); }
      else if (seg.unit === 'reps') { if (!e.r) e.r = String(targetAmount(seg)); }
      else { if (!e.d) e.d = String(targetAmount(seg)); }
      saveJSON(LOG_KEY, log);
    }
  }
  persistSim(); render();
}

// ============================================================
// Save & Log XP — the ONLY place records + XP commit.
// ============================================================
function saveToTracker() {
  let gained = 0;
  const events = [];
  SEGMENTS.forEach((seg) => {
    if (!isFullClear(seg)) return;
    const st = segTime(seg.id);
    if (st == null) return;
    const key = amountKey(seg);
    const bucket = segPb[seg.id] || (segPb[seg.id] = {});
    if (bucket[key] == null || st < bucket[key]) {
      const first = bucket[key] == null;
      bucket[key] = st;
      const pts = first ? 25 : 40;
      gained += pts; events.push({ label: `${seg.name} ${first ? 'logged' : 'PB!'}`, pts });
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
  const logged = SEGMENTS.filter((s) => sim.splits[s.id] != null || log[s.id]);
  if (!logged.length) { toast('Nothing logged yet — hit some splits first.'); return; }

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
    const ch = swaps[s.id] || 0;
    const name = ch > 0 ? `${s.subs[ch]} (for ${s.name})` : s.name;
    return { exId: 'hx_' + s.id, name, target: `${targetAmount(s)} ${s.unit}`,
      done: sim.splits[s.id] != null, sets: [{ w: e.w || '', r: st != null ? fmtClock(st) : (e.r || '') }] };
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
  if (total != null) lines.push(`Finish: ${fmtClock(total)}`);
  SEGMENTS.forEach((s) => {
    const st = segTime(s.id), e = log[s.id] || {};
    const bits = [e.d && `${e.d}m`, e.w && `${e.w}kg`, e.r && `${e.r} reps`].filter(Boolean).join(' · ');
    lines.push(`${s.name} — ${curTimeTier(s)} aim${bits ? ` · ${bits}` : ''} · ${st != null ? fmtClock(st) : '—'} (aim ${fmtClock(targetTime(s))})`);
  });
  const text = lines.join('\n');
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('✓ Copied'), () => fallbackCopy(text));
  else fallbackCopy(text);
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('✓ Copied'); } catch { toast('Copy failed'); } ta.remove();
}
function toast(msg) { const t = document.createElement('div'); t.className = 't-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }

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
  const split = e.target.closest('.race-split-btn');
  if (split) { logSplit(split.dataset.seg); return; }
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
  const seg = SEGMENTS.find((s) => s.id === id);
  const card = inp.closest('.race-seg');
  if (seg && card && sim.splits[id] != null) {
    const st = segTime(id), tt = targetTime(seg), full = isFullClear(seg);
    const meta = card.querySelector('.race-split-meta');
    if (meta) {
      const delta = st - tt, sign = delta <= 0 ? '−' : '+', cls = delta <= 0 ? 'good' : 'over';
      meta.innerHTML = `${full ? `<span class="race-cmp ${cls}">${sign}${fmtClock(Math.abs(delta))} vs aim</span>`
        : `<span class="race-cmp partial">partial — logged less than the target</span>`}
        <span class="race-cmp-t">${full ? 'record set on Save' : `full target = ${seg.scale === 'weight' ? curTarget(seg) + ' ' + seg.wUnit : targetAmount(seg) + ' ' + seg.unit}`}</span>`;
    }
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) return; if (sim.running && !wakeLock) requestWake(); renderTimer(); });

// ============================================================
// Init
// ============================================================
render();
if (sim.running) { startTick(); requestWake(); }
loadImageDB().then(() => { if (imgDb) render(); });
