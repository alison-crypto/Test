const cfg = document.body.dataset;
const STORAGE_KEY = cfg.storageKey;
const PREV_KEY = cfg.prevKey;
const EXPORT_LABEL = cfg.exportLabel || 'Gym session';
let currentDay = cfg.defaultDay;

document.querySelectorAll('.exercise').forEach((ex) => {
  const numSets = parseInt(ex.dataset.sets) || 3;
  const setsContainer = document.createElement('div');
  setsContainer.className = 'ex-sets';

  for (let i = 1; i <= numSets; i++) {
    const row = document.createElement('div');
    row.className = 'set-row';
    row.innerHTML = `
      <span class="set-label">Set ${i}</span>
      <input class="set-input" type="text" inputmode="decimal" placeholder="weight" data-field="w${i}" />
      <span class="set-unit">×</span>
      <input class="set-input" type="text" inputmode="numeric" placeholder="reps" data-field="r${i}" />
    `;
    setsContainer.appendChild(row);
  }
  const lastWeek = document.createElement('div');
  lastWeek.className = 'last-week';
  lastWeek.dataset.exId = ex.dataset.ex;
  setsContainer.appendChild(lastWeek);

  ex.appendChild(setsContainer);
});

document.querySelectorAll('.set-input').forEach((input) => {
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('input', save);
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

window.toggleEx = toggleEx;
window.switchDay = switchDay;
window.resetCurrentDay = resetCurrentDay;
window.exportData = exportData;

load();
loadPrev();
updateProgress();
