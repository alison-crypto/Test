// library.js — full exercise library + custom-workout builder.
//
// Browses the free-exercise-db (~800 exercises, shared localStorage cache with
// gym-extras) by muscle-group category, with search, an illustration image and
// a YouTube demo link per exercise. Tap ＋ to add exercises to a basket, set
// sets per exercise, then "Send to Alison's Gym" — that writes a Custom day
// (rtc_custom_gym_him_v1) which gym-custom.js renders inside the Gym tab with
// full set-logging / PR / tracker support, and pins the exact image for each
// pick via the gym image-override store.
//
// Storage:
//   rtc_exercise_db_v1        — cached DB (shared with gym pages)
//   rtc_library_basket_v1     — [{dbId, name, sets}]
//   rtc_custom_gym_him_v1     — {updated, exercises:[{name, sets, dbId}]}
//   rtc_gym_image_overrides_v1 — merged: him_cust_<i> → dbId

const DB_URL       = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const DB_CACHE_KEY = 'rtc_exercise_db_v1';
const BASKET_KEY   = 'rtc_library_basket_v1';
const CUSTOM_KEY   = 'rtc_custom_workouts_v2';   // { him:[{id,name,exercises}], her:[...] }
const OVERRIDES_KEY = 'rtc_gym_image_overrides_v1';

// Edit round-trip: library.html?edit=<workoutId>&person=<him|her> re-opens a
// workout in the basket; Send then updates it in place.
let editing = null;
(function () {
  const p = new URLSearchParams(location.search);
  const id = p.get('edit'), person = p.get('person');
  if (id && (person === 'him' || person === 'her')) editing = { id, person };
})();

const PAGE_SIZE = 48;

// Muscle-group categories (mapped from the DB's primaryMuscles / category).
const GROUPS = [
  { key: 'all',      label: 'All' },
  { key: 'chest',    label: 'Chest',     muscles: ['chest'] },
  { key: 'back',     label: 'Back',      muscles: ['lats', 'middle back', 'lower back', 'traps', 'neck'] },
  { key: 'shoulders',label: 'Shoulders', muscles: ['shoulders'] },
  { key: 'arms',     label: 'Arms',      muscles: ['biceps', 'triceps', 'forearms'] },
  { key: 'legs',     label: 'Legs',      muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'] },
  { key: 'core',     label: 'Core',      muscles: ['abdominals'] },
  { key: 'cardio',   label: 'Cardio',    category: 'cardio' },
  { key: 'stretch',  label: 'Stretch',   category: 'stretching' },
];

function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch { return fallback; }
}
function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function ytUrl(name) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' proper form'); }
function toast(msg) { const t = document.createElement('div'); t.className = 't-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }

// Top-level modes: the gym DB browser + curated training catalogs (library-data.js)
const MODES = [
  { key: 'gym', label: '🏋️ Gym' },
  { key: 'calisthenics', label: '🤸 Calisthenics' },
  { key: 'hyrox', label: '🏃 Hyrox' },
  { key: 'home', label: '🏠 Home' },
  { key: 'swim', label: '🏊 Swim' },
  { key: 'boxing', label: '🥊 Boxing' },
  { key: 'muaythai', label: '🦵 Muay Thai' },
  { key: 'basketball', label: '🏀 Basketball' },
  { key: 'volleyball', label: '🏐 Volleyball' },
  { key: 'anatomy', label: '🧠 Anatomy' },
];

let db = [];
let mode = loadJSON('rtc_library_mode_v1', 'gym');
let group = 'all';
let query = '';
let shown = PAGE_SIZE;
let basket = loadJSON(BASKET_KEY, []);
let basketOpen = false;

const root = document.getElementById('lib-root');

async function loadDB() {
  try { const raw = localStorage.getItem(DB_CACHE_KEY); if (raw) { db = JSON.parse(raw); return; } } catch {}
  const res = await fetch(DB_URL, { cache: 'force-cache' });
  if (!res.ok) throw new Error('db fetch failed');
  db = await res.json();
  try { localStorage.setItem(DB_CACHE_KEY, JSON.stringify(db)); } catch {}
}

function inGroup(ex, g) {
  if (g.key === 'all') return true;
  if (g.category) return ex.category === g.category;
  const prim = ex.primaryMuscles || [];
  return prim.some((m) => g.muscles.includes(m));
}

function filtered() {
  const g = GROUPS.find((x) => x.key === group) || GROUPS[0];
  const q = query.trim().toLowerCase();
  return db.filter((ex) => {
    if (!inGroup(ex, g)) return false;
    if (!q) return true;
    return ex.name.toLowerCase().includes(q) ||
      (ex.equipment || '').toLowerCase().includes(q) ||
      (ex.primaryMuscles || []).some((m) => m.includes(q));
  });
}

function imgUrl(ex) { return ex.images && ex.images.length ? IMG_BASE_URL + ex.images[0] : null; }
function imgUrlById(dbId) {
  if (!dbId) return null;
  const ex = db.find((d) => d.id === dbId);
  return ex ? imgUrl(ex) : null;
}
function inBasket(id) { return basket.some((b) => b.dbId === id); }
function inBasketByName(name) { return basket.some((b) => b.name === name); }

// ============================================================
// Render
// ============================================================
function cardHTML(ex) {
  const url = imgUrl(ex);
  const added = inBasket(ex.id);
  const meta = [(ex.primaryMuscles || [])[0], ex.equipment].filter(Boolean).join(' · ');
  return `
    <div class="lib-card ${added ? 'added' : ''}" data-id="${esc(ex.id)}">
      <div class="lib-card-img">${url ? `<img src="${esc(url)}" loading="lazy" alt="" />` : '<span>🏋️</span>'}</div>
      <div class="lib-card-body">
        <div class="lib-card-name">${esc(ex.name)}</div>
        <div class="lib-card-meta">${esc(meta)}</div>
      </div>
      <div class="lib-card-actions">
        <a class="lib-card-video" href="${ytUrl(ex.name)}" target="_blank" rel="noopener" title="Video demo">📹</a>
        <button type="button" class="lib-card-add" data-id="${esc(ex.id)}">${added ? '✓' : '＋'}</button>
      </div>
    </div>`;
}

function basketHTML() {
  if (!basket.length) return '';
  const items = basket.map((b, i) => `
    <div class="lib-bk-item">
      <span class="lib-bk-name">${esc(b.name)}</span>
      <span class="lib-bk-sets">
        <button type="button" class="lib-bk-adj" data-i="${i}" data-d="-1">−</button>
        <b>${b.sets}×</b>
        <button type="button" class="lib-bk-adj" data-i="${i}" data-d="1">＋</button>
      </span>
      <button type="button" class="lib-bk-del" data-i="${i}" aria-label="Remove">✕</button>
    </div>`).join('');
  const sendRow = editing
    ? `<button type="button" class="ghost-btn gym-save-tracker" id="lib-bk-update">✓ Update workout</button>`
    : `<button type="button" class="ghost-btn gym-save-tracker" id="lib-bk-send-him">→ Alison 💪</button>
       <button type="button" class="ghost-btn gym-save-tracker lib-send-her" id="lib-bk-send-her">→ Darlene 💖</button>`;
  return `
    <div class="lib-basket ${basketOpen ? 'open' : ''}">
      <button type="button" class="lib-bk-head" id="lib-bk-toggle">
        🧺 ${editing ? `Editing “${esc(editing.name || 'Custom')}”` : 'Custom workout'} · ${basket.length} exercise${basket.length === 1 ? '' : 's'} <span class="lib-bk-caret">${basketOpen ? '▾' : '▴'}</span>
      </button>
      ${basketOpen ? `
        <div class="lib-bk-list">${items}</div>
        <div class="lib-bk-actions">
          <button type="button" class="ghost-btn ghost-btn-danger" id="lib-bk-clear">Clear</button>
          ${sendRow}
        </div>` : ''}
    </div>`;
}

// ---- curated training cards (library-data.js) ----
function curatedCardHTML(item) {
  const url = imgUrlById(item.img);
  const added = inBasketByName(item.name);
  return `
    <div class="lib-card lib-card-cur ${added ? 'added' : ''}">
      <div class="lib-card-img">${url ? `<img src="${esc(url)}" loading="lazy" alt="" />` : `<span>${item.icon || '🏋️'}</span>`}</div>
      <div class="lib-card-body">
        <div class="lib-card-name">${esc(item.name)} <span class="lib-cur-target">${esc(item.target || '')}</span></div>
        <div class="lib-card-meta">${esc(item.muscles || '')}${item.equip ? ` · ${esc(item.equip)}` : ''}</div>
        <div class="lib-cur-cues">✅ ${esc(item.cues || '')}</div>
        ${item.mistake ? `<div class="lib-cur-miss">⚠️ ${esc(item.mistake)}</div>` : ''}
        ${item.prog ? `<div class="lib-cur-prog">📈 ${esc(item.prog)}</div>` : ''}
      </div>
      <div class="lib-card-actions">
        <a class="lib-card-video" href="https://www.youtube.com/results?search_query=${item.video || encodeURIComponent(item.name)}" target="_blank" rel="noopener" title="Video demo">📹</a>
        <button type="button" class="lib-card-add lib-add-cur" data-name="${esc(item.name)}" data-img="${esc(item.img || '')}">${added ? '✓' : '＋'}</button>
      </div>
    </div>`;
}

function ladderHTML(ladder) {
  const url = imgUrlById(ladder.img);
  return `
    <div class="lib-ladder">
      <div class="lib-ladder-head">
        <div class="lib-card-img">${url ? `<img src="${esc(url)}" loading="lazy" alt="" />` : `<span>${ladder.icon || '🤸'}</span>`}</div>
        <div class="lib-ladder-info">
          <div class="lib-card-name">${esc(ladder.name)}</div>
          <div class="lib-card-meta">${esc(ladder.trains)}</div>
        </div>
        <a class="lib-card-video" href="https://www.youtube.com/results?search_query=${ladder.video}" target="_blank" rel="noopener">📹</a>
      </div>
      <div class="lib-ladder-steps">
        ${ladder.steps.map((s, i) => {
          const stepName = `${ladder.name.replace(' Ladder', '')} · ${s.name}`;
          const added = inBasketByName(stepName);
          return `
          <div class="lib-step ${added ? 'added' : ''}">
            <span class="lib-step-n">${i + 1}</span>
            <span class="lib-step-name">${esc(s.name)}</span>
            <span class="lib-step-std">${esc(s.std)}</span>
            <button type="button" class="lib-card-add lib-add-cur" data-name="${esc(stepName)}" data-img="${esc(ladder.img || '')}">${added ? '✓' : '＋'}</button>
          </div>`;
        }).join('')}
      </div>
      <div class="lib-ladder-rule">Hit the standard → next step (restart at 3×5). Can't get 3×5 → step down.</div>
    </div>`;
}

function trainingHTML(modKey) {
  const cat = (typeof LIB_TRAINING !== 'undefined') && LIB_TRAINING[modKey];
  if (!cat) return '<div class="lib-loading">Catalog unavailable.</div>';
  let body = `<div class="lib-blurb">${esc(cat.blurb)}</div>`;
  if (cat.ladders) body += cat.ladders.map(ladderHTML).join('');
  (cat.groups || []).forEach((g) => {
    body += `<div class="lib-group-title">${esc(g.title)}</div><div class="lib-grid">${g.items.map(curatedCardHTML).join('')}</div>`;
  });
  return body;
}

function anatomyHTML() {
  if (typeof LIB_ANATOMY === 'undefined') return '<div class="lib-loading">Catalog unavailable.</div>';
  return `
    <div class="lib-blurb">What each muscle does and how it adapts — the “why” behind every exercise in this library.</div>
    <div class="lib-group-title">Muscle map</div>
    <table class="race-rec-table lib-ana-table">
      <thead><tr><th>Muscle</th><th>Where</th><th>Does</th><th>Train it with</th></tr></thead>
      <tbody>${LIB_ANATOMY.muscles.map((m) => `<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.where)}</td><td>${esc(m.does)}</td><td>${esc(m.ex)}</td></tr>`).join('')}</tbody>
    </table>
    <div class="lib-group-title">Balance the pairs</div>
    ${LIB_ANATOMY.pairs.map(([p, why]) => `<div class="lib-ana-row"><b>${esc(p)}</b> — ${esc(why)}</div>`).join('')}
    <div class="lib-group-title">How muscle adapts</div>
    ${LIB_ANATOMY.adapt.map(([k, v]) => `<div class="lib-ana-row"><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}`;
}

function render() {
  const modeChips = `
    <div class="lib-chips lib-modes">
      ${MODES.map((m) => `<button type="button" class="lib-chip ${m.key === mode ? 'active' : ''}" data-mode="${m.key}">${m.label}</button>`).join('')}
    </div>`;

  let body = '';
  if (mode === 'gym') {
    const list = filtered();
    const page = list.slice(0, shown);
    body = `
      <input type="search" class="lib-search" id="lib-search" placeholder="Search ${db.length} exercises…" value="${esc(query)}" />
      <div class="lib-chips">
        ${GROUPS.map((g) => `<button type="button" class="lib-chip ${g.key === group ? 'active' : ''}" data-group="${g.key}">${g.label}</button>`).join('')}
      </div>
      <div class="lib-count">${list.length} exercise${list.length === 1 ? '' : 's'}</div>
      <div class="lib-grid">${page.map(cardHTML).join('')}</div>
      ${list.length > shown ? `<button type="button" class="ghost-btn lib-more" id="lib-more">Show more (${list.length - shown} left)</button>` : ''}`;
  } else if (mode === 'anatomy') {
    body = anatomyHTML();
  } else {
    body = trainingHTML(mode);
  }

  root.innerHTML = `${modeChips}${body}<div class="lib-basket-space"></div>${basketHTML()}`;
}

// ============================================================
// Basket + import
// ============================================================
function toggleAdd(id) {
  const i = basket.findIndex((b) => b.dbId === id);
  if (i >= 0) basket.splice(i, 1);
  else {
    const ex = db.find((d) => d.id === id);
    if (!ex) return;
    basket.push({ dbId: id, name: ex.name, sets: 3 });
  }
  saveJSON(BASKET_KEY, basket);
  render();
}

// Curated entries key by NAME (their dbId is only used to pin an image).
function toggleAddCurated(name, imgId) {
  const i = basket.findIndex((b) => b.name === name);
  if (i >= 0) basket.splice(i, 1);
  else basket.push({ dbId: imgId || null, name, sets: 3 });
  saveJSON(BASKET_KEY, basket);
  render();
}

function importToGym(person, existingId) {
  if (!basket.length) return;
  const store = loadJSON(CUSTOM_KEY, { him: [], her: [] });
  store.him = store.him || []; store.her = store.her || [];
  const exercises = basket.map((b) => ({ name: b.name, sets: b.sets, dbId: b.dbId || null }));

  let w = existingId ? store[person].find((x) => x.id === existingId) : null;
  if (w) {
    const name = prompt('Workout name:', w.name || 'Custom');
    if (name === null) return;
    w.name = (name.trim() || 'Custom').slice(0, 24);
    w.exercises = exercises;
  } else {
    const name = prompt('Name this workout:', 'Custom');
    if (name === null) return;
    w = { id: 'w' + Date.now().toString(36), name: (name.trim() || 'Custom').slice(0, 24), exercises };
    store[person].push(w);
  }
  saveJSON(CUSTOM_KEY, store);

  // Pin the exact image for each pick in the gym's override store (when known).
  const overrides = loadJSON(OVERRIDES_KEY, {});
  exercises.forEach((ex, i) => {
    const key = `${person}_cust_${w.id}_${i}`;
    if (ex.dbId) overrides[key] = ex.dbId; else delete overrides[key];
  });
  saveJSON(OVERRIDES_KEY, overrides);

  basket = []; saveJSON(BASKET_KEY, basket);
  const who = person === 'her' ? "Darlene's" : "Alison's";
  toast(`✓ ${existingId ? 'Updated' : 'Created'} “${w.name}” in ${who} Gym`);
  setTimeout(() => { location.href = person === 'her' ? 'gym-darlene.html' : 'gym-alison.html'; }, 1100);
}

// ============================================================
// Events (delegated)
// ============================================================
root.addEventListener('click', (e) => {
  const modeChip = e.target.closest('[data-mode]');
  if (modeChip) { mode = modeChip.dataset.mode; saveJSON('rtc_library_mode_v1', mode); shown = PAGE_SIZE; render(); return; }
  const chip = e.target.closest('.lib-chip[data-group]');
  if (chip) { group = chip.dataset.group; shown = PAGE_SIZE; render(); return; }
  const addCur = e.target.closest('.lib-add-cur');
  if (addCur) { toggleAddCurated(addCur.dataset.name, addCur.dataset.img); return; }
  const add = e.target.closest('.lib-card-add');
  if (add) { toggleAdd(add.dataset.id); return; }
  if (e.target.closest('#lib-more')) { shown += PAGE_SIZE; render(); return; }
  if (e.target.closest('#lib-bk-toggle')) { basketOpen = !basketOpen; render(); return; }
  if (e.target.closest('#lib-bk-clear')) {
    if (confirm('Clear the whole custom workout?')) { basket = []; saveJSON(BASKET_KEY, basket); render(); }
    return;
  }
  if (e.target.closest('#lib-bk-send-him')) { importToGym('him'); return; }
  if (e.target.closest('#lib-bk-send-her')) { importToGym('her'); return; }
  if (e.target.closest('#lib-bk-update')) { importToGym(editing.person, editing.id); return; }
  const adj = e.target.closest('.lib-bk-adj');
  if (adj) {
    const b = basket[Number(adj.dataset.i)];
    if (b) { b.sets = Math.max(1, Math.min(6, b.sets + parseInt(adj.dataset.d, 10))); saveJSON(BASKET_KEY, basket); render(); }
    return;
  }
  const del = e.target.closest('.lib-bk-del');
  if (del) { basket.splice(Number(del.dataset.i), 1); saveJSON(BASKET_KEY, basket); render(); return; }
});

let searchTimer = null;
root.addEventListener('input', (e) => {
  if (e.target.id !== 'lib-search') return;
  query = e.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    shown = PAGE_SIZE;
    const hadFocus = document.activeElement === e.target;
    const pos = e.target.selectionStart;
    render();
    if (hadFocus) {
      const s = document.getElementById('lib-search');
      if (s) { s.focus(); try { s.setSelectionRange(pos, pos); } catch {} }
    }
  }, 250);
});

// ============================================================
// Init
// ============================================================
loadDB().then(() => {
  // Edit mode: load the target workout into the basket (replacing it) so the
  // user can add/remove/re-order, then "Update workout" writes it back.
  if (editing) {
    const store = loadJSON(CUSTOM_KEY, { him: [], her: [] });
    const w = (store[editing.person] || []).find((x) => x.id === editing.id);
    if (w) {
      editing.name = w.name;
      basket = w.exercises.map((ex) => ({ dbId: ex.dbId || null, name: ex.name, sets: ex.sets || 3 }));
      saveJSON(BASKET_KEY, basket);
      basketOpen = true;
    } else {
      editing = null;
    }
  }
  render();
}).catch(() => {
  root.innerHTML = '<div class="lib-loading">Could not load the exercise database — check your connection and reload.</div>';
});
