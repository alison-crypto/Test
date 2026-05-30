// gym-extras.js — auto exercise images + rest timer with notifications.
//
// IMAGES:
//   Pulls the free-exercise-db (yuhonas/free-exercise-db, MIT) — ~800
//   exercises with illustration images hosted on raw.githubusercontent.com.
//   On first load we fetch its exercises.json and cache it in localStorage.
//   For each .exercise on the page we fuzzy-match against the DB by name,
//   primary muscles, and equipment, and show the matched image inline.
//   No taps, no setup. If the auto-pick isn't right, long-press the image
//   to open a chooser with the next-best matches.
//
// TIMER:
//   A ⏱ button is added to every exercise header. Tap → a floating panel
//   at the bottom of the screen opens with a countdown (default 90s,
//   ±15s controls, Start/Pause/Cancel). On zero: vibrate + WebAudio beep
//   + system Notification (if permission granted) + red flash on the panel.
//   Only one timer is active at a time.

// ============================================================
// Image database (fetched once, cached in localStorage)
// ============================================================
const DB_URL       = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const DB_CACHE_KEY = 'rtc_exercise_db_v1';
const DB_CACHE_TS  = 'rtc_exercise_db_fetched_at_v1';
const DB_TTL_MS    = 30 * 24 * 60 * 60 * 1000; // refresh after 30 days
const OVERRIDES_KEY = 'rtc_gym_image_overrides_v1';

const STOPWORDS = new Set([
  'the','a','an','with','and','or','of','on','for','in','to','your',
  'do','exercise','machine','form','proper','press','hold','one','two',
]);
function tokenize(s) {
  return (s || '').toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));
}

async function loadExerciseDB() {
  // Stale-while-revalidate: serve cached copy immediately, refetch in
  // background if expired.
  let cached = null;
  try {
    const raw = localStorage.getItem(DB_CACHE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {}
  const fetchedAt = Number(localStorage.getItem(DB_CACHE_TS)) || 0;
  const expired = Date.now() - fetchedAt > DB_TTL_MS;

  if (cached && !expired) return cached;

  try {
    const res = await fetch(DB_URL, { cache: 'force-cache' });
    if (!res.ok) throw new Error('db fetch failed: ' + res.status);
    const data = await res.json();
    try {
      localStorage.setItem(DB_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(DB_CACHE_TS, String(Date.now()));
    } catch {}
    return data;
  } catch (e) {
    console.warn('[gym-extras] db fetch failed', e?.message || e);
    return cached || [];
  }
}

// ============================================================
// Fuzzy matcher
// ============================================================
function scoreMatch(ourTokens, dbEx) {
  const dbTokens = tokenize(dbEx.name);
  if (!dbTokens.length) return -Infinity;
  let overlap = 0;
  for (const t of ourTokens) if (dbTokens.includes(t)) overlap++;
  // Reward overlap, penalize extra DB-only tokens slightly.
  const extras = dbTokens.length - overlap;
  let score = overlap * 2 - extras * 0.2;
  // Bonus if the DB has an image at all.
  if (dbEx.images && dbEx.images.length) score += 0.5;
  return score;
}
function rankMatches(name, db, limit = 6) {
  const ourTokens = tokenize(name);
  if (!ourTokens.length) return [];
  const scored = db
    .map((ex) => ({ ex, score: scoreMatch(ourTokens, ex) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((x) => x.ex);
}

function imageUrl(dbEx) {
  if (!dbEx || !dbEx.images || !dbEx.images.length) return null;
  return IMG_BASE_URL + dbEx.images[0];
}

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}'); }
  catch { return {}; }
}
function saveOverride(exId, dbId) {
  const o = loadOverrides();
  if (dbId === null) delete o[exId]; else o[exId] = dbId;
  try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o)); } catch {}
}

// ============================================================
// Per-exercise image slot
// ============================================================
async function mountImageSlot(ex, db) {
  const exId = ex.dataset.ex;
  const header = ex.querySelector('.ex-header');
  if (!header) return;

  const slot = document.createElement('button');
  slot.type = 'button';
  slot.className = 'ex-image-slot';
  slot.setAttribute('aria-label', 'Exercise image');
  header.insertBefore(slot, header.firstChild);

  const name = ex.querySelector('.ex-name')?.textContent || '';
  const overrides = loadOverrides();
  const matches = rankMatches(name, db);
  let chosen = null;
  if (overrides[exId]) chosen = db.find((d) => d.id === overrides[exId]) || null;
  if (!chosen) chosen = matches[0] || null;

  paintSlot(slot, chosen, name);

  slot.addEventListener('click', (e) => {
    e.stopPropagation();
    openImageChooser(exId, name, slot, db);
  });
}

function paintSlot(slot, dbEx, fallbackName) {
  const url = imageUrl(dbEx);
  if (url) {
    slot.innerHTML = `<img alt="${(dbEx.name || fallbackName || '').replace(/"/g, '&quot;')}" src="${url}" loading="lazy" />`;
    slot.classList.add('has-image');
    slot.classList.remove('no-image');
  } else {
    slot.innerHTML = '<span class="ex-image-placeholder">🏋️</span>';
    slot.classList.remove('has-image');
    slot.classList.add('no-image');
  }
}

// ============================================================
// Image chooser modal — shown when an image is tapped.
// Lets the user pick a different match from the top candidates.
// ============================================================
let chooserEl = null;
function openImageChooser(exId, name, slot, db) {
  if (chooserEl) chooserEl.remove();
  chooserEl = document.createElement('div');
  chooserEl.className = 'rtc-img-chooser-backdrop';
  const candidates = rankMatches(name, db, 9);
  const card = document.createElement('div');
  card.className = 'rtc-img-chooser';
  card.innerHTML = `
    <div class="rtc-img-chooser-head">
      <div class="rtc-img-chooser-title">${name}</div>
      <button type="button" class="rtc-img-chooser-close" aria-label="Close">×</button>
    </div>
    <div class="rtc-img-chooser-grid"></div>
    <div class="rtc-img-chooser-footer">
      <button type="button" class="rtc-img-chooser-clear">Clear image</button>
    </div>
  `;
  const grid = card.querySelector('.rtc-img-chooser-grid');
  if (!candidates.length) {
    grid.innerHTML = '<div class="rtc-img-chooser-empty">No matches found in the exercise database.</div>';
  } else {
    candidates.forEach((cand) => {
      const url = imageUrl(cand);
      if (!url) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rtc-img-chooser-opt';
      btn.innerHTML = `<img src="${url}" loading="lazy" alt="" /><span>${cand.name}</span>`;
      btn.addEventListener('click', () => {
        saveOverride(exId, cand.id);
        paintSlot(slot, cand, name);
        closeChooser();
      });
      grid.appendChild(btn);
    });
  }
  card.querySelector('.rtc-img-chooser-close').addEventListener('click', closeChooser);
  card.querySelector('.rtc-img-chooser-clear').addEventListener('click', () => {
    saveOverride(exId, null);
    paintSlot(slot, null, name);
    closeChooser();
  });
  chooserEl.appendChild(card);
  chooserEl.addEventListener('click', (e) => { if (e.target === chooserEl) closeChooser(); });
  document.body.appendChild(chooserEl);
}
function closeChooser() {
  if (chooserEl) { chooserEl.remove(); chooserEl = null; }
}

// ============================================================
// Rest timer — floating panel at the bottom of the screen.
// ============================================================
const TIMER_DEFAULT_SEC = 90;

let timerEl = null;
let timerState = null;

function ensureTimerEl() {
  if (timerEl) return timerEl;
  timerEl = document.createElement('div');
  timerEl.className = 'rtc-timer';
  timerEl.innerHTML = `
    <div class="rtc-timer-row">
      <div class="rtc-timer-name" id="rtc-timer-name">Rest</div>
      <button type="button" class="rtc-timer-close" id="rtc-timer-close" aria-label="Close timer">×</button>
    </div>
    <div class="rtc-timer-countdown" id="rtc-timer-countdown">1:30</div>
    <div class="rtc-timer-controls">
      <button type="button" class="rtc-timer-adj" data-delta="-15">−15s</button>
      <button type="button" class="rtc-timer-go" id="rtc-timer-go">Start</button>
      <button type="button" class="rtc-timer-adj" data-delta="15">+15s</button>
    </div>
  `;
  document.body.appendChild(timerEl);
  timerEl.querySelector('#rtc-timer-close').addEventListener('click', cancelTimer);
  timerEl.querySelector('#rtc-timer-go').addEventListener('click', toggleTimer);
  timerEl.querySelectorAll('.rtc-timer-adj').forEach((b) => {
    b.addEventListener('click', () => adjustTimer(parseInt(b.dataset.delta, 10)));
  });
  return timerEl;
}

function fmtTime(sec) {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
function renderTimer() {
  if (!timerEl || !timerState) return;
  timerEl.querySelector('#rtc-timer-name').textContent = timerState.exName;
  timerEl.querySelector('#rtc-timer-countdown').textContent = fmtTime(timerState.remaining);
  timerEl.querySelector('#rtc-timer-go').textContent = timerState.running ? 'Pause' : 'Start';
}

function openTimerFor(exName) {
  ensureTimerEl();
  if (!timerState) {
    timerState = { exName, remaining: TIMER_DEFAULT_SEC, running: false, intervalId: null };
  } else {
    timerState.exName = exName;
  }
  timerEl.classList.remove('done');
  timerEl.classList.add('open');
  renderTimer();
}
function adjustTimer(delta) {
  if (!timerState) return;
  timerState.remaining = Math.max(0, timerState.remaining + delta);
  timerEl.classList.remove('done');
  renderTimer();
}
function toggleTimer() {
  if (!timerState) return;
  if (timerState.running) pauseTimer(); else startTimer();
}
function startTimer() {
  if (!timerState) return;
  if (timerState.remaining <= 0) timerState.remaining = TIMER_DEFAULT_SEC;
  timerState.running = true;
  timerEl.classList.remove('done');
  requestNotifPermission();
  ensureBeepReady();
  timerState.intervalId = setInterval(() => {
    if (!timerState || !timerState.running) return;
    timerState.remaining -= 1;
    renderTimer();
    if (timerState.remaining <= 0) {
      timerState.running = false;
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
      onTimerComplete();
    }
  }, 1000);
  renderTimer();
}
function pauseTimer() {
  if (!timerState) return;
  timerState.running = false;
  if (timerState.intervalId) clearInterval(timerState.intervalId);
  timerState.intervalId = null;
  renderTimer();
}
function cancelTimer() {
  if (timerState && timerState.intervalId) clearInterval(timerState.intervalId);
  timerState = null;
  if (timerEl) timerEl.classList.remove('open', 'done');
}
function onTimerComplete() {
  if (timerEl) timerEl.classList.add('done');
  try { navigator.vibrate && navigator.vibrate([200, 100, 200, 100, 400]); } catch {}
  playBeep();
  fireNotification(timerState?.exName || 'Rest');
  renderTimer();
}

// ============================================================
// Notifications + audio
// ============================================================
function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try { Notification.requestPermission(); } catch {}
  }
}
function fireNotification(exName) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification('Rest done · ' + exName, {
      body: 'Time to crush the next set.',
      tag: 'rtc-rest-timer',
      renotify: true,
    });
    setTimeout(() => { try { n.close(); } catch {} }, 8000);
  } catch {}
}

let audioCtx = null;
function ensureBeepReady() {
  if (audioCtx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  } catch {}
}
function playBeep() {
  if (!audioCtx) ensureBeepReady();
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    [0, 0.25, 0.5].forEach((offset) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.4, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  } catch {}
}

// ============================================================
// Mount everything once exercises are in the DOM and the DB is loaded.
// ============================================================
(async function init() {
  const exercises = Array.from(document.querySelectorAll('.exercise'));
  if (!exercises.length) return;

  // Add the timer button first (no network needed) so it's available even
  // if the image DB fails to load.
  exercises.forEach((ex) => {
    const header = ex.querySelector('.ex-header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ex-timer-btn';
    btn.setAttribute('aria-label', 'Rest timer');
    btn.textContent = '⏱';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = ex.querySelector('.ex-name')?.textContent || 'Rest';
      openTimerFor(name);
    });
    const linkEl = header.querySelector('.ex-demo');
    if (linkEl && linkEl.nextSibling) header.insertBefore(btn, linkEl.nextSibling);
    else header.appendChild(btn);
  });

  // Then the image slots — needs the DB.
  const db = await loadExerciseDB();
  for (const ex of exercises) {
    await mountImageSlot(ex, db);
  }
})();
