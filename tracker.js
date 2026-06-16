// ============================================================
// Meal Reference — mirrors the Tracker.xlsx "Meal Reference" sheet
// (Don't edit unless the source plan changes)
// ============================================================
const MEAL_REF = {
  // Dar's nutritionist plan (2026-06-10) — current active plan
  'Dar-Breakfast': { name: 'Egg & Cottage Cheese Toast + Pear + Chia',  group: 'Diet Plan', himKcal: 767, himP: 44, herKcal: 562, herP: 35 },
  'Dar-Snack':     { name: 'Banana Protein Smoothie',                   group: 'Diet Plan', himKcal: 227, himP: 31, herKcal: 227, herP: 31 },
  'Dar-Evening':   { name: 'Greek Yogurt + Flaxseed (evening)',         group: 'Diet Plan', himKcal: 307, himP: 22, herKcal: 207, herP: 13 },
  'Dar-LunchA':    { name: 'Chicken & Rice Plate (Mon–Wed lunch)',      group: 'Diet Plan', himKcal: 879, himP: 76, herKcal: 630, herP: 57 },
  'Dar-DinnerA':   { name: 'Shredded Chicken Wrap (Mon–Wed dinner)',    group: 'Diet Plan', himKcal: 660, himP: 60, herKcal: 478, herP: 43 },
  'Dar-LunchB':    { name: 'Lean Beef & Rice Plate (Thu–Sun lunch)',    group: 'Diet Plan', himKcal: 920, himP: 58, herKcal: 574, herP: 33 },
  'Dar-DinnerB':   { name: 'Lean Beef Wrap (Thu–Sun dinner)',           group: 'Diet Plan', himKcal: 640, himP: 42, herKcal: 418, herP: 23 },

  'Fixed-Breakfast-A':  { name: 'His: eggs+oats+banana / Her: overnight oats',     group: 'Daily', himKcal: 700, himP: 45, herKcal: 500, herP: 25 },
  'Fixed-Breakfast-B':  { name: 'His: toast+PB+banana+4 eggs / Her: toast+PB+2 eggs', group: 'Daily', himKcal: 750, himP: 45, herKcal: 510, herP: 22 },
  'Fixed-MidMorning':   { name: 'Her: hard-boiled egg + apple + almonds',         group: 'Daily', himKcal:   0, himP:  0, herKcal: 250, herP: 10 },
  'Fixed-PreWorkout':   { name: 'Him: whey + banana shake',                       group: 'Daily', himKcal: 300, himP: 25, herKcal:   0, herP:  0 },
  'Fixed-Afternoon':    { name: 'Her: Greek yogurt + berries + honey',            group: 'Daily', himKcal:   0, himP:  0, herKcal: 250, herP: 18 },
  'Fixed-PreBed':       { name: 'Him: yogurt or whey + almonds',                  group: 'Daily', himKcal: 300, himP: 25, herKcal:   0, herP:  0 },
  'Fixed-Evening':      { name: 'Her: cottage cheese or nuts + fruit',            group: 'Daily', himKcal:   0, himP:  0, herKcal: 150, herP:  8 },

  'A-Lunch1':  { name: 'Med. Pulled Chicken & Rice',           group: 'Week A', himKcal: 750, himP: 55, herKcal: 520, herP: 30 },
  'A-Lunch2':  { name: 'Turkey Patty Taco Bowl',               group: 'Week A', himKcal: 740, himP: 50, herKcal: 530, herP: 27 },
  'A-Dinner1': { name: 'Cumin-Lime Beef Bowl',                 group: 'Week A', himKcal: 750, himP: 50, herKcal: 530, herP: 28 },
  'A-Dinner2': { name: 'Sheet-Pan Chicken Thighs & Roots',     group: 'Week A', himKcal: 740, himP: 45, herKcal: 550, herP: 25 },

  'B-Lunch1':  { name: 'Greek Lemon Chicken & Quinoa',         group: 'Week B', himKcal: 750, himP: 55, herKcal: 530, herP: 30 },
  'B-Lunch2':  { name: 'Asian Beef Skewers & Rice',            group: 'Week B', himKcal: 760, himP: 52, herKcal: 540, herP: 28 },
  'B-Dinner1': { name: 'Italian Meatballs & Polenta',          group: 'Week B', himKcal: 750, himP: 46, herKcal: 560, herP: 27 },
  'B-Dinner2': { name: 'Sheet-Pan Pork Tenderloin & Roots',    group: 'Week B', himKcal: 760, himP: 48, herKcal: 560, herP: 27 },

  'C-Lunch1':  { name: 'Moroccan Chicken & Couscous',          group: 'Week C', himKcal: 750, himP: 55, herKcal: 530, herP: 30 },
  'C-Lunch2':  { name: 'Tikka Chicken & Basmati',              group: 'Week C', himKcal: 750, himP: 53, herKcal: 530, herP: 29 },
  'C-Dinner1': { name: 'Moroccan Beef Tagine',                 group: 'Week C', himKcal: 760, himP: 48, herKcal: 560, herP: 27 },
  'C-Dinner2': { name: 'Butter Chicken & Basmati',             group: 'Week C', himKcal: 750, himP: 46, herKcal: 550, herP: 26 },

  'D-Lunch1':  { name: 'Cuban Pulled Pork & Rice',             group: 'Week D', himKcal: 760, himP: 52, herKcal: 540, herP: 28 },
  'D-Lunch2':  { name: 'Cajun Chicken & Dirty Rice',           group: 'Week D', himKcal: 740, himP: 52, herKcal: 530, herP: 28 },
  'D-Dinner1': { name: 'BBQ Pulled Chicken & Potatoes',        group: 'Week D', himKcal: 750, himP: 50, herKcal: 550, herP: 28 },
  'D-Dinner2': { name: 'Turkey Chili & Corn',                  group: 'Week D', himKcal: 760, himP: 50, herKcal: 560, herP: 27 },

  'Sat-Steak':       { name: 'Grilled Ribeye & Baked Potato',  group: 'Weekend', himKcal: 850, himP: 55, herKcal: 680, herP: 38 },
  'Sat-Bolognese':   { name: 'Bolognese & Pasta',              group: 'Weekend', himKcal: 870, himP: 52, herKcal: 680, herP: 36 },
  'Sun-BigBreakfast':{ name: 'Eggs, Bacon, Avocado Toast',     group: 'Weekend', himKcal: 800, himP: 45, herKcal: 620, herP: 32 },
  'Sun-Pancakes':    { name: 'Oat Pancakes & Berry Compote',   group: 'Weekend', himKcal: 780, himP: 50, herKcal: 620, herP: 36 },
  'SatL-Scramble':   { name: 'Veggie scramble + sourdough',    group: 'Weekend', himKcal: 550, himP: 30, herKcal: 400, herP: 20 },
  'SatL-TunaSalad':  { name: 'Tuna or chicken salad bowl',     group: 'Weekend', himKcal: 450, himP: 40, herKcal: 350, herP: 28 },
  'SatL-EggsBacon':  { name: 'Big eggs + bacon (Sat lunch)',   group: 'Weekend', himKcal: 600, himP: 28, herKcal: 450, herP: 20 },
  'SatL-YogurtBowl': { name: 'Greek yogurt + granola + berries', group: 'Weekend', himKcal: 450, himP: 30, herKcal: 350, herP: 22 },
  'SunD-Leftover':   { name: 'Sat Bolognese leftovers',        group: 'Weekend', himKcal: 700, himP: 40, herKcal: 550, herP: 28 },
  'SunD-MonEarly':   { name: 'Eat Mon prep a day early',       group: 'Weekend', himKcal: 750, himP: 50, herKcal: 580, herP: 33 },
  'SunD-Board':      { name: 'Antipasto board',                group: 'Weekend', himKcal: 500, himP: 35, herKcal: 400, herP: 25 },
  'SunD-ChickenPlate':{ name: 'Simple chicken & greens plate', group: 'Weekend', himKcal: 450, himP: 30, herKcal: 350, herP: 22 },

  'Shake-HimCoffee': { name: 'Whey + 150ml cashew milk (him)', group: 'Flex',    himKcal: 150, himP: 25, herKcal:   0, herP:  0 },
  'Shake-HerYogurt': { name: 'Whey + 200g lactose-free yogurt (her)', group: 'Flex', himKcal: 0, himP: 0, herKcal: 240, herP: 43 },
};

const MEAL_SLOTS = ['Breakfast', 'Mid-morning', 'Pre-workout', 'Lunch', 'Afternoon', 'Dinner', 'Pre-bed', 'Flex'];

const BODY_KEY     = 'rtc_tracker_body_v1';
const MEAL_KEY     = 'rtc_tracker_meals_v1';
const TRAINING_KEY = 'rtc_tracker_training_v1';

// ============================================================
// Storage helpers
// ============================================================
function loadArr(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
}
function saveArr(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
}
function append(key, item) {
  const arr = loadArr(key);
  arr.push(item);
  saveArr(key, arr);
  return arr;
}
function removeById(key, id) {
  const arr = loadArr(key).filter((x) => x.id !== id);
  saveArr(key, arr);
  return arr;
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================================
// Photo storage — IndexedDB so we don't blow the localStorage cap
// ============================================================
const PHOTO_DB = 'rtc_tracker_db';
const PHOTO_STORE = 'photos';
let dbPromise = null;

function openPhotoDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(PHOTO_DB, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        const store = db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
        store.createIndex('entryId', 'entryId', { unique: false });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
  return dbPromise;
}

async function dbSavePhoto(id, blob, entryId) {
  const db = await openPhotoDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put({ id, blob, entryId, createdAt: Date.now() });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function dbGetPhoto(id) {
  const db = await openPhotoDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(PHOTO_STORE, 'readonly');
    const req = tx.objectStore(PHOTO_STORE).get(id);
    req.onsuccess = () => res(req.result ? req.result.blob : null);
    req.onerror = () => rej(req.error);
  });
}

async function dbDeletePhotosForEntry(entryId) {
  const db = await openPhotoDB();
  return new Promise((res) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);
    const idx = store.index('entryId');
    const req = idx.openCursor(IDBKeyRange.only(entryId));
    req.onsuccess = (e) => {
      const cur = e.target.result;
      if (cur) { cur.delete(); cur.continue(); }
      else res();
    };
    req.onerror = () => res();
  });
}

async function compressImage(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Compression failed'));
      }, 'image/jpeg', quality);
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// ============================================================
// Tab switching
// ============================================================
const TAB_KEY = 'rtc_tracker_tab_v1';
let currentTab = localStorage.getItem(TAB_KEY) || 'body';

function switchTab(name) {
  currentTab = name;
  try { localStorage.setItem(TAB_KEY, name); } catch (e) {}
  document.querySelectorAll('.t-tab').forEach((t) =>
    t.classList.toggle('active', t.dataset.tab === name)
  );
  document.querySelectorAll('.t-tab-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.tab === name)
  );
}

document.querySelectorAll('.t-tab-btn').forEach((b) => {
  b.addEventListener('click', () => switchTab(b.dataset.tab));
});

// ============================================================
// Body Log
// ============================================================
const bodyForm    = document.getElementById('body-form');
const bodyList    = document.getElementById('body-entries');
const bodyDate    = document.getElementById('body-date');
const bodyPerson  = document.getElementById('body-person');
const photoBtn    = document.getElementById('body-photo-btn');
const photoInput  = document.getElementById('body-photo-input');
const photoPreview= document.getElementById('body-photo-preview');

bodyDate.value = todayISO();

// Pending photo blobs for the current draft (compressed, ready to save)
let pendingPhotos = []; // [{ id, blob, previewUrl }]

function renderPhotoPreview() {
  photoPreview.innerHTML = '';
  pendingPhotos.forEach((p) => {
    const wrap = document.createElement('div');
    wrap.className = 't-photo-thumb';
    const img = document.createElement('img');
    img.src = p.previewUrl;
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 't-photo-rm';
    rm.textContent = '×';
    rm.addEventListener('click', () => {
      URL.revokeObjectURL(p.previewUrl);
      pendingPhotos = pendingPhotos.filter((x) => x.id !== p.id);
      renderPhotoPreview();
    });
    wrap.appendChild(img);
    wrap.appendChild(rm);
    photoPreview.appendChild(wrap);
  });
}

photoBtn.addEventListener('click', () => photoInput.click());

photoInput.addEventListener('change', async () => {
  const files = Array.from(photoInput.files || []);
  if (!files.length) return;
  photoBtn.disabled = true;
  photoBtn.textContent = 'Compressing…';
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const blob = await compressImage(file);
      pendingPhotos.push({
        id: uid(),
        blob,
        previewUrl: URL.createObjectURL(blob),
      });
    } catch (e) {
      console.warn('compress failed', e);
    }
  }
  photoBtn.disabled = false;
  photoBtn.textContent = '＋ Add photos';
  photoInput.value = '';
  renderPhotoPreview();
});

async function renderEntryPhotos(entry) {
  if (!entry.photoIds || !entry.photoIds.length) {
    if (entry.photos) return '<div class="t-entry-photos">📸 4-angle photos taken</div>';
    return '';
  }
  const cells = entry.photoIds.map((pid) =>
    `<div class="t-photo-cell" data-photo-id="${esc(pid)}" data-entry-id="${esc(entry.id)}"><div class="t-photo-loading">…</div></div>`
  ).join('');
  return `<div class="t-entry-photos-grid">${cells}</div>`;
}

async function hydratePhotoCells(container) {
  const cells = container.querySelectorAll('.t-photo-cell[data-photo-id]');
  for (const cell of cells) {
    const pid = cell.dataset.photoId;
    try {
      const blob = await dbGetPhoto(pid);
      if (!blob) { cell.innerHTML = '<div class="t-photo-missing">missing</div>'; continue; }
      const url = URL.createObjectURL(blob);
      cell.innerHTML = `<img src="${url}" loading="lazy" />`;
      cell.querySelector('img').addEventListener('click', () => openPhotoLightbox(url));
    } catch (e) {
      cell.innerHTML = '<div class="t-photo-missing">err</div>';
    }
  }
}

function openPhotoLightbox(url) {
  let box = document.getElementById('t-lightbox');
  if (!box) {
    box = document.createElement('div');
    box.id = 't-lightbox';
    box.className = 't-lightbox';
    box.innerHTML = '<img /><button type="button" class="t-lightbox-close" aria-label="Close">×</button>';
    box.addEventListener('click', () => { box.hidden = true; });
    document.body.appendChild(box);
  }
  box.querySelector('img').src = url;
  box.hidden = false;
}

async function renderBody() {
  const entries = loadArr(BODY_KEY).sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) {
    bodyList.innerHTML = '<p class="t-empty">No body entries yet. Log your first measurement above.</p>';
    return;
  }
  const blocks = await Promise.all(entries.map(async (e) => {
    const photosHTML = await renderEntryPhotos(e);
    return `
      <div class="t-entry t-entry-${e.person}">
        <div class="t-entry-head">
          <div>
            <span class="t-chip t-chip-${e.person}">${e.person === 'him' ? 'ALI' : 'DAR'}</span>
            <strong>${esc(formatDate(e.date))}</strong>
            <span class="t-entry-weight">${esc(e.weight)} kg</span>
          </div>
          <button class="t-del" data-id="${esc(e.id)}" data-kind="body" aria-label="Delete">✕</button>
        </div>
        <div class="t-entry-grid">
          ${e.waist  ? `<div><span>Waist</span><b>${esc(e.waist)}</b></div>` : ''}
          ${e.chest  ? `<div><span>Chest</span><b>${esc(e.chest)}</b></div>` : ''}
          ${e.hips   ? `<div><span>Hips</span><b>${esc(e.hips)}</b></div>` : ''}
          ${e.bicepL ? `<div><span>Bicep L</span><b>${esc(e.bicepL)}</b></div>` : ''}
          ${e.bicepR ? `<div><span>Bicep R</span><b>${esc(e.bicepR)}</b></div>` : ''}
          ${e.thighL ? `<div><span>Thigh L</span><b>${esc(e.thighL)}</b></div>` : ''}
          ${e.thighR ? `<div><span>Thigh R</span><b>${esc(e.thighR)}</b></div>` : ''}
          ${e.rhr    ? `<div><span>RHR</span><b>${esc(e.rhr)}</b></div>` : ''}
        </div>
        ${e.notes ? `<div class="t-entry-notes">${esc(e.notes)}</div>` : ''}
        ${photosHTML}
      </div>
    `;
  }));
  bodyList.innerHTML = blocks.join('');
  hydratePhotoCells(bodyList);
}

bodyForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = new FormData(bodyForm);
  const num = (k) => {
    const v = f.get(k);
    return v && v.toString().trim() ? Number(v) : null;
  };
  const entry = {
    id: uid(),
    date: f.get('date'),
    person: f.get('person'),
    weight: num('weight'),
    waist:  num('waist'),
    chest:  num('chest'),
    hips:   num('hips'),
    bicepL: num('bicepL'),
    bicepR: num('bicepR'),
    thighL: num('thighL'),
    thighR: num('thighR'),
    rhr:    num('rhr'),
    photos: f.get('photos') === 'on',
    photoIds: pendingPhotos.map((p) => p.id),
    notes:  (f.get('notes') || '').toString().trim(),
  };
  if (!entry.date || !entry.weight) {
    alert('Date and weight are required.');
    return;
  }

  // Persist photo blobs to IndexedDB first
  for (const p of pendingPhotos) {
    try { await dbSavePhoto(p.id, p.blob, entry.id); }
    catch (e) { console.warn('photo save failed', e); }
    URL.revokeObjectURL(p.previewUrl);
  }
  pendingPhotos = [];
  renderPhotoPreview();

  append(BODY_KEY, entry);
  bodyForm.reset();
  bodyDate.value = todayISO();
  bodyPerson.value = entry.person;
  renderBody();
  renderSummary();
});

// ============================================================
// Meal Log
// ============================================================
const mealForm    = document.getElementById('meal-form');
const mealDate    = document.getElementById('meal-date');
const mealSlot    = document.getElementById('meal-slot');
const mealKeySel  = document.getElementById('meal-key');
const mealEntries = document.getElementById('meal-entries');
const mealTotals  = document.getElementById('today-totals');

mealDate.value = todayISO();
MEAL_SLOTS.forEach((s) => {
  const o = document.createElement('option');
  o.value = s; o.textContent = s;
  mealSlot.appendChild(o);
});

// Group meals by group, ordered Daily → Week A/B/C/D → Weekend → Flex
const GROUP_ORDER = ['Daily', 'Week A', 'Week B', 'Week C', 'Week D', 'Weekend', 'Flex'];
GROUP_ORDER.forEach((g) => {
  const grp = document.createElement('optgroup');
  grp.label = g;
  Object.entries(MEAL_REF)
    .filter(([, v]) => v.group === g)
    .forEach(([k, v]) => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = `${k} — ${v.name}`;
      grp.appendChild(o);
    });
  mealKeySel.appendChild(grp);
});

// Lookup helper: prefer the entry's inline macros (custom recipe entries),
// otherwise fall back to MEAL_REF for canonical meal codes.
function macrosFor(m) {
  if (m.customName) {
    return {
      name: m.customName,
      himKcal: Number(m.himKcal) || 0,
      himP:    Number(m.himP)    || 0,
      herKcal: Number(m.herKcal) || 0,
      herP:    Number(m.herP)    || 0,
    };
  }
  return MEAL_REF[m.mealKey] || { name: m.mealKey, himKcal: 0, himP: 0, herKcal: 0, herP: 0 };
}

function renderMeals() {
  const all = loadArr(MEAL_KEY).sort((a, b) => b.date.localeCompare(a.date));
  const today = todayISO();
  const todays = all.filter((m) => m.date === today);

  // Today's totals
  let hKcal = 0, hP = 0, rKcal = 0, rP = 0;
  todays.forEach((m) => {
    const ref = macrosFor(m);
    hKcal += ref.himKcal; hP += ref.himP;
    rKcal += ref.herKcal; rP += ref.herP;
  });
  mealTotals.innerHTML = `
    <div class="t-totals">
      <div class="t-totals-head">Today (${esc(formatDate(today))})</div>
      <div class="t-totals-grid">
        <div class="t-total-block t-him"><span>Him</span><b>${hKcal} kcal</b><em>${hP}g protein</em></div>
        <div class="t-total-block t-her"><span>Her</span><b>${rKcal} kcal</b><em>${rP}g protein</em></div>
      </div>
    </div>
  `;

  if (!all.length) {
    mealEntries.innerHTML = '<p class="t-empty">No meals logged yet.</p>';
    return;
  }
  mealEntries.innerHTML = all.slice(0, 30).map((m) => {
    const ref = macrosFor(m);
    return `
      <div class="t-entry">
        <div class="t-entry-head">
          <div>
            <span class="t-chip t-chip-slot">${esc(m.slot)}</span>
            <strong>${esc(formatDate(m.date))}</strong>
            <span class="t-entry-meal">${esc(ref.name)}</span>
          </div>
          <button class="t-del" data-id="${esc(m.id)}" data-kind="meal" aria-label="Delete">✕</button>
        </div>
        <div class="t-entry-grid">
          <div><span>Him kcal</span><b>${ref.himKcal}</b></div>
          <div><span>Him P</span><b>${ref.himP}g</b></div>
          <div><span>Her kcal</span><b>${ref.herKcal}</b></div>
          <div><span>Her P</span><b>${ref.herP}g</b></div>
        </div>
        ${m.notes ? `<div class="t-entry-notes">${esc(m.notes)}</div>` : ''}
      </div>
    `;
  }).join('');
}

mealForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const f = new FormData(mealForm);
  const entry = {
    id: uid(),
    date: f.get('date'),
    slot: f.get('slot'),
    mealKey: f.get('mealKey'),
    notes: (f.get('notes') || '').toString().trim(),
  };
  if (!entry.date || !entry.mealKey) {
    alert('Date and meal are required.');
    return;
  }
  append(MEAL_KEY, entry);
  mealForm.reset();
  mealDate.value = todayISO();
  renderMeals();
  renderSummary();
});

// ============================================================
// Training History (read-only; written by Gym pages)
// ============================================================
const trainList = document.getElementById('training-entries');

function renderTraining() {
  const entries = loadArr(TRAINING_KEY).sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) {
    trainList.innerHTML = '<p class="t-empty">No training sessions yet. Tap <b>Save to Tracker</b> on a Gym page after a workout to log it here.</p>';
    return;
  }
  trainList.innerHTML = entries.map((s) => {
    const setsHtml = (s.exercises || []).map((ex) => {
      const setStr = (ex.sets || [])
        .filter((x) => x.w || x.r)
        .map((x) => `${x.w || '?'}×${x.r || '?'}`)
        .join(' · ') || '<em>(no data)</em>';
      return `
        <li>
          <div class="t-train-ex">
            <span class="${ex.done ? 't-done' : ''}">${ex.done ? '✓ ' : '○ '}${esc(ex.name)}</span>
            <span class="t-train-sets">${setStr}</span>
          </div>
        </li>
      `;
    }).join('');
    return `
      <div class="t-entry t-entry-${s.person}">
        <div class="t-entry-head">
          <div>
            <span class="t-chip t-chip-${s.person}">${s.person === 'him' ? 'ALI' : 'DAR'}</span>
            <strong>${esc(formatDate(s.date))}</strong>
            <span class="t-entry-meal">${esc(s.dayLabel || s.day)}</span>
          </div>
          <button class="t-del" data-id="${esc(s.id)}" data-kind="training" aria-label="Delete">✕</button>
        </div>
        <ul class="t-train-list">${setsHtml}</ul>
      </div>
    `;
  }).join('');
}

// ============================================================
// Weekly Summary
// ============================================================
const summaryBox = document.getElementById('summary-table');

function isoWeek(iso) {
  // ISO week number (1..53) — used as a stable grouping key
  const d = new Date(iso + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return d.getFullYear() + '-W' + String(1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)).padStart(2, '0');
}

function renderSummary() {
  const body = loadArr(BODY_KEY);
  const meals = loadArr(MEAL_KEY);
  const trains = loadArr(TRAINING_KEY);

  // Build a map: week -> { him: latest body entry, her: latest body entry, meals: count, trainHim: count, trainHer: count }
  const weeks = {};
  function ensure(w) {
    if (!weeks[w]) weeks[w] = { week: w, himW: null, herW: null, meals: 0, trainHim: 0, trainHer: 0 };
    return weeks[w];
  }

  body.forEach((e) => {
    const w = ensure(isoWeek(e.date));
    if (e.person === 'him') w.himW = e.weight;
    else w.herW = e.weight;
  });
  meals.forEach((m) => { ensure(isoWeek(m.date)).meals++; });
  trains.forEach((t) => {
    const w = ensure(isoWeek(t.date));
    if (t.person === 'him') w.trainHim++; else w.trainHer++;
  });

  const sorted = Object.values(weeks).sort((a, b) => b.week.localeCompare(a.week));

  if (!sorted.length) {
    summaryBox.innerHTML = '<p class="t-empty">No data yet. Once you log body measurements, meals, or training sessions, weekly roll-ups appear here.</p>';
    return;
  }

  // Compute deltas vs. NEXT (older) week
  const rows = sorted.map((w, i) => {
    const older = sorted[i + 1];
    const himDelta = (w.himW != null && older && older.himW != null)
      ? (w.himW - older.himW).toFixed(1) : null;
    const herDelta = (w.herW != null && older && older.herW != null)
      ? (w.herW - older.herW).toFixed(1) : null;
    return { ...w, himDelta, herDelta };
  });

  summaryBox.innerHTML = `
    <table class="t-summary-table">
      <thead>
        <tr>
          <th>Week</th><th>Him kg</th><th>Δ</th><th>Her kg</th><th>Δ</th>
          <th>Sessions</th><th>Meals</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r) => `
          <tr>
            <td>${esc(r.week)}</td>
            <td>${r.himW != null ? esc(r.himW) : '—'}</td>
            <td class="${r.himDelta && r.himDelta > 0 ? 't-up' : (r.himDelta && r.himDelta < 0 ? 't-down' : '')}">${r.himDelta != null ? (r.himDelta > 0 ? '+' : '') + r.himDelta : '—'}</td>
            <td>${r.herW != null ? esc(r.herW) : '—'}</td>
            <td class="${r.herDelta && r.herDelta > 0 ? 't-up' : (r.herDelta && r.herDelta < 0 ? 't-down' : '')}">${r.herDelta != null ? (r.herDelta > 0 ? '+' : '') + r.herDelta : '—'}</td>
            <td>${r.trainHim + r.trainHer}<small>(${r.trainHim}A / ${r.trainHer}D)</small></td>
            <td>${r.meals} <small>/35</small></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============================================================
// PRs (auto from training history)
// ============================================================
const prsBox = document.getElementById('prs-content');

function renderPRs() {
  const trains = loadArr(TRAINING_KEY);
  if (!trains.length) {
    prsBox.innerHTML = '<p class="t-empty">No PRs yet. Once gym sessions are saved here, top weights appear automatically.</p>';
    return;
  }
  // Walk through all sessions; for each (person, exerciseName), track top weight + date + reps
  const prs = { him: {}, her: {} };
  trains.forEach((t) => {
    (t.exercises || []).forEach((ex) => {
      (ex.sets || []).forEach((s) => {
        const w = Number(s.w);
        const r = Number(s.r);
        if (!w || !r) return;
        const map = prs[t.person] || (prs[t.person] = {});
        const existing = map[ex.name];
        if (!existing || w > existing.weight) {
          map[ex.name] = { weight: w, reps: r, date: t.date };
        }
      });
    });
  });

  function tableFor(person) {
    const entries = Object.entries(prs[person] || {}).sort(([, a], [, b]) => b.weight - a.weight);
    if (!entries.length) return `<p class="t-empty">No ${person === 'him' ? "Alison's" : "Darlene's"} PRs yet.</p>`;
    return `
      <table class="t-pr-table">
        <thead><tr><th>Exercise</th><th>Top kg</th><th>Reps</th><th>Date</th></tr></thead>
        <tbody>
          ${entries.map(([name, p]) => `
            <tr>
              <td>${esc(name)}</td>
              <td><b>${esc(p.weight)}</b></td>
              <td>${esc(p.reps)}</td>
              <td>${esc(formatDate(p.date))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  prsBox.innerHTML = `
    <h3 class="t-pr-h3"><span class="t-chip t-chip-him">ALI</span> Alison</h3>
    ${tableFor('him')}
    <h3 class="t-pr-h3"><span class="t-chip t-chip-her">DAR</span> Darlene</h3>
    ${tableFor('her')}
    <p class="t-pr-note">Reminder: during pregnancy, the goal is consistency at RPE 6-7 — not PRs.</p>
  `;
}

// ============================================================
// Delete handler (delegated)
// ============================================================
document.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('.t-del');
  if (!btn) return;
  if (!confirm('Delete this entry?')) return;
  const id = btn.dataset.id;
  const kind = btn.dataset.kind;
  const key = kind === 'body' ? BODY_KEY : kind === 'meal' ? MEAL_KEY : TRAINING_KEY;
  if (kind === 'body') {
    try { await dbDeletePhotosForEntry(id); } catch (e) {}
  }
  removeById(key, id);
  renderAll();
});

// ============================================================
// Init
// ============================================================
function renderAll() {
  renderBody();
  renderMeals();
  renderTraining();
  renderSummary();
  renderPRs();
}

switchTab(currentTab);
renderAll();

// Re-render meals when navigating back (today might have changed)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') renderMeals();
});
