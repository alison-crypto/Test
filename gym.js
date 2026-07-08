const cfg = document.body.dataset;
const STORAGE_KEY = cfg.storageKey;
const PREV_KEY = cfg.prevKey;
const SWAPS_KEY = STORAGE_KEY + '_swaps';
const NOTES_KEY = STORAGE_KEY + '_notes';
const TRAINING_HISTORY_KEY = 'rtc_tracker_training_v1';
const EXPORT_LABEL = cfg.exportLabel || 'Gym session';
const IS_HER = (EXPORT_LABEL || '').toLowerCase().startsWith('darlene');
const PERSON = IS_HER ? 'her' : 'him';
// Per-person logging unit (set on the gym page's kg/lb toggle). Numbers are stored
// as-typed; this is just the label so PRs/inputs read in the right unit.
let LOG_UNIT = 'kg';
try { LOG_UNIT = JSON.parse(localStorage.getItem('rtc_gym_unit_' + PERSON + '_v1')) || 'kg'; } catch (e) {}
let currentDay = cfg.defaultDay;

function ytSearchUrl(name) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' proper form');
}

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch (e) { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

// ============================================================
// Compute PRs from cross-module training history
// ============================================================
function computePRs() {
  const trains = loadJSON(TRAINING_HISTORY_KEY, []);
  const person = IS_HER ? 'her' : 'him';
  const prs = {}; // exId -> { weight, reps, date }

  trains.forEach((t) => {
    if (t.person !== person) return;
    (t.exercises || []).forEach((ex) => {
      if (!ex.exId) return;
      (ex.sets || []).forEach((s) => {
        const w = Number(s.w), r = Number(s.r);
        if (!w || !r) return;
        const existing = prs[ex.exId];
        if (!existing || w > existing.weight) {
          prs[ex.exId] = { weight: w, reps: r, date: t.date };
        }
      });
    });
  });
  return prs;
}

// ============================================================
// Build set rows + last-week display + swap UI + notes + PR badge
// ============================================================
const swaps = loadJSON(SWAPS_KEY, {});
const notes = loadJSON(NOTES_KEY, {});
const prs = computePRs();

document.querySelectorAll('.exercise').forEach((ex) => {
  const exId = ex.dataset.ex;
  const numSets = parseInt(ex.dataset.sets) || 3;

  // Cache the original exercise name + YouTube link so we can revert
  const nameEl = ex.querySelector('.ex-name');
  const linkEl = ex.querySelector('.ex-demo');
  ex.dataset.origName = nameEl.textContent;
  if (linkEl) ex.dataset.origHref = linkEl.getAttribute('href');

  // Apply saved swap, if any
  if (swaps[exId] != null && Array.isArray(SUBSTITUTES[exId])) {
    const sub = SUBSTITUTES[exId][swaps[exId]];
    if (sub) {
      nameEl.textContent = sub.name;
      if (linkEl) linkEl.setAttribute('href', ytSearchUrl(sub.name));
    }
  }

  // PR badge (only if we have history for this exercise)
  const info = ex.querySelector('.ex-info');
  if (info && prs[exId]) {
    const badge = document.createElement('div');
    badge.className = 'ex-pr';
    badge.textContent = `🏆 PR ${prs[exId].weight}${LOG_UNIT}×${prs[exId].reps}`;
    badge.title = `Best logged set, ${prs[exId].date}`;
    info.appendChild(badge);
  }

  // Swap button in the header (before the YouTube link)
  const header = ex.querySelector('.ex-header');
  if (header && Array.isArray(SUBSTITUTES[exId])) {
    const swapBtn = document.createElement('button');
    swapBtn.type = 'button';
    swapBtn.className = 'ex-swap';
    swapBtn.setAttribute('aria-label', 'Swap exercise');
    swapBtn.textContent = '⇄';
    swapBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = ex.querySelector('.ex-swap-panel');
      if (panel) panel.classList.toggle('open');
    });
    // Insert before YouTube link if present, else append
    if (linkEl) header.insertBefore(swapBtn, linkEl);
    else header.appendChild(swapBtn);
  }

  // Swap panel
  if (Array.isArray(SUBSTITUTES[exId])) {
    const panel = document.createElement('div');
    panel.className = 'ex-swap-panel';
    const isSwapped = swaps[exId] != null;
    panel.innerHTML = `
      <div class="ex-swap-title">Swap if needed${IS_HER ? ' — pregnancy-safe alternates only, confirm load with OB' : ''}:</div>
      ${SUBSTITUTES[exId].map((sub, i) => `
        <button type="button" class="ex-swap-opt ${swaps[exId] === i ? 'active' : ''}" data-idx="${i}">
          <span class="opt-name">${sub.name}</span>
          <span class="opt-reason">${sub.reason}</span>
        </button>
      `).join('')}
      ${isSwapped ? '<button type="button" class="ex-swap-revert">↶ Back to original</button>' : ''}
    `;
    panel.querySelectorAll('.ex-swap-opt').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(b.dataset.idx);
        applySwap(exId, idx);
      });
    });
    const revertBtn = panel.querySelector('.ex-swap-revert');
    if (revertBtn) revertBtn.addEventListener('click', (e) => { e.stopPropagation(); applySwap(exId, null); });
    ex.appendChild(panel);
  }

  // Set rows
  const setsContainer = document.createElement('div');
  setsContainer.className = 'ex-sets';
  for (let i = 1; i <= numSets; i++) {
    const row = document.createElement('div');
    row.className = 'set-row';
    row.innerHTML = `
      <span class="set-label">Set ${i}</span>
      <input class="set-input" type="text" inputmode="decimal" placeholder="${LOG_UNIT}" data-field="w${i}" />
      <span class="set-unit">×</span>
      <input class="set-input" type="text" inputmode="numeric" placeholder="reps" data-field="r${i}" />
    `;
    setsContainer.appendChild(row);
  }
  const lastWeek = document.createElement('div');
  lastWeek.className = 'last-week';
  lastWeek.dataset.exId = exId;
  setsContainer.appendChild(lastWeek);
  ex.appendChild(setsContainer);

  // Notes
  const notesWrap = document.createElement('div');
  notesWrap.className = 'ex-notes-wrap';
  const ta = document.createElement('textarea');
  ta.className = 'ex-notes-input';
  ta.placeholder = 'Notes — form cues, pain, progressions…';
  ta.dataset.exId = exId;
  ta.value = notes[exId] || '';
  notesWrap.appendChild(ta);
  ex.appendChild(notesWrap);
});

function applySwap(exId, idx) {
  const ex = document.querySelector(`.exercise[data-ex="${exId}"]`);
  if (!ex) return;
  const nameEl = ex.querySelector('.ex-name');
  const linkEl = ex.querySelector('.ex-demo');
  if (idx == null) {
    nameEl.textContent = ex.dataset.origName;
    if (linkEl) linkEl.setAttribute('href', ex.dataset.origHref);
    delete swaps[exId];
  } else {
    const sub = SUBSTITUTES[exId][idx];
    nameEl.textContent = sub.name;
    if (linkEl) linkEl.setAttribute('href', ytSearchUrl(sub.name));
    swaps[exId] = idx;
  }
  saveJSON(SWAPS_KEY, swaps);
  // Rebuild the swap panel to reflect new state
  const panel = ex.querySelector('.ex-swap-panel');
  if (panel) {
    panel.querySelectorAll('.ex-swap-opt').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.idx) === idx);
    });
    const existingRevert = panel.querySelector('.ex-swap-revert');
    if (idx != null && !existingRevert) {
      const r = document.createElement('button');
      r.type = 'button';
      r.className = 'ex-swap-revert';
      r.textContent = '↶ Back to original';
      r.addEventListener('click', (e) => { e.stopPropagation(); applySwap(exId, null); });
      panel.appendChild(r);
    } else if (idx == null && existingRevert) {
      existingRevert.remove();
    }
    panel.classList.remove('open');
  }
}

// Stop click propagation on inputs so checking the exercise doesn't fire
document.querySelectorAll('.set-input').forEach((input) => {
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('input', save);
});

// Notes textareas — save on input (debounced) + stop click bubbling
let notesTimer;
document.querySelectorAll('.ex-notes-input').forEach((ta) => {
  ta.addEventListener('click', (e) => e.stopPropagation());
  ta.addEventListener('input', (e) => {
    notes[ta.dataset.exId] = ta.value;
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => saveJSON(NOTES_KEY, notes), 300);
  });
});

// Prevent the swap panel from collapsing the parent exercise when tapped inside
document.querySelectorAll('.ex-swap-panel').forEach((p) => {
  p.addEventListener('click', (e) => e.stopPropagation());
});

function save() {
  const state = { day: currentDay, exercises: {} };
  document.querySelectorAll('.exercise').forEach((ex) => {
    const exId = ex.dataset.ex;
    state.exercises[exId] = {
      done: ex.classList.contains('done'),
      sets: {},
    };
    ex.querySelectorAll('.set-input').forEach((input) => {
      state.exercises[exId].sets[input.dataset.field] = input.value;
    });
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (state.day) {
      currentDay = state.day;
      switchDay(currentDay, false);
    }
    Object.keys(state.exercises || {}).forEach((exId) => {
      const ex = document.querySelector(`.exercise[data-ex="${exId}"]`);
      if (!ex) return;
      if (state.exercises[exId].done) ex.classList.add('done');
      Object.keys(state.exercises[exId].sets || {}).forEach((field) => {
        const input = ex.querySelector(`.set-input[data-field="${field}"]`);
        if (input) input.value = state.exercises[exId].sets[field];
      });
    });
  } catch (e) {}
}

function loadPrev() {
  try {
    const raw = localStorage.getItem(PREV_KEY);
    if (!raw) return;
    const prev = JSON.parse(raw);
    document.querySelectorAll('.last-week').forEach((lw) => {
      const exId = lw.dataset.exId;
      if (!prev[exId] || !prev[exId].sets) return;
      const sets = prev[exId].sets;
      const parts = [];
      for (let i = 1; i <= 5; i++) {
        const w = sets['w' + i], r = sets['r' + i];
        if (w && r) parts.push(`${w}×${r}`);
      }
      if (parts.length > 0) {
        lw.innerHTML = `<b>Last:</b> ${parts.join(' · ')}`;
        lw.classList.add('has-data');
      }
    });
  } catch (e) {}
}

function toggleEx(headerEl) {
  headerEl.parentElement.classList.toggle('done');
  save();
  updateProgress();
}

function switchDay(day, doSave = true) {
  currentDay = day;
  document.querySelectorAll('.day-page').forEach((p) => p.classList.remove('active'));
  document.getElementById('day-' + day).classList.add('active');
  document.querySelectorAll('.day-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.day === day)
  );
  if (doSave) save();
  updateProgress();
}

function updateProgress() {
  const visibleEx = document.querySelectorAll('.day-page.active .exercise');
  const done = document.querySelectorAll('.day-page.active .exercise.done').length;
  const total = visibleEx.length;
  document.getElementById('count').textContent = `${done} / ${total}`;
  document.getElementById('fill').style.width = total ? (done / total) * 100 + '%' : '0%';
}

function resetCurrentDay() {
  if (!confirm(`Reset ${currentDay}? Current values save as "last week" first.`)) return;

  try {
    let prev = {};
    try {
      prev = JSON.parse(localStorage.getItem(PREV_KEY) || '{}');
    } catch (e) {}
    document.querySelectorAll('.day-page.active .exercise').forEach((ex) => {
      const exId = ex.dataset.ex;
      const sets = {};
      ex.querySelectorAll('.set-input').forEach((input) => {
        sets[input.dataset.field] = input.value;
      });
      prev[exId] = { sets };
    });
    localStorage.setItem(PREV_KEY, JSON.stringify(prev));
  } catch (e) {}

  document.querySelectorAll('.day-page.active .exercise').forEach((ex) => {
    ex.classList.remove('done');
    ex.querySelectorAll('.set-input').forEach((input) => (input.value = ''));
  });
  save();
  loadPrev();
  updateProgress();
}

function exportData() {
  let txt = `${EXPORT_LABEL} — ${currentDay} — ${new Date().toLocaleDateString()}\n\n`;
  document.querySelectorAll('.day-page.active .exercise').forEach((ex) => {
    const name = ex.querySelector('.ex-name').textContent;
    const done = ex.classList.contains('done');
    const sets = [];
    ex.querySelectorAll('.set-row').forEach((row) => {
      const w = row.querySelector('[data-field^="w"]').value;
      const r = row.querySelector('[data-field^="r"]').value;
      if (w || r) sets.push(`${w || '?'}×${r || '?'}`);
    });
    txt += `${done ? '✓' : '○'} ${name}: ${sets.length ? sets.join(', ') : '(no data)'}\n`;
  });
  try {
    navigator.clipboard.writeText(txt);
    alert('Copied to clipboard! Paste in Claude chat.');
  } catch (e) {
    prompt('Copy this text:', txt);
  }
}

// Save the current day's session into the Tracker's training history.
// Person ('him' or 'her') and a human day label are derived from the page's
// data-* attributes so the same code works for both gym pages.
function saveToTracker() {
  const person = cfg.exportLabel && cfg.exportLabel.toLowerCase().startsWith('darlene') ? 'her' : 'him';
  const dayPage = document.querySelector('.day-page.active');
  if (!dayPage) return;
  const dayLabel = (dayPage.querySelector('.day-title') || {}).textContent || currentDay;

  const exercises = [];
  dayPage.querySelectorAll('.exercise').forEach((ex) => {
    const name = ex.querySelector('.ex-name').textContent.trim();
    const target = (ex.querySelector('.ex-target') || {}).textContent || '';
    const sets = [];
    ex.querySelectorAll('.set-row').forEach((row) => {
      const w = row.querySelector('[data-field^="w"]').value;
      const r = row.querySelector('[data-field^="r"]').value;
      sets.push({ w, r });
    });
    // Only include the exercise if it was checked off OR at least one set has data
    const hasData = sets.some((s) => s.w || s.r);
    if (ex.classList.contains('done') || hasData) {
      exercises.push({
        exId: ex.dataset.ex,
        name,
        target: target.trim(),
        done: ex.classList.contains('done'),
        sets,
      });
    }
  });

  if (!exercises.length) {
    alert('No exercise data on this page — nothing to save.');
    return;
  }

  const today = new Date();
  const tz = today.getTimezoneOffset() * 60000;
  const dateISO = new Date(today - tz).toISOString().slice(0, 10);

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    date: dateISO,
    person,
    day: currentDay,
    dayLabel: dayLabel.trim(),
    exercises,
  };

  try {
    const KEY = 'rtc_tracker_training_v1';
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    arr.push(entry);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch (e) {
    alert('Could not save (storage unavailable).');
    return;
  }

  // Inline confirmation toast
  const toast = document.createElement('div');
  toast.className = 't-toast';
  toast.textContent = '✓ Saved to Tracker';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2900);
}

window.toggleEx = toggleEx;
window.switchDay = switchDay;
window.resetCurrentDay = resetCurrentDay;
window.exportData = exportData;
window.saveToTracker = saveToTracker;

load();
loadPrev();
updateProgress();
