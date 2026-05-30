// Supabase sync engine.
//
// Strategy:
//   1. Monkey-patch localStorage.setItem so any write to a synced key triggers
//      a debounced push.
//   2. Each push diffs the new value against a "shadow" (last successfully
//      synced value, stored under rtc_sync_shadow_<key>) and upserts only the
//      changed records — never the whole collection blindly. This protects
//      against stale-state overwrites when both phones are open.
//   3. On init() we pull every synced table once, merge with whatever's in
//      local, then push any local-only items (first-run migration).
//   4. Photos are intentionally NOT synced in this PR — they stay in
//      IndexedDB on the device. Moving them to Supabase Storage is PR 3.

import { supabase } from './supabase-client.js';

const SHADOW_PREFIX = 'rtc_sync_shadow_';
const PUSH_DEBOUNCE_MS = 500;

let userId = null;
let suppressed = false;
let initialized = false;
const pushTimers = new Map();

function withSuppressed(fn) {
  const prev = suppressed;
  suppressed = true;
  try { return fn(); } finally { suppressed = prev; }
}

function numOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function readJson(key, fallback) {
  try { return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function shadowKey(k) { return SHADOW_PREFIX + k; }

// ----------------------------------------------------------------------
// Converters: localStorage shape <-> Supabase row shape
// ----------------------------------------------------------------------

function bodyToRow(item) {
  return {
    user_id: userId,
    client_id: item.id,
    date: item.date,
    person: item.person,
    weight:  numOrNull(item.weight),
    waist:   numOrNull(item.waist),
    chest:   numOrNull(item.chest),
    hips:    numOrNull(item.hips),
    bicep_l: numOrNull(item.bicepL),
    bicep_r: numOrNull(item.bicepR),
    thigh_l: numOrNull(item.thighL),
    thigh_r: numOrNull(item.thighR),
    rhr:     numOrNull(item.rhr),
    notes:   item.notes || '',
    photo_paths: [],
    deleted_at: null,
  };
}
function bodyFromRow(row, localById) {
  const local = localById?.get(row.client_id);
  return {
    id: row.client_id,
    date: row.date,
    person: row.person,
    weight: row.weight, waist: row.waist, chest: row.chest, hips: row.hips,
    bicepL: row.bicep_l, bicepR: row.bicep_r,
    thighL: row.thigh_l, thighR: row.thigh_r,
    rhr: row.rhr,
    notes: row.notes || '',
    photos: local?.photos ?? false,
    photoIds: local?.photoIds || [],
  };
}

function mealToRow(item) {
  return {
    user_id: userId,
    client_id: item.id,
    date: item.date,
    slot: item.slot || null,
    meal_key: item.mealKey || null,
    custom_name: item.customName || null,
    him_kcal: numOrNull(item.himKcal),
    him_p:    numOrNull(item.himP),
    her_kcal: numOrNull(item.herKcal),
    her_p:    numOrNull(item.herP),
    notes: item.notes || '',
    deleted_at: null,
  };
}
function mealFromRow(row) {
  const e = {
    id: row.client_id,
    date: row.date,
    slot: row.slot || '',
    mealKey: row.meal_key || '',
    notes: row.notes || '',
  };
  if (row.custom_name) {
    e.customName = row.custom_name;
    e.himKcal = row.him_kcal ?? 0;
    e.himP    = row.him_p    ?? 0;
    e.herKcal = row.her_kcal ?? 0;
    e.herP    = row.her_p    ?? 0;
  }
  return e;
}

function trainingToRow(item) {
  return {
    user_id: userId,
    client_id: item.id,
    date: item.date,
    person: item.person,
    day: item.day || null,
    day_label: item.dayLabel || null,
    exercises: item.exercises || [],
    deleted_at: null,
  };
}
function trainingFromRow(row) {
  return {
    id: row.client_id,
    date: row.date,
    person: row.person,
    day: row.day || '',
    dayLabel: row.day_label || '',
    exercises: row.exercises || [],
  };
}

function customRecipeToRow(item) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    meal_type: item.mealType || null,
    cuisine: item.cuisine || null,
    total_time: item.totalTime != null ? String(item.totalTime) : null,
    servings: item.servings ?? null,
    macros: item.macros || null,
    ingredients: item.ingredients || [],
    method: item.method || [],
    tags: item.tags || [],
    notes: item.notes || '',
    deleted_at: null,
  };
}
function customRecipeFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    mealType: row.meal_type || '',
    cuisine: row.cuisine || '',
    totalTime: row.total_time || '',
    servings: row.servings ?? null,
    macros: row.macros || null,
    ingredients: row.ingredients || [],
    method: row.method || [],
    tags: row.tags || [],
    notes: row.notes || '',
    isCustom: true,
  };
}

function recipeBookToRow(recipeId, v) {
  return {
    user_id: userId,
    recipe_id: recipeId,
    alison_rating: v.alisonRating ?? null,
    darlene_rating: v.darleneRating ?? null,
    last_cooked: v.lastCooked || null,
    times_made: v.timesMade ?? 0,
  };
}
function recipeBookFromRow(row) {
  return [row.recipe_id, {
    alisonRating: row.alison_rating ?? 0,
    darleneRating: row.darlene_rating ?? 0,
    lastCooked: row.last_cooked || '',
    timesMade: row.times_made ?? 0,
  }];
}

// ----------------------------------------------------------------------
// Handler factories
// ----------------------------------------------------------------------

function makeArrayHandler({ key, table, toRow, fromRow, conflict, idField = 'id', deleteByField = 'client_id', preserveLocalFields = false }) {
  return {
    async push() {
      const newArr   = readJson(key, []);
      const shadow   = readJson(shadowKey(key), []);
      const shadowById = new Map(shadow.map((x) => [x[idField], x]));
      const newById    = new Map(newArr.map((x) => [x[idField], x]));

      const upserts = [];
      for (const [id, item] of newById) {
        const sh = shadowById.get(id);
        if (!sh || JSON.stringify(sh) !== JSON.stringify(item)) upserts.push(toRow(item));
      }
      const deleteIds = [];
      for (const id of shadowById.keys()) if (!newById.has(id)) deleteIds.push(id);

      if (upserts.length) {
        const { error } = await supabase.from(table).upsert(upserts, { onConflict: conflict });
        if (error) throw error;
      }
      if (deleteIds.length) {
        const { error } = await supabase.from(table)
          .update({ deleted_at: new Date().toISOString() })
          .eq('user_id', userId)
          .in(deleteByField, deleteIds);
        if (error) throw error;
      }
      withSuppressed(() => {
        window.localStorage.setItem(shadowKey(key), JSON.stringify(newArr));
      });
    },

    async pull() {
      const { data, error } = await supabase.from(table).select('*').is('deleted_at', null);
      if (error) throw error;

      const localArr  = readJson(key, []);
      const shadow    = readJson(shadowKey(key), []);
      const localById = new Map(localArr.map((x) => [x[idField], x]));
      const shadowIds = new Set(shadow.map((x) => x[idField]));
      const serverArr = data.map((r) => fromRow(r, preserveLocalFields ? localById : null));
      const serverIds = new Set(serverArr.map((x) => x[idField]));

      // Items in local but not server:
      //   - not in shadow either → local-only / never synced → keep
      //   - in shadow → another device deleted it → drop
      const localOnly = localArr.filter(
        (x) => !serverIds.has(x[idField]) && !shadowIds.has(x[idField]),
      );
      const merged = [...serverArr, ...localOnly];

      withSuppressed(() => {
        window.localStorage.setItem(key, JSON.stringify(merged));
        window.localStorage.setItem(shadowKey(key), JSON.stringify(serverArr));
      });
    },
  };
}

function makeMapHandler({ key, table, keyField, toRow, fromRow, conflict, hardDelete = true }) {
  return {
    async push() {
      const newMap = readJson(key, {});
      const shadow = readJson(shadowKey(key), {});

      const upserts = [];
      for (const [k, v] of Object.entries(newMap)) {
        const sv = shadow[k];
        if (sv === undefined || JSON.stringify(sv) !== JSON.stringify(v)) upserts.push(toRow(k, v));
      }
      const deleteKeys = [];
      for (const k of Object.keys(shadow)) if (!(k in newMap)) deleteKeys.push(k);

      if (upserts.length) {
        const { error } = await supabase.from(table).upsert(upserts, { onConflict: conflict });
        if (error) throw error;
      }
      if (deleteKeys.length && hardDelete) {
        const { error } = await supabase.from(table).delete().eq('user_id', userId).in(keyField, deleteKeys);
        if (error) throw error;
      }
      withSuppressed(() => {
        window.localStorage.setItem(shadowKey(key), JSON.stringify(newMap));
      });
    },

    async pull() {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      const serverMap = {};
      for (const row of data) {
        const [k, v] = fromRow(row);
        serverMap[k] = v;
      }
      const localMap = readJson(key, {});
      const shadow   = readJson(shadowKey(key), {});
      // Server wins for keys it knows about. Local-only keys are preserved
      // only if shadow didn't have them either — otherwise they were
      // remotely deleted.
      const merged = { ...serverMap };
      for (const [k, v] of Object.entries(localMap)) {
        if (!(k in serverMap) && !(k in shadow)) merged[k] = v;
      }
      withSuppressed(() => {
        window.localStorage.setItem(key, JSON.stringify(merged));
        window.localStorage.setItem(shadowKey(key), JSON.stringify(serverMap));
      });
    },
  };
}

// ----------------------------------------------------------------------
// Special-case handlers
// ----------------------------------------------------------------------

// Fridge spans two localStorage keys (checks + notes) but one table.
const fridgeHandler = {
  async push() {
    const checks = readJson('rtc_fridge_checks_v1', {});
    const notes  = readJson('rtc_fridge_notes_v1',  {});
    const shChecks = readJson(shadowKey('rtc_fridge_checks_v1'), {});
    const shNotes  = readJson(shadowKey('rtc_fridge_notes_v1'),  {});

    const cells = new Set([
      ...Object.keys(checks), ...Object.keys(notes),
      ...Object.keys(shChecks), ...Object.keys(shNotes),
    ]);
    const upserts = [];
    const deletes = [];
    for (const cell of cells) {
      const curChecked = !!checks[cell];
      const curNote    = notes[cell] || '';
      const shChecked  = !!shChecks[cell];
      const shNote     = shNotes[cell] || '';
      const isPresent  = (cell in checks) || (cell in notes);
      const wasPresent = (cell in shChecks) || (cell in shNotes);
      if (!isPresent && wasPresent) {
        deletes.push(cell);
      } else if (isPresent && (curChecked !== shChecked || curNote !== shNote)) {
        upserts.push({ user_id: userId, cell_id: cell, checked: curChecked, note: curNote });
      }
    }
    if (upserts.length) {
      const { error } = await supabase.from('fridge_state').upsert(upserts, { onConflict: 'user_id,cell_id' });
      if (error) throw error;
    }
    if (deletes.length) {
      const { error } = await supabase.from('fridge_state').delete().eq('user_id', userId).in('cell_id', deletes);
      if (error) throw error;
    }
    withSuppressed(() => {
      window.localStorage.setItem(shadowKey('rtc_fridge_checks_v1'), JSON.stringify(checks));
      window.localStorage.setItem(shadowKey('rtc_fridge_notes_v1'),  JSON.stringify(notes));
    });
  },
  async pull() {
    const { data, error } = await supabase.from('fridge_state').select('*');
    if (error) throw error;
    const sChecks = {};
    const sNotes  = {};
    for (const row of data) {
      if (row.checked) sChecks[row.cell_id] = true;
      if (row.note)    sNotes[row.cell_id]  = row.note;
    }
    const localChecks = readJson('rtc_fridge_checks_v1', {});
    const localNotes  = readJson('rtc_fridge_notes_v1',  {});
    const shChecks    = readJson(shadowKey('rtc_fridge_checks_v1'), {});
    const shNotes     = readJson(shadowKey('rtc_fridge_notes_v1'),  {});

    // Merge: server wins for cells it knows about. Preserve local-only cells
    // that the shadow didn't have either (truly local). Drop cells that were
    // in the shadow but the server no longer has — those were remotely cleared.
    const mergedChecks = { ...sChecks };
    for (const [k, v] of Object.entries(localChecks)) {
      if (!(k in sChecks) && !(k in shChecks)) mergedChecks[k] = v;
    }
    const mergedNotes = { ...sNotes };
    for (const [k, v] of Object.entries(localNotes)) {
      if (!(k in sNotes) && !(k in shNotes)) mergedNotes[k] = v;
    }

    withSuppressed(() => {
      window.localStorage.setItem('rtc_fridge_checks_v1', JSON.stringify(mergedChecks));
      window.localStorage.setItem('rtc_fridge_notes_v1',  JSON.stringify(mergedNotes));
      window.localStorage.setItem(shadowKey('rtc_fridge_checks_v1'), JSON.stringify(sChecks));
      window.localStorage.setItem(shadowKey('rtc_fridge_notes_v1'),  JSON.stringify(sNotes));
    });
  },
};

// Chores: one localStorage key, two tables.
const choresHandler = {
  async push() {
    const state  = readJson('rtc_chores_v1', {});
    const shadow = readJson(shadowKey('rtc_chores_v1'), {});
    const cur = { checked: state.checked || {}, notes: state.notes || {}, lastReset: state.lastReset || {} };
    const sh  = { checked: shadow.checked || {}, notes: shadow.notes || {}, lastReset: shadow.lastReset || {} };

    const ids = new Set([
      ...Object.keys(cur.checked), ...Object.keys(cur.notes),
      ...Object.keys(sh.checked),  ...Object.keys(sh.notes),
    ]);
    const stateUpserts = [];
    const stateDeletes = [];
    for (const id of ids) {
      const c = !!cur.checked[id], n = cur.notes[id] || '';
      const sc = !!sh.checked[id], sn = sh.notes[id] || '';
      const isPresent  = (id in cur.checked) || (id in cur.notes);
      const wasPresent = (id in sh.checked)  || (id in sh.notes);
      if (!isPresent && wasPresent) stateDeletes.push(id);
      else if (isPresent && (c !== sc || n !== sn)) {
        stateUpserts.push({ user_id: userId, chore_id: id, checked: c, note: n });
      }
    }

    const resetUpserts = [];
    for (const section of ['daily', 'weekly', 'monthly']) {
      const c = cur.lastReset[section], s = sh.lastReset[section];
      if (c && c !== s) resetUpserts.push({ user_id: userId, section, last_reset: c });
    }

    if (stateUpserts.length) {
      const { error } = await supabase.from('chores_state').upsert(stateUpserts, { onConflict: 'user_id,chore_id' });
      if (error) throw error;
    }
    if (stateDeletes.length) {
      const { error } = await supabase.from('chores_state').delete().eq('user_id', userId).in('chore_id', stateDeletes);
      if (error) throw error;
    }
    if (resetUpserts.length) {
      const { error } = await supabase.from('chores_resets').upsert(resetUpserts, { onConflict: 'user_id,section' });
      if (error) throw error;
    }
    withSuppressed(() => {
      window.localStorage.setItem(shadowKey('rtc_chores_v1'), JSON.stringify(state));
    });
  },
  async pull() {
    const [stateRes, resetsRes] = await Promise.all([
      supabase.from('chores_state').select('*'),
      supabase.from('chores_resets').select('*'),
    ]);
    if (stateRes.error) throw stateRes.error;
    if (resetsRes.error) throw resetsRes.error;

    const sChecked = {}, sNotes = {}, sLastReset = {};
    for (const row of stateRes.data) {
      if (row.checked) sChecked[row.chore_id] = true;
      if (row.note)    sNotes[row.chore_id]   = row.note;
    }
    for (const row of resetsRes.data) sLastReset[row.section] = row.last_reset;

    const local  = readJson('rtc_chores_v1', {});
    const shadow = readJson(shadowKey('rtc_chores_v1'), {});
    const lChecked = local.checked || {}, lNotes = local.notes || {}, lLastReset = local.lastReset || {};
    const shChecked = shadow.checked || {}, shNotes = shadow.notes || {}, shLastReset = shadow.lastReset || {};

    // Server wins for ids it knows; preserve local-only ids the shadow didn't
    // have either; drop ids that were in shadow but not server (remote delete).
    const mergedChecked = { ...sChecked };
    for (const [k, v] of Object.entries(lChecked)) {
      if (!(k in sChecked) && !(k in shChecked)) mergedChecked[k] = v;
    }
    const mergedNotes = { ...sNotes };
    for (const [k, v] of Object.entries(lNotes)) {
      if (!(k in sNotes) && !(k in shNotes)) mergedNotes[k] = v;
    }
    // lastReset: take the most recent ISO date per section. Auto-reset on
    // page load may have written a fresh date to local before sync runs;
    // we don't want the pull to undo that.
    const mergedLastReset = { ...lLastReset };
    for (const [section, sDate] of Object.entries(sLastReset)) {
      const lDate = lLastReset[section];
      if (!lDate || sDate > lDate) mergedLastReset[section] = sDate;
    }

    const merged = { checked: mergedChecked, notes: mergedNotes, lastReset: mergedLastReset };
    withSuppressed(() => {
      window.localStorage.setItem('rtc_chores_v1', JSON.stringify(merged));
      // Shadow = pure server view.
      window.localStorage.setItem(shadowKey('rtc_chores_v1'), JSON.stringify({
        checked: sChecked, notes: sNotes, lastReset: sLastReset,
      }));
    });
  },
};

// Groceries: one handler per week, all writing to grocery_state with a week field.
function makeGroceryHandler(week) {
  const key = `rtc_grocery_week_${week}_v3`;
  return {
    async push() {
      const newMap = readJson(key, {});
      const shadow = readJson(shadowKey(key), {});
      const ids = new Set([...Object.keys(newMap), ...Object.keys(shadow)]);
      const upserts = [];
      const deletes = [];
      for (const id of ids) {
        const cur = !!newMap[id];
        const sh  = !!shadow[id];
        if (!(id in newMap) && (id in shadow)) deletes.push(id);
        else if (cur !== sh) upserts.push({ user_id: userId, week, item_id: id, checked: cur });
      }
      if (upserts.length) {
        const { error } = await supabase.from('grocery_state').upsert(upserts, { onConflict: 'user_id,week,item_id' });
        if (error) throw error;
      }
      if (deletes.length) {
        const { error } = await supabase.from('grocery_state').delete()
          .eq('user_id', userId).eq('week', week).in('item_id', deletes);
        if (error) throw error;
      }
      withSuppressed(() => {
        window.localStorage.setItem(shadowKey(key), JSON.stringify(newMap));
      });
    },
    async pull() {
      const { data, error } = await supabase.from('grocery_state').select('*').eq('week', week);
      if (error) throw error;
      const serverMap = {};
      for (const row of data) if (row.checked) serverMap[row.item_id] = true;
      const localMap = readJson(key, {});
      const shadow   = readJson(shadowKey(key), {});
      const merged = { ...serverMap };
      for (const [k, v] of Object.entries(localMap)) {
        if (!(k in serverMap) && !(k in shadow)) merged[k] = v;
      }
      withSuppressed(() => {
        window.localStorage.setItem(key, JSON.stringify(merged));
        window.localStorage.setItem(shadowKey(key), JSON.stringify(serverMap));
      });
    },
  };
}

// ----------------------------------------------------------------------
// Handler registry
// ----------------------------------------------------------------------

const HANDLERS = {};

HANDLERS['rtc_tracker_body_v1'] = makeArrayHandler({
  key: 'rtc_tracker_body_v1', table: 'body_entries',
  toRow: bodyToRow, fromRow: bodyFromRow,
  conflict: 'user_id,client_id',
  preserveLocalFields: true,
});
HANDLERS['rtc_tracker_meals_v1'] = makeArrayHandler({
  key: 'rtc_tracker_meals_v1', table: 'meal_entries',
  toRow: mealToRow, fromRow: mealFromRow,
  conflict: 'user_id,client_id',
});
HANDLERS['rtc_tracker_training_v1'] = makeArrayHandler({
  key: 'rtc_tracker_training_v1', table: 'training_sessions',
  toRow: trainingToRow, fromRow: trainingFromRow,
  conflict: 'user_id,client_id',
});
HANDLERS['rtc_recipes_custom_v1'] = makeArrayHandler({
  key: 'rtc_recipes_custom_v1', table: 'custom_recipes',
  toRow: customRecipeToRow, fromRow: customRecipeFromRow,
  conflict: 'id', deleteByField: 'id',
});
HANDLERS['rtc_recipe_book_v1'] = makeMapHandler({
  key: 'rtc_recipe_book_v1', table: 'recipe_book',
  keyField: 'recipe_id', conflict: 'user_id,recipe_id',
  toRow: recipeBookToRow, fromRow: recipeBookFromRow,
});

// Fridge: same handler shared by both keys.
HANDLERS['rtc_fridge_checks_v1'] = fridgeHandler;
HANDLERS['rtc_fridge_notes_v1']  = fridgeHandler;

// Chores.
HANDLERS['rtc_chores_v1'] = choresHandler;

// Groceries: per-week handlers.
['a', 'b', 'c', 'd'].forEach((w) => {
  HANDLERS[`rtc_grocery_week_${w}_v3`] = makeGroceryHandler(w);
});

// ----------------------------------------------------------------------
// Monkey-patch + debounced push scheduler
// ----------------------------------------------------------------------

const _origSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function (k, v) {
  _origSetItem.call(this, k, v);
  if (!initialized || suppressed) return;
  if (this !== window.localStorage) return;
  if (!HANDLERS[k]) return;
  schedulePush(k);
};

function schedulePush(key) {
  if (pushTimers.has(key)) clearTimeout(pushTimers.get(key));
  pushTimers.set(key, setTimeout(() => {
    pushTimers.delete(key);
    HANDLERS[key].push().catch((e) => console.warn('[sync] push failed', key, e?.message || e));
  }, PUSH_DEBOUNCE_MS));
}

// ----------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------

export async function initSync(supabaseUserId) {
  userId = supabaseUserId;
  const uniqueHandlers = [...new Set(Object.values(HANDLERS))];
  // Push first so local edits made before sync runs (incl. the chores
  // auto-reset write on page load) aren't clobbered by the subsequent pull.
  // Then pull to bring in updates from other devices.
  await Promise.all(uniqueHandlers.map(async (h) => {
    try { await h.push(); } catch (e) { console.warn('[sync] init push failed', e?.message || e); }
  }));
  await Promise.all(uniqueHandlers.map(async (h) => {
    try { await h.pull(); } catch (e) { console.warn('[sync] init pull failed', e?.message || e); }
  }));
  initialized = true;
}

export async function pullAll() {
  const uniqueHandlers = [...new Set(Object.values(HANDLERS))];
  await Promise.all(uniqueHandlers.map((h) => h.pull().catch(() => {})));
}
