// Tuesday Hyrox prep — compromised-run circuit. Tap a round when done;
// checks auto-reset each day. Rounds 7–8 are "progression" (build toward 8).
//
// Storage: rtc_hyrox_checks_v1 = { date, map:{ '1':true } }, reset daily.

const CHECK_KEY = 'rtc_hyrox_checks_v1';

const ROUNDS = [
  { n: 1, run: '400m', station: 'SkiErg 200m',            sub: 'sub: 20 kettlebell swings',                        demo: 'kettlebell swing proper form' },
  { n: 2, run: '400m', station: 'Sled push 40m',          sub: 'sub: backward walk on inclined treadmill',         demo: 'sled push form' },
  { n: 3, run: '400m', station: 'Sled pull',              sub: 'sub: 15 bent-over DB rows / ring rows',            demo: 'bent over dumbbell row form' },
  { n: 4, run: '400m', station: 'Burpee broad jumps ×10', sub: 'brace — step-back lunges if back is cranky', warn: true, demo: 'burpee broad jump' },
  { n: 5, run: '400m', station: 'RowErg 250m',            sub: '',                                                 demo: 'rowerg rowing machine technique' },
  { n: 6, run: '400m', station: 'Farmers carry 40m',      sub: 'heaviest DBs you can hold',                        demo: 'farmers carry form' },
  { n: 7, run: '400m', station: 'Sandbag lunges · 20 steps', sub: 'sub: DB front-rack / goblet reverse lunges', prog: true, demo: 'dumbbell reverse lunge form' },
  { n: 8, run: '400m', station: 'Wall balls ×20',         sub: 'sub: DB thrusters ×15',                    prog: true, demo: 'wall ball shot form' },
];

function loadJSON(k, f) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(f)); } catch { return f; } }
function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function todayStr() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

let store = loadJSON(CHECK_KEY, { date: '', map: {} });
if (store.date !== todayStr()) { store = { date: todayStr(), map: {} }; saveJSON(CHECK_KEY, store); }
const checks = store.map;
function persist() { store.date = todayStr(); store.map = checks; saveJSON(CHECK_KEY, store); }

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function ytUrl(q) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q); }

const root = document.getElementById('hyrox-rounds');
const progressEl = document.getElementById('hx-progress');

function roundHTML(r) {
  const done = !!checks[r.n];
  const subClass = r.warn ? 'hx-sub2 hx-warn' : 'hx-sub2';
  return `
    <div class="hx-round ${done ? 'done' : ''} ${r.prog ? 'prog' : ''}" data-n="${r.n}">
      <button type="button" class="hx-check" aria-label="Mark done">✓</button>
      <div class="hx-round-body">
        <div class="hx-round-head">
          <span class="hx-run">🏃 Run ${esc(r.run)}</span>
          <span class="hx-rnum">Round ${r.n}${r.prog ? '<span class="hx-tag">BUILD</span>' : ''}</span>
        </div>
        <div class="hx-station">${esc(r.station)}</div>
        ${r.sub ? `<div class="${subClass}">${r.warn ? '⚠️ ' : ''}${esc(r.sub)}</div>` : ''}
      </div>
      <a class="hx-demo" href="${ytUrl(r.demo)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">📹</a>
    </div>`;
}

function updateProgress() {
  const done = ROUNDS.filter((r) => checks[r.n]).length;
  progressEl.textContent = `${done} / ${ROUNDS.length} rounds done · aim for 6 to start`;
}

function render() {
  root.innerHTML = ROUNDS.map(roundHTML).join('');
  updateProgress();
}

root.addEventListener('click', (e) => {
  if (e.target.closest('.hx-demo')) return;
  const row = e.target.closest('.hx-round');
  if (!row) return;
  const n = row.dataset.n;
  if (checks[n]) delete checks[n]; else checks[n] = true;
  row.classList.toggle('done', !!checks[n]);
  persist();
  updateProgress();
});

document.getElementById('hx-reset').addEventListener('click', () => {
  ROUNDS.forEach((r) => { delete checks[r.n]; });
  persist();
  render();
});

render();
