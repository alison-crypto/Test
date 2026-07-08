// gym-custom.js — renders Library-built custom workouts inside the Gym pages.
//
// v2: multiple named workouts per person (Alison = him, Darlene = her), stored in
// rtc_custom_workouts_v2 = { him:[{id,name,exercises:[{name,sets,dbId}]}], her:[...] }.
// Each workout becomes its own day button + page with full gym.js treatment
// (set rows, PR badges, tracker save). Fully editable in place: per-exercise ✕
// delete, whole-workout delete, and "Edit in Library" round-trip (library.html
// ?edit=<id>&person=<him|her> reloads the picks into the basket).
// Load order matters: this script must run before gym.js.

(function () {
  const KEY = 'rtc_custom_workouts_v2';
  const storageKey = document.body.dataset.storageKey;
  const person = storageKey === 'rtc_gym_alison_v1' ? 'him'
    : storageKey === 'rtc_gym_darlene_v1' ? 'her' : null;
  if (!person) return;

  const loadJSON = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } };
  const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ytUrl = (name) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' proper form');

  // ---- load + one-time migration from the single-workout v1 key ----
  const store = loadJSON(KEY, { him: [], her: [] });
  store.him = store.him || []; store.her = store.her || [];
  const legacy = loadJSON('rtc_custom_gym_him_v1', null);
  if (legacy && Array.isArray(legacy.exercises) && legacy.exercises.length && !store.him.some((w) => w.id === 'w1')) {
    store.him.push({ id: 'w1', name: 'Custom', exercises: legacy.exercises });
    saveJSON(KEY, store);
    try { localStorage.removeItem('rtc_custom_gym_him_v1'); } catch (e) {}
  }
  const workouts = store[person];
  if (!workouts.length) return;

  const picker = document.querySelector('.day-picker');
  const pages = document.querySelectorAll('.day-page');
  const lastPage = pages[pages.length - 1];
  if (!picker || !lastPage) return;

  // widen the day picker to fit extra buttons
  const totalBtns = picker.children.length + workouts.length;
  picker.style.gridTemplateColumns = `repeat(${totalBtns}, 1fr)`;
  if (totalBtns > 4) picker.classList.add('day-picker-5');

  workouts.forEach((w) => {
    const dayId = 'cust_' + w.id;
    const shortName = (w.name || 'Custom').slice(0, 9);

    const btn = document.createElement('div');
    btn.className = 'day-btn';
    btn.dataset.day = dayId;
    btn.setAttribute('onclick', `switchDay('${dayId}')`);
    btn.innerHTML = `<div class="day-btn-label">PICK</div><div class="day-btn-name">${esc(shortName)}</div>`;
    picker.appendChild(btn);

    const page = document.createElement('div');
    page.className = 'day-page';
    page.id = 'day-' + dayId;
    page.innerHTML = `
      <div class="day-header">
        <div class="day-title">${esc(w.name || 'Custom')} · from Library</div>
        <div class="day-meta">${w.exercises.length} exercises · fully yours — swap, delete, rebuild anytime</div>
        <div class="day-note cust-controls">
          <a class="cust-edit-link" href="library.html?edit=${encodeURIComponent(w.id)}&person=${person}">✎ Edit in Library</a>
          <button type="button" class="cust-del-workout" data-wid="${esc(w.id)}">🗑 Delete workout</button>
        </div>
      </div>
      ${w.exercises.map((ex, i) => {
        const sets = Math.max(1, Math.min(6, Number(ex.sets) || 3));
        return `
        <div class="exercise" data-ex="${person}_cust_${esc(w.id)}_${i}" data-sets="${sets}">
          <div class="ex-header" onclick="toggleEx(this)">
            <div class="ex-checkbox"><span class="ex-checkmark">✓</span></div>
            <div class="ex-info">
              <div class="ex-name">${esc(ex.name)}</div>
              <div class="ex-target">${sets} sets · your pick · rest 60–120 sec</div>
            </div>
            <button type="button" class="cust-del-ex" data-wid="${esc(w.id)}" data-i="${i}" onclick="event.stopPropagation()" aria-label="Remove exercise">✕</button>
            <a class="ex-demo" href="${ytUrl(ex.name)}" target="_blank" onclick="event.stopPropagation()">📹</a>
          </div>
        </div>`;
      }).join('')}
    `;
    lastPage.parentNode.insertBefore(page, null);
  });

  // ---- edit interactions (delegated; persists then reloads so gym.js re-inits) ----
  document.addEventListener('click', (e) => {
    const delEx = e.target.closest('.cust-del-ex');
    if (delEx) {
      e.stopPropagation();
      const w = workouts.find((x) => x.id === delEx.dataset.wid);
      if (!w) return;
      const i = Number(delEx.dataset.i);
      if (!confirm(`Remove "${w.exercises[i] ? w.exercises[i].name : 'exercise'}" from ${w.name}?`)) return;
      w.exercises.splice(i, 1);
      if (!w.exercises.length) store[person] = store[person].filter((x) => x.id !== w.id);
      saveJSON(KEY, store);
      location.reload();
      return;
    }
    const delW = e.target.closest('.cust-del-workout');
    if (delW) {
      const w = workouts.find((x) => x.id === delW.dataset.wid);
      if (!w) return;
      if (!confirm(`Delete the whole "${w.name}" workout? (Logged history in the Tracker stays.)`)) return;
      store[person] = store[person].filter((x) => x.id !== w.id);
      saveJSON(KEY, store);
      location.reload();
    }
  });
})();
