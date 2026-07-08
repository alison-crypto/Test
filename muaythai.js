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

// Combos as step lists. s: 'L' lead/left · 'R' rear/right (orthodox — mirror if
// southpaw) · 'D' defense/dodge · '•' note. m: move, t: tip.
const COMBOS = {
  l1: [
    { name: '1 – 2', vid: 'CuqdEnm9hxE', steps: [
      { s: 'L', m: 'Jab', t: 'snap out, straight back to the chin' },
      { s: 'R', m: 'Cross', t: 'pivot the rear foot, hip through' },
      { s: '•', m: 'Reset', t: 'guard tall before the next rep' } ] },
    { name: '1 – 1 – 2', vid: 'CuqdEnm9hxE', steps: [
      { s: 'L', m: 'Jab', t: 'range-finder' },
      { s: 'L', m: 'Jab', t: 'step in behind it' },
      { s: 'R', m: 'Cross', t: 'full rotation, chin behind the shoulder' } ] },
    { name: '1 – 2 + Lead Teep', vid: 'f8WYkvROi0I', steps: [
      { s: 'L', m: 'Jab', t: 'set the distance' },
      { s: 'R', m: 'Cross', t: 'full hip' },
      { s: 'L', m: 'Teep', t: 'knee up FIRST, push through the hip, re-chamber' } ] },
    { name: '1 – 2 + Body Kick', vid: 'wwc4cnvkwnk', steps: [
      { s: 'L', m: 'Jab', t: 'blinds the kick' },
      { s: 'R', m: 'Cross', t: 'turns the hips halfway' },
      { s: 'R', m: 'Middle Kick', t: 'step out 45°, pivot, SHIN through the pad' } ] },
  ],
  l2: [
    { name: '1 – 2 – 3', vid: '7OrcBffPmE0', steps: [
      { s: 'L', m: 'Jab', t: 'snap' },
      { s: 'R', m: 'Cross', t: 'drive off the rear foot' },
      { s: 'L', m: 'Hook', t: 'pivot the lead foot, elbow stays ~90°' } ] },
    { name: '1 – 2 + Switch Kick', vid: 'MAI-Pqn4kis', steps: [
      { s: 'L', m: 'Jab', t: 'stay tall' },
      { s: 'R', m: 'Cross', t: 'full hip' },
      { s: '•', m: 'Switch', t: 'small scissor-hop — feet swap' },
      { s: 'L', m: 'Middle Kick', t: 'fire instantly, no pause after the switch' } ] },
    { name: 'Slip → 2 – 3 + Low Kick', vid: 'Qz29_dtpHdw', steps: [
      { s: 'D', m: 'Slip', t: 'holder feeds a jab — slip outside, eyes on target' },
      { s: 'R', m: 'Cross', t: 'counter straight down the middle' },
      { s: 'L', m: 'Hook', t: 'wheel it around their guard' },
      { s: 'R', m: 'Low Kick', t: 'chop the thigh pad, slight downward angle' } ] },
    { name: '1 – 2 – 5 – 2', vid: 'L2P3pNYOr3E', steps: [
      { s: 'L', m: 'Jab', t: 'range' },
      { s: 'R', m: 'Cross', t: 'hips through' },
      { s: 'L', m: 'Uppercut', t: 'dip the knees, drive UP the middle' },
      { s: 'R', m: 'Cross', t: 'finish clean, back to guard' } ] },
  ],
  l3: [
    { name: '1 – 2 – 3 + Rear Knee', vid: 'Q0igBbuN9f0', steps: [
      { s: 'L', m: 'Jab', t: 'enter' },
      { s: 'R', m: 'Cross', t: 'commit the hips' },
      { s: 'L', m: 'Hook', t: 'pivot' },
      { s: 'R', m: 'Straight Knee', t: 'grab the pad, hips SPEAR through (khao trong)' } ] },
    { name: '1 – 2 + Elbow', vid: 'mnjzRshvSpk', steps: [
      { s: 'L', m: 'Jab', t: 'close the gap' },
      { s: 'R', m: 'Cross', t: 'step IN — elbows are short range' },
      { s: 'R', m: 'Horizontal Elbow', t: 'sok tat slashes across, palm down' } ] },
    { name: 'Teep + 2 – 3 + Low Kick', vid: 'f8WYkvROi0I', steps: [
      { s: 'L', m: 'Teep', t: 'make the space' },
      { s: 'R', m: 'Cross', t: 'close it again' },
      { s: 'L', m: 'Hook', t: 'keep them turning' },
      { s: 'R', m: 'Low Kick', t: 'finish downstairs' } ] },
    { name: 'Check → 2 + Body Kick', vid: '2tiH-1bMP44', steps: [
      { s: 'D', m: 'Check', t: 'holder feeds a light kick — knee up & out, stay UPRIGHT' },
      { s: 'R', m: 'Cross', t: 'counter immediately off the check' },
      { s: 'R', m: 'Middle Kick', t: 'same-side kick while they reset' } ] },
    { name: '1 – 2 – 3 – 2 + Body Kick', vid: 'L2P3pNYOr3E', steps: [
      { s: 'L', m: 'Jab', t: 'breathe through the flow' },
      { s: 'R', m: 'Cross', t: 'full rotation' },
      { s: 'L', m: 'Hook', t: 'pivot' },
      { s: 'R', m: 'Cross', t: 'again — no arm punching' },
      { s: 'R', m: 'Middle Kick', t: 'lands as they cover up' } ] },
  ],
  l4: [
    { name: '1 – 2 + Body Kick ×2', vid: 'wwc4cnvkwnk', steps: [
      { s: 'L', m: 'Jab', t: 'enter' },
      { s: 'R', m: 'Cross', t: 'turn them' },
      { s: 'R', m: 'Middle Kick', t: 'first one light and fast' },
      { s: 'R', m: 'Middle Kick', t: 're-pivot, second one FULL power' } ] },
    { name: 'Catch → Sweep → 2', vid: '2tiH-1bMP44', steps: [
      { s: 'D', m: 'Catch', t: 'scoop the fed body kick under your arm' },
      { s: 'D', m: 'Sweep', t: 'kick out the standing leg — CONTROL your partner' },
      { s: 'R', m: 'Cross', t: 'land it as they recover balance' } ] },
    { name: '1 – 6 – 3 + Low Kick', vid: 'WMhyO-vcjQI', steps: [
      { s: 'L', m: 'Jab', t: 'blind them' },
      { s: 'R', m: 'Uppercut', t: 'splits the middle (6)' },
      { s: 'L', m: 'Hook', t: 'wheels around' },
      { s: 'R', m: 'Low Kick', t: 'chop the leg on your exit' } ] },
    { name: 'Clinch → 3 Knees → Push + Kick', vid: 'Q0igBbuN9f0', steps: [
      { s: '•', m: 'Clinch Entry', t: 'collar tie, posture TALL, chin tucked' },
      { s: 'R', m: 'Knee', t: 'pull the pad DOWN into it' },
      { s: 'L', m: 'Knee', t: 'alternate, hips deliver' },
      { s: 'R', m: 'Knee', t: 'third one hardest' },
      { s: 'R', m: 'Middle Kick', t: 'shove off, kick as they exit' } ] },
    { name: '2 – 3 + Spinning Backfist', vid: 'JYt_fCaVUtU', steps: [
      { s: 'R', m: 'Cross', t: 'squares them up' },
      { s: 'L', m: 'Hook', t: 'turns you halfway — keep spinning' },
      { s: 'R', m: 'Spinning Backfist', t: 'LOOK over the shoulder first, then whip it' } ] },
  ],
  l5: [
    { name: '1 – 2 + Question-Mark Kick', vid: 'ZLiGKESGnZo', steps: [
      { s: 'L', m: 'Jab', t: 'set up' },
      { s: 'R', m: 'Cross', t: 'make them cover' },
      { s: 'R', m: 'Q-Mark Kick', t: 'chamber like a teep — SELL it — whip over the guard' } ] },
    { name: '3 – 2 + Spinning Elbow', vid: 'uMyIsRH1hoo', steps: [
      { s: 'L', m: 'Hook', t: 'squares them' },
      { s: 'R', m: 'Cross', t: 'starts your rotation' },
      { s: 'R', m: 'Spinning Elbow', t: 'step across, look, sok klap through the pad' } ] },
    { name: 'Teep-Fake → Superman + Low Kick', vid: 'FKNWcW7cEz0', steps: [
      { s: 'R', m: 'Teep Fake', t: 'lift the knee — sell it' },
      { s: 'R', m: 'Superman Punch', t: 'kick the leg BACK as the cross launches' },
      { s: 'R', m: 'Low Kick', t: 'land forward into stance, chop the exit' } ] },
    { name: '1 – 2 + Flying Knee', vid: 'WMhyO-vcjQI', steps: [
      { s: 'L', m: 'Jab', t: 'measure' },
      { s: 'R', m: 'Cross', t: 'drop their eyes' },
      { s: 'R', m: 'Flying Knee', t: 'step-hop off the rear leg, frame with the arms (khao loi)' } ] },
    { name: 'Free Flow — All 8 Limbs', vid: 'Qz29_dtpHdw', steps: [
      { s: '•', m: 'Holder calls', t: 'anything from L1–L5' },
      { s: '•', m: 'React & flow', t: 'breathe, stay in stance' },
      { s: '•', m: 'Quality', t: 'over speed — always' } ] },
  ],
};

// Variable core — rotates daily.
const CORES = [
  { name: 'Plank Hold', reps: 'max hold', img: 'Plank', bullets: ['Straight line, glutes tight', 'Don’t let the hips sag'] },
  { name: 'Hollow-Body Hold', reps: 'max hold', img: 'Dead_Bug', bullets: ['Low back pressed to the floor', 'Arms and legs long'] },
  { name: 'Russian Twists', reps: '×40 total', img: 'Russian_Twist', bullets: ['Feet up, shoulder-to-shoulder', 'Controlled — no bouncing'] },
  { name: 'Leg Raises', reps: '×20', img: 'Flat_Bench_Lying_Leg_Raise', bullets: ['Slow up, slower down', 'Low back stays glued down'] },
  { name: 'Side Plank', reps: 'switch halfway', img: 'Side_Bridge', bullets: ['Hips tall', 'Top arm to the ceiling'] },
  { name: 'Sit-Up Ladder', reps: 'max reps', img: '3_4_Sit-Up', bullets: ['Count them — beat it next week', 'Full range, no neck pulling'] },
  { name: 'Dead Bug', reps: '×20 total', img: 'Dead_Bug', bullets: ['Opposite arm/leg reach', 'Exhale hard every rep'] },
];

const S = 1000, M = 60000;

// Faded photo backdrops: free-exercise-db stills (verified) + YouTube technique-
// video thumbnails (real internet exercise images; onerror falls back to emoji).
const dbImg = (id) => `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${id}/0.jpg`;
const ytImg = (id) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
const PUNCH_THUMBS = ['CuqdEnm9hxE', '7OrcBffPmE0', 'L2P3pNYOr3E', 'Qz29_dtpHdw'];
const KICK_THUMBS  = ['wwc4cnvkwnk', '2tiH-1bMP44'];

// Build the class. Each card: {group, name, reps, bullets|steps, dur, bg, sw?, water?, waterAfter?}
function buildSegments(lvlKey) {
  const hard = lvlKey === 'l4' || lvlKey === 'l5';
  const cards = [];

  // Warm-up — mobility first (no rest), then rope (water after), then shadowbox.
  cards.push({ group: 'Warm-up', name: 'Dynamic Mobility', reps: 'flow, no rest', dur: 3 * M, bg: '🤸', bgImg: dbImg('Standing_Hip_Circles'),
    bullets: ['Leg swings · hip circles · ankle rolls', 'Arm circles · neck easy', 'Walking lunge + twist'] });
  cards.push({ group: 'Warm-up', name: 'Skip Rope', reps: 'steady rhythm', dur: 3 * M, bg: '➰', bgImg: dbImg('Rope_Jumping'), waterAfter: true,
    bullets: ['Balls of the feet', 'Wrists spin the rope', 'Mix in the Thai two-foot bounce'] });
  cards.push({ group: 'Warm-up', name: 'Shadowbox', reps: 'light combos', dur: 2 * M, bg: '👤', vid: 'J4j3AOVWuHE', bgImg: ytImg('J4j3AOVWuHE'),
    bullets: ['Move the WHOLE round', 'Stance · rhythm march · checks', 'Light combos from your level'] });

  // Conditioning — 4 different exercises, rep targets, straight through. Water after the last.
  const cond = hard
    ? [['Burpees', '×12', '🤸', ytImg('qLBImHhCXSw'), 'qLBImHhCXSw'], ['Jump Squats', '×15', '🦵', dbImg('Freehand_Jump_Squat')], ['Push-Ups', '×15', '🫸', dbImg('Pushups')], ['Mountain Climbers', '×30 total', '⛰️', dbImg('Mountain_Climbers')]]
    : [['Squats', '×20', '🦵', dbImg('Bodyweight_Squat')], ['Push-Ups', '×12', '🫸', dbImg('Pushups')], ['Jumping Jacks', '×30', '⭐', ytImg('uLVt6u15L98'), 'uLVt6u15L98'], ['Mountain Climbers', '×20 total', '⛰️', dbImg('Mountain_Climbers')]];
  cond.forEach(([n, r, bg, bgImg, vid], i) => cards.push({ group: 'Conditioning', name: n, reps: r + ' · no rest', dur: 60 * S, bg, bgImg, vid,
    waterAfter: i === cond.length - 1,
    bullets: n === 'Push-Ups' ? ['Rigid plank, elbows ~45°', 'Chest to fist height'] :
             n === 'Burpees' ? ['Chest to floor', 'Jump with feet together'] :
             ['Hard pace, clean reps', 'Straight into the next one'] }));

  // Partner combos — 2:00 striker A → 🧤 30 s glove/pad swap → 2:00 striker B.
  // Kick-flavoured combos get kick-video backdrops, punch combos get boxing ones.
  COMBOS[lvlKey].forEach((c, i) => {
    const kicky = /Kick|Knee|Teep/i.test(c.name);
    const vid = c.vid || (kicky ? KICK_THUMBS[i % KICK_THUMBS.length] : PUNCH_THUMBS[i % PUNCH_THUMBS.length]);
    cards.push({ group: 'Combos', name: `Combo ${i + 1}: ${c.name}`, reps: '×20 each · 🧤 30 s swap at 2:00',
      dur: 4 * M + 30 * S, sw: true, bg: '🥊', steps: c.steps, waterAfter: i === 1 || i === 3,
      vid, bgImg: ytImg(vid) });
  });

  // Power strikes — 50 each, full strength. Water after the punches.
  cards.push({ group: 'Power', name: 'Power Kicks — LEFT', reps: '×50 full strength', dur: 150 * S, bg: '🦵', vid: '2tiH-1bMP44', bgImg: ytImg('2tiH-1bMP44'),
    bullets: ['Full pivot EVERY kick', 'Sets of 5–10, partner counts', 'Shin through the pad'] });
  cards.push({ group: 'Power', name: 'Power Kicks — RIGHT', reps: '×50 full strength', dur: 150 * S, bg: '🦵', vid: 'wwc4cnvkwnk', bgImg: ytImg('wwc4cnvkwnk'),
    bullets: ['Same standard — no arm-only swings', 'Breathe out sharp on impact', 'Last 10 = hardest 10'] });
  cards.push({ group: 'Power', name: 'Power Punches', reps: '×50 per side, full strength', dur: 90 * S, bg: '🥊', vid: '7OrcBffPmE0', bgImg: ytImg('7OrcBffPmE0'), waterAfter: true,
    bullets: ['Straight 1-2s, full rotation', 'Sprint the last 20 seconds', 'Hands back to guard every rep'] });

  // Core — variable, rotates daily.
  const core = CORES[Math.floor(Date.now() / 86400000) % CORES.length];
  for (let r = 1; r <= 2; r++) {
    cards.push({ group: 'Core', name: `${core.name} — round ${r}/2`, reps: core.reps, dur: 60 * S, bg: '🧱', bgImg: core.img ? dbImg(core.img) : null, bullets: core.bullets });
  }

  // 💧 water breaks exactly where marked (rope → conditioning end → combo 2 → combo 4 → power punches).
  const out = [];
  cards.forEach((c, i) => {
    out.push(c);
    if (c.waterAfter && i < cards.length - 1) {
      out.push({
        group: 'Break', name: 'Water Break', reps: 'sip · shake out · gloves', dur: 45 * S, water: true, bg: '💧',
        bullets: ['Breathe through the nose', `Next: ${cards[i + 1].name}`],
      });
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
  return { lvl, n: SEGS.length, i: 0, running: false, remainMs: SEGS[0].dur, endAt: null, totalMs: 0, totalAnchor: null, swFired: false, sw2Fired: false, done: false };
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
// Voice coach — reads each exercise + instructions (toggleable 🔊/🔇)
// ============================================================
const VOICE_KEY = 'rtc_mt_voice_v1';
let voiceOn = loadJSON(VOICE_KEY, true);
const SIDE_WORD = { L: 'Left', R: 'Right', D: 'Defense', '•': '' };
function speak(text) {
  if (!voiceOn || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02; u.pitch = 1; u.lang = 'en-US';
    // let the bell ring first
    setTimeout(() => { try { speechSynthesis.speak(u); } catch {} }, 650);
  } catch {}
}
function announce(seg) {
  if (!seg) return;
  if (seg.water) { speak(`Water break. ${seg.bullets && seg.bullets[1] ? seg.bullets[1] : ''}`); return; }
  let text = `${seg.name}. ${seg.reps || ''}. `;
  if (seg.steps) text += seg.steps.map((sp) => `${SIDE_WORD[sp.s] || ''} ${sp.m}: ${sp.t}`).join('. ');
  else if (seg.bullets) text += seg.bullets.join('. ');
  speak(text);
}
function toggleVoice() {
  voiceOn = !voiceOn;
  saveJSON(VOICE_KEY, voiceOn);
  if (!voiceOn) { try { speechSynthesis.cancel(); } catch {} }
  else speak('Voice coach on.');
  paint();
}

// Looping technique-video background (muted YouTube embed) with 🎬 toggle.
const VIDEO_KEY = 'rtc_mt_video_v1';
let videoOn = loadJSON(VIDEO_KEY, true);
function toggleVideo() { videoOn = !videoOn; saveJSON(VIDEO_KEY, videoOn); paint(); }
function videoHTML(seg) {
  if (!videoOn || !seg.vid || st.done) return '';
  return `
    <div class="mtv-video" aria-hidden="true">
      <iframe src="https://www.youtube-nocookie.com/embed/${esc(seg.vid)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${esc(seg.vid)}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1"
        frameborder="0" allow="autoplay; encrypted-media" tabindex="-1" title=""></iframe>
    </div>`;
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
  announce(SEGS[st.i]);
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
  st.swFired = false; st.sw2Fired = false; st.done = false;
  st.remainMs = SEGS[st.i].dur;
  if (st.running) st.endAt = Date.now() + st.remainMs;
  persist();
  if (ringBell) { bell(SEGS[st.i].water ? 'water' : 'work'); announce(SEGS[st.i]); }
  paint();
}
function advance() {
  if (st.i >= SEGS.length - 1) {
    st.done = true; st.running = false;
    st.totalMs += st.totalAnchor ? Date.now() - st.totalAnchor : 0;
    st.totalAnchor = null; st.endAt = null; st.remainMs = 0;
    persist(); stopTick(); releaseWake();
    bell('done');
    speak('Class complete. Great work! Stretch, water, and save it to the tracker.');
    document.body.classList.remove('mt-live');
    paint();
    return;
  }
  st.i += 1; st.swFired = false; st.sw2Fired = false;
  const seg = SEGS[st.i];
  st.endAt = (st.endAt || Date.now()) + seg.dur;
  st.remainMs = seg.dur;
  persist();
  bell(seg.water ? 'water' : 'work');
  announce(seg);
  paint();
}
function onTick() {
  if (!st.running) return;
  const rem = st.endAt - Date.now();
  const seg = SEGS[st.i];
  if (seg.sw) {
    const el = seg.dur - rem;
    // 2:00 striker A → 30 s glove/pad swap → 2:00 striker B
    if (!st.swFired && el >= 120 * S) { st.swFired = true; bell('switch'); speak('Switch! Drop the gloves, grab the pads. Thirty seconds.'); persist(); paint(); }
    if (!st.sw2Fired && el >= 150 * S) { st.sw2Fired = true; bell('work'); speak('Go! Second striker, twenty reps.'); persist(); paint(); }
  }
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
    let label = 'WORK';
    if (st.done) label = 'DONE';
    else if (seg.water) label = '💧 WATER';
    else if (seg.sw) {
      const el = seg.dur - rem;
      label = el < 120 * S ? '🥊 A STRIKES' : el < 150 * S ? '🧤 SWAP GEAR' : '🥊 B STRIKES';
    }
    ph.textContent = label;
    ph.className = 'mtv-phase ' + (seg.water || label === '🧤 SWAP GEAR' ? 'is-rest' : 'is-work');
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
        <div class="mtv-bg" aria-hidden="true">${st.done ? '🏆' : seg.bg || '🥋'}</div>
        ${!(videoOn && seg.vid) && seg.bgImg && !st.done ? `<img class="mtv-bgimg" src="${esc(seg.bgImg)}" alt="" loading="lazy" onerror="if(!this.dataset.f){this.dataset.f=1;this.src=this.src.replace('maxresdefault','hqdefault');}else{this.remove();}" />` : ''}
        ${videoHTML(seg)}
        <div class="mtv-group">${esc(seg.group)}${seg.water ? '' : ` · ${cardNo}/${nonWater.length}`}${st.done ? ' · CLASS COMPLETE 🏁' : ''}</div>
        <div class="mtv-name">${st.done ? 'Great work! 🙌' : esc(seg.name)}</div>
        <div class="mtv-reps">${st.done ? `total ${fmt(totalElapsed())}` : esc(seg.reps || '')}</div>
        ${seg.steps && !st.done ? `
          <div class="mtv-steps">
            ${seg.steps.map((sp) => `
              <div class="mtv-step">
                <span class="mtv-chip mtv-chip-${sp.s === 'L' ? 'l' : sp.s === 'R' ? 'r' : sp.s === 'D' ? 'd' : 'n'}">${sp.s}</span>
                <span class="mtv-step-move">${esc(sp.m)}</span>
                <span class="mtv-step-tip">${esc(sp.t)}</span>
              </div>`).join('')}
          </div>`
        : `<ul class="mtv-bullets">${(st.done ? ['Save it to the Tracker', 'Stretch + water', 'Same time next week?'] : (seg.bullets || [])).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`}
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
          <button type="button" id="mt-voice" aria-label="Voice on/off" class="${voiceOn ? '' : 'mt-voice-off'}">${voiceOn ? '🔊' : '🔇'}</button>
          <button type="button" id="mt-video" aria-label="Video background on/off" class="${videoOn ? '' : 'mt-voice-off'}">🎬</button>
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
  if (e.target.closest('#mt-voice'))  { toggleVoice(); return; }
  if (e.target.closest('#mt-video'))  { toggleVideo(); return; }
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
