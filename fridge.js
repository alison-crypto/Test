const STORAGE_KEY = 'rtc_fridge_week_v1';
const CHECK_KEY   = 'rtc_fridge_checks_v1';
const NOTES_KEY   = 'rtc_fridge_notes_v1';
const RESET_KEY   = 'rtc_fridge_last_reset';

let currentWeek;
try {
  currentWeek = localStorage.getItem(STORAGE_KEY) || 'a';
} catch (e) {
  currentWeek = 'a';
}

function switchWeek(week) {
  currentWeek = week;
  try {
    localStorage.setItem(STORAGE_KEY, week);
  } catch (e) {}
  document.body.dataset.activeWeek = week;
  document.querySelectorAll('.fridge-week-page').forEach((p) =>
    p.classList.toggle('active', p.dataset.week === week)
  );
  document.querySelectorAll('.fridge-week-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.week === week)
  );
}

document.querySelectorAll('.fridge-week-btn').forEach((b) => {
  b.addEventListener('click', () => switchWeek(b.dataset.week));
});

switchWeek(currentWeek);

// ============================================================
// Meal-cell interactivity — "made this one" + per-cell notes
// ============================================================

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch (e) { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

const checks = loadJSON(CHECK_KEY, {});
const notes  = loadJSON(NOTES_KEY, {});

function isoWeekKey() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

// Auto-reset on ISO-week change
const weekKey = isoWeekKey();
const lastReset = localStorage.getItem(RESET_KEY);
if (lastReset && lastReset !== weekKey) {
  Object.keys(checks).forEach((k) => delete checks[k]);
  saveJSON(CHECK_KEY, checks);
}
localStorage.setItem(RESET_KEY, weekKey);

function cellId(weekId, contextRow, cell) {
  const dowEl = contextRow ? contextRow.querySelector('.dow') : null;
  const dow = dowEl ? dowEl.textContent.trim().toLowerCase() : 'fixed';
  const tagEl = cell.querySelector('.meal-tag, .fixed-cell-name');
  const tag = tagEl ? tagEl.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') : 'meal';
  return `${weekId}_${dow}_${tag}`;
}

function attachMealCell(weekId, cell, contextRow) {
  const id = cellId(weekId, contextRow, cell);
  cell.dataset.id = id;
  if (checks[id]) cell.classList.add('made');

  cell.addEventListener('click', (e) => {
    if (e.target.closest('.fridge-note-wrap')) return;
    if (e.target.closest('.fridge-note-toggle')) return;
    if (checks[id]) delete checks[id];
    else checks[id] = true;
    cell.classList.toggle('made', !!checks[id]);
    saveJSON(CHECK_KEY, checks);
    updatePageCounter(cell.closest('.fridge-week-page'));
  });

  const hasNote = (notes[id] || '').trim().length > 0;
  const noteToggle = document.createElement('button');
  noteToggle.type = 'button';
  noteToggle.className = 'fridge-note-toggle';
  noteToggle.setAttribute('aria-label', 'Notes');
  noteToggle.textContent = hasNote ? '📝' : '＋';
  cell.appendChild(noteToggle);

  const noteWrap = document.createElement('div');
  noteWrap.className = 'fridge-note-wrap';
  noteWrap.hidden = !hasNote;
  const ta = document.createElement('textarea');
  ta.className = 'fridge-note-input';
  ta.placeholder = 'Notes (substitutions, what worked)…';
  ta.value = notes[id] || '';
  noteWrap.appendChild(ta);
  cell.appendChild(noteWrap);

  noteToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    noteWrap.hidden = !noteWrap.hidden;
    if (!noteWrap.hidden) ta.focus();
  });

  ta.addEventListener('click', (e) => e.stopPropagation());
  let noteTimer;
  ta.addEventListener('input', () => {
    const v = ta.value;
    if (v.trim()) notes[id] = v;
    else delete notes[id];
    noteToggle.textContent = v.trim() ? '📝' : '＋';
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => saveJSON(NOTES_KEY, notes), 300);
  });
}

function updatePageCounter(page) {
  if (!page) return;
  const cells = page.querySelectorAll('.meal-cell, .fixed-cell');
  let done = 0;
  cells.forEach((c) => { if (checks[c.dataset.id]) done++; });
  const el = page.querySelector('.fridge-progress');
  if (el) el.textContent = `${done} / ${cells.length} made`;
}

document.querySelectorAll('.fridge-week-page').forEach((page) => {
  const weekId = page.dataset.week;

  page.querySelectorAll('.day-row').forEach((row) => {
    row.querySelectorAll('.meal-cell').forEach((cell) => attachMealCell(weekId, cell, row));
  });

  const fixedBar = page.querySelector('.fixed-bar');
  if (fixedBar) {
    fixedBar.querySelectorAll('.fixed-cell').forEach((cell) => attachMealCell(weekId, cell, fixedBar));
  }

  const cardHeader = page.querySelector('.fridge-card-header');
  if (cardHeader) {
    const meta = document.createElement('div');
    meta.className = 'fridge-card-meta';
    const counter = document.createElement('span');
    counter.className = 'fridge-progress';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'fridge-reset-btn';
    resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', () => {
      page.querySelectorAll('.meal-cell, .fixed-cell').forEach((c) => {
        delete checks[c.dataset.id];
        c.classList.remove('made');
      });
      saveJSON(CHECK_KEY, checks);
      updatePageCounter(page);
    });
    meta.appendChild(counter);
    meta.appendChild(resetBtn);
    cardHeader.appendChild(meta);
  }

  updatePageCounter(page);
});
