// Chores — checkable items with per-section auto-reset cycles.
//
// Daily section resets on day change, Weekly on ISO-week change,
// Monthly on calendar-month change, As-needed never auto-resets.
// State and notes survive across page loads via localStorage.

const STORAGE_KEY = 'rtc_chores_v1';

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch (e) { return {}; }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

const state = loadState();
state.checked   = state.checked   || {};
state.notes     = state.notes     || {};
state.lastReset = state.lastReset || {};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function isoWeekKey() {
  // Use Monday-anchored week, key = YYYY-MM-DD of that Monday
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

const SECTION_KEYS = {
  'daily-section':    { key: 'daily',    period: todayKey()  },
  'weekly-section':   { key: 'weekly',   period: isoWeekKey()},
  'monthly-section':  { key: 'monthly',  period: monthKey()  },
  'asneeded-section': { key: 'asneeded', period: null        },
};

function clearSectionChecks(sectionKey) {
  document.querySelectorAll(`.${sectionKey}-section .chore-li`).forEach((li) => {
    delete state.checked[li.dataset.id];
    li.classList.remove('checked');
  });
}

// Auto-reset before rendering
Object.entries(SECTION_KEYS).forEach(([cls, info]) => {
  if (info.period == null) return;
  if (state.lastReset[info.key] !== info.period) {
    // First load → just set the marker without clearing
    if (state.lastReset[info.key]) {
      document.querySelectorAll(`.${cls} .chore-li`).forEach((li) => {
        // We don't have data-id yet — clear by index reconstruction
      });
      // We'll handle the actual clearing after IDs are assigned below
      info.shouldReset = true;
    }
    state.lastReset[info.key] = info.period;
  }
});

// Build interactive UI for each chore section
document.querySelectorAll('.chore-section').forEach((section) => {
  const cls = Array.from(section.classList).find((c) => SECTION_KEYS[c]);
  if (!cls) return;
  const info = SECTION_KEYS[cls];
  const items = section.querySelectorAll('.chore-li');

  // Section header — append progress + reset button
  const h2 = section.querySelector('h2');
  const meta = document.createElement('span');
  meta.className = 'chore-section-meta';
  const progressEl = document.createElement('span');
  progressEl.className = 'chore-progress';
  progressEl.dataset.section = info.key;
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'chore-reset-btn';
  resetBtn.textContent = 'Reset';
  resetBtn.dataset.section = info.key;
  meta.appendChild(progressEl);
  meta.appendChild(resetBtn);
  h2.appendChild(meta);

  items.forEach((li, idx) => {
    const id = `${info.key}_${idx}`;
    li.dataset.id = id;

    // Apply auto-reset (clear checked state for this item if section rolled over)
    if (info.shouldReset) delete state.checked[id];

    // Wrap existing children (name + meta) in a row div
    const row = document.createElement('div');
    row.className = 'chore-row';
    while (li.firstChild) row.appendChild(li.firstChild);
    li.appendChild(row);

    // Checkbox at the start of the row
    const box = document.createElement('button');
    box.type = 'button';
    box.className = 'chore-check';
    box.setAttribute('aria-label', 'Mark done');
    row.insertBefore(box, row.firstChild);

    // Notes toggle at the end of the row
    const hasNote = (state.notes[id] || '').trim().length > 0;
    const noteToggle = document.createElement('button');
    noteToggle.type = 'button';
    noteToggle.className = 'chore-note-toggle';
    noteToggle.setAttribute('aria-label', 'Toggle notes');
    noteToggle.textContent = hasNote ? '📝' : '＋';
    row.appendChild(noteToggle);

    // Collapsible notes panel
    const noteWrap = document.createElement('div');
    noteWrap.className = 'chore-note-wrap';
    noteWrap.hidden = !hasNote;
    const ta = document.createElement('textarea');
    ta.className = 'chore-note-input';
    ta.placeholder = 'Notes (optional)…';
    ta.value = state.notes[id] || '';
    noteWrap.appendChild(ta);
    li.appendChild(noteWrap);

    // Apply checked state
    if (state.checked[id]) li.classList.add('checked');

    // Handlers
    box.addEventListener('click', () => {
      state.checked[id] = !state.checked[id];
      li.classList.toggle('checked', !!state.checked[id]);
      if (!state.checked[id]) delete state.checked[id];
      saveState();
      updateProgress(info.key);
    });

    noteToggle.addEventListener('click', () => {
      noteWrap.hidden = !noteWrap.hidden;
      if (!noteWrap.hidden) ta.focus();
    });

    let noteTimer;
    ta.addEventListener('input', () => {
      const v = ta.value;
      if (v.trim()) state.notes[id] = v;
      else delete state.notes[id];
      noteToggle.textContent = v.trim() ? '📝' : '＋';
      clearTimeout(noteTimer);
      noteTimer = setTimeout(saveState, 300);
    });
  });

  // Persist after possible auto-reset clears
  if (info.shouldReset) saveState();

  updateProgress(info.key);
});

document.querySelectorAll('.chore-reset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    clearSectionChecks(btn.dataset.section);
    saveState();
    updateProgress(btn.dataset.section);
  });
});

function updateProgress(sectionKey) {
  const items = document.querySelectorAll(`.${sectionKey}-section .chore-li`);
  let done = 0;
  items.forEach((li) => { if (state.checked[li.dataset.id]) done++; });
  const el = document.querySelector(`.chore-progress[data-section="${sectionKey}"]`);
  if (el) el.textContent = `${done} / ${items.length}`;
}
