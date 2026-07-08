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
const CUSTOM_KEY   = 'rtc_custom_gym_him_v1';
const OVERRIDES_KEY = 'rtc_gym_image_overrides_v1';

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

let db = [];
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
function inBasket(id) { return basket.some((b) => b.dbId === id); }

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
  return `
    <div class="lib-basket ${basketOpen ? 'open' : ''}">
      <button type="button" class="lib-bk-head" id="lib-bk-toggle">
        🧺 Custom workout · ${basket.length} exercise${basket.length === 1 ? '' : 's'} <span class="lib-bk-caret">${basketOpen ? '▾' : '▴'}</span>
      </button>
      ${basketOpen ? `
        <div class="lib-bk-list">${items}</div>
        <div class="lib-bk-actions">
          <button type="button" class="ghost-btn ghost-btn-danger" id="lib-bk-clear">Clear</button>
          <button type="button" class="ghost-btn gym-save-tracker" id="lib-bk-send">Send to Alison's Gym</button>
        </div>` : ''}
    </div>`;
}

function render() {
  const list = filtered();
  const page = list.slice(0, shown);
  root.innerHTML = `
    <input type="search" class="lib-search" id="lib-search" placeholder="Search ${db.length} exercises…" value="${esc(query)}" />
    <div class="lib-chips">
      ${GROUPS.map((g) => `<button type="button" class="lib-chip ${g.key === group ? 'active' : ''}" data-group="${g.key}">${g.label}</button>`).join('')}
    </div>
    <div class="lib-count">${list.length} exercise${list.length === 1 ? '' : 's'}</div>
    <div class="lib-grid">${page.map(cardHTML).join('')}</div>
    ${list.length > shown ? `<button type="button" class="ghost-btn lib-more" id="lib-more">Show more (${list.length - shown} left)</button>` : ''}
    <div class="lib-basket-space"></div>
    ${basketHTML()}`;
  const search = document.getElementById('lib-search');
  // keep focus in the search box across re-renders while typing
  if (query && search && document.activeElement === document.body) { /* no-op */ }
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

function importToGym() {
  if (!basket.length) return;
  const custom = {
    updated: new Date().toISOString().slice(0, 10),
    exercises: basket.map((b) => ({ name: b.name, sets: b.sets, dbId: b.dbId })),
  };
  saveJSON(CUSTOM_KEY, custom);
  // Pin the exact image for each pick in the gym's override store.
  const overrides = loadJSON(OVERRIDES_KEY, {});
  basket.forEach((b, i) => { overrides['him_cust_' + i] = b.dbId; });
  saveJSON(OVERRIDES_KEY, overrides);
  toast(`✓ Sent ${basket.length} exercises — open Alison's Gym → Custom`);
  setTimeout(() => { location.href = 'gym-alison.html'; }, 1200);
}

// ============================================================
// Events (delegated)
// ============================================================
root.addEventListener('click', (e) => {
  const chip = e.target.closest('.lib-chip');
  if (chip) { group = chip.dataset.group; shown = PAGE_SIZE; render(); return; }
  const add = e.target.closest('.lib-card-add');
  if (add) { toggleAdd(add.dataset.id); return; }
  if (e.target.closest('#lib-more')) { shown += PAGE_SIZE; render(); return; }
  if (e.target.closest('#lib-bk-toggle')) { basketOpen = !basketOpen; render(); return; }
  if (e.target.closest('#lib-bk-clear')) {
    if (confirm('Clear the whole custom workout?')) { basket = []; saveJSON(BASKET_KEY, basket); render(); }
    return;
  }
  if (e.target.closest('#lib-bk-send')) { importToGym(); return; }
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
loadDB().then(render).catch(() => {
  root.innerHTML = '<div class="lib-loading">Could not load the exercise database — check your connection and reload.</div>';
});
