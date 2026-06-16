// Diet plan data + render + edit + picker + grocery aggregation.
//
// Source of truth for the Dar nutritionist plan (Nayanna Percy Costa,
// CRN11:2259, prescribed 2026-06-10, pregnancy week 28+). This file is
// loaded by both plan.html and groceries.html so the same data drives
// the plan view, the meal picker, and the auto-generated shopping list.
//
// Storage keys:
//   rtc_plan_overrides_v1  — per-meal-per-ingredient quantity overrides
//   rtc_week_plan_v1       — which recipe fills each block-slot this week

const OVERRIDES_KEY  = 'rtc_plan_overrides_v1';
const WEEK_PLAN_KEY  = 'rtc_week_plan_v1';

// Daily blocks: A = Mon–Wed (3 days), B = Thu–Sun (4 days)
const BLOCKS = [
  { id: 'A', days: 'Mon · Tue · Wed',       numDays: 3, defaultProtein: 'chicken' },
  { id: 'B', days: 'Thu · Fri · Sat · Sun', numDays: 4, defaultProtein: 'beef' },
];

// ============================================================
// Recipe catalog (Dar plan only — full meal definitions with
// structured ingredients so the grocery aggregator works)
// ============================================================
// Conventions:
//   slot:        'breakfast' | 'lunch' | 'snack' | 'dinner' | 'evening'
//   protein:     'chicken' | 'beef' | 'fish' | 'mixed' (for breakfasts/snacks)
//   time:        suggested time (e.g. '07:00')
//   ingredients: [{ id, name, her, him, unit, displayHer?, displayHim? }]
//   macros:      { her: { kcal, p, c, f }, him: { kcal, p, c, f } }
//   notes:       free-text shown on the picker / plan card
const RECIPES = {
  // ----------------- breakfast / snacks (shared) -----------------
  dar_breakfast: {
    name: 'Egg & Cottage Cheese Toast + Pear + Chia',
    slot: 'breakfast', protein: 'mixed', time: '07:00',
    ingredients: [
      { id: 'eggs',    name: 'Boiled eggs',                                   her: 100, him: 150, unit: 'g', displayHer: '2 medium', displayHim: '3 medium' },
      { id: 'cottage', name: 'Cottage cheese (lactose-free for Dar)',         her: 75,  him: 100, unit: 'g' },
      { id: 'bread',   name: 'Whole-wheat bread',                             her: 50,  him: 75,  unit: 'g', displayHer: '2 slices', displayHim: '3 slices' },
      { id: 'fruit_b', name: 'Pear (Dar) / Banana (Alison)',                  her: 110, him: 120, unit: 'g' },
      { id: 'chia',    name: 'Chia seeds',                                    her: 30,  him: 30,  unit: 'g', displayHer: '2 tbsp', displayHim: '2 tbsp' },
    ],
    macros: { her: { kcal: 562, p: 35, c: 56, f: 23 }, him: { kcal: 767, p: 44, c: 79, f: 31 } },
  },
  dar_snack_smoothie: {
    name: 'Banana Protein Smoothie',
    slot: 'snack', protein: 'mixed', time: '16:00',
    ingredients: [
      { id: 'banana',   name: 'Banana',                  her: 40,  him: 40,  unit: 'g', displayHer: '1 small',  displayHim: '1 small' },
      { id: 'oat_bran', name: 'Oat bran',                her: 30,  him: 30,  unit: 'g', displayHer: '3 tbsp',   displayHim: '3 tbsp' },
      { id: 'whey',     name: 'Whey isolate protein',    her: 30,  him: 30,  unit: 'g', displayHer: '1 scoop',  displayHim: '1 scoop' },
      { id: 'water',    name: 'Cold water',              her: 300, him: 300, unit: 'mL' },
    ],
    macros: { her: { kcal: 227, p: 31, c: 27, f: 3 }, him: { kcal: 227, p: 31, c: 27, f: 3 } },
  },
  dar_evening_snack: {
    name: 'Greek Yogurt + Ground Flaxseed',
    slot: 'evening', protein: 'mixed', time: '21:30',
    ingredients: [
      { id: 'yogurt',   name: 'Plain full-fat Greek yogurt',  her: 100, him: 200, unit: 'g' },
      { id: 'flaxseed', name: 'Ground flaxseed',              her: 20,  him: 20,  unit: 'g', displayHer: '2 dessert spoons', displayHim: '2 dessert spoons' },
    ],
    macros: { her: { kcal: 207, p: 13, c: 10, f: 13 }, him: { kcal: 307, p: 22, c: 14, f: 18 } },
  },

  // ----------------- chicken lunches -----------------
  dar_lunch_chicken: {
    name: 'Chicken & Rice Plate w/ Lentils',
    slot: 'lunch', protein: 'chicken', time: '12:30',
    ingredients: [
      { id: 'chicken', name: 'Grilled chicken breast (cooked)',           her: 150, him: 220, unit: 'g' },
      { id: 'rice',    name: 'Brown rice (cooked)',                       her: 100, him: 150, unit: 'g', displayHer: '5 heaping tbsp' },
      { id: 'lentils', name: 'Lentils (cooked)',                          her: 54,  him: 80,  unit: 'g', displayHer: '2 heaping tbsp' },
      { id: 'veg',     name: 'Steamed mixed veggies (broccoli, zucchini, carrot)', her: 110, him: 110, unit: 'g' },
      { id: 'salad',   name: 'Raw salad (lettuce, tomato, onion)',        her: 70,  him: 70,  unit: 'g' },
      { id: 'oil',     name: 'Extra-virgin olive oil',                    her: 14,  him: 21,  unit: 'g', displayHer: '1 tbsp', displayHim: '1.5 tbsp' },
      { id: 'orange',  name: 'Orange',                                    her: 90,  him: 130, unit: 'g', displayHer: '1 small', displayHim: '1 medium' },
    ],
    macros: { her: { kcal: 630, p: 57, c: 55, f: 21 }, him: { kcal: 879, p: 76, c: 78, f: 30 } },
  },
  dar_lunch_chicken_pasta: {
    name: 'Lemon-Garlic Chicken & Whole-Wheat Pasta w/ Chickpeas',
    slot: 'lunch', protein: 'chicken', time: '12:30',
    ingredients: [
      { id: 'chicken',   name: 'Grilled chicken breast (cooked)',  her: 150, him: 220, unit: 'g' },
      { id: 'pasta_ww',  name: 'Whole-wheat pasta (cooked)',       her: 112, him: 170, unit: 'g' },
      { id: 'chickpeas', name: 'Chickpeas (cooked, drained)',      her: 45,  him: 80,  unit: 'g' },
      { id: 'veg',       name: 'Steamed mixed veggies',            her: 110, him: 110, unit: 'g' },
      { id: 'salad',     name: 'Raw salad',                        her: 70,  him: 70,  unit: 'g' },
      { id: 'oil',       name: 'Extra-virgin olive oil',           her: 14,  him: 21,  unit: 'g' },
      { id: 'orange',    name: 'Orange',                           her: 90,  him: 130, unit: 'g' },
    ],
    macros: { her: { kcal: 635, p: 58, c: 63, f: 22 }, him: { kcal: 892, p: 84, c: 96, f: 31 } },
  },
  dar_lunch_chicken_potato: {
    name: 'Chicken & Mashed Potatoes w/ Lentils',
    slot: 'lunch', protein: 'chicken', time: '12:30',
    ingredients: [
      { id: 'chicken',     name: 'Grilled chicken breast (cooked)',   her: 150, him: 220, unit: 'g' },
      { id: 'mashed_pot',  name: 'Mashed potatoes',                   her: 160, him: 250, unit: 'g', displayHer: '2 serving spoons' },
      { id: 'lentils',     name: 'Lentils (cooked)',                  her: 54,  him: 80,  unit: 'g' },
      { id: 'veg',         name: 'Steamed mixed veggies',             her: 110, him: 110, unit: 'g' },
      { id: 'salad',       name: 'Raw salad',                         her: 70,  him: 70,  unit: 'g' },
      { id: 'oil',         name: 'Extra-virgin olive oil',            her: 14,  him: 21,  unit: 'g' },
      { id: 'orange',      name: 'Orange',                            her: 90,  him: 130, unit: 'g' },
    ],
    macros: { her: { kcal: 658, p: 57, c: 57, f: 22 }, him: { kcal: 992, p: 81, c: 99, f: 33 } },
  },
  dar_lunch_chicken_pumpkin: {
    name: 'Chicken & Pumpkin Purée w/ Chickpeas',
    slot: 'lunch', protein: 'chicken', time: '12:30',
    ingredients: [
      { id: 'chicken',    name: 'Grilled chicken breast (cooked)',  her: 150, him: 220, unit: 'g' },
      { id: 'pumpkin',    name: 'Pumpkin purée',                    her: 200, him: 300, unit: 'g', displayHer: '2½ serving spoons' },
      { id: 'chickpeas',  name: 'Chickpeas (cooked, drained)',      her: 45,  him: 70,  unit: 'g' },
      { id: 'veg',        name: 'Steamed mixed veggies',            her: 110, him: 110, unit: 'g' },
      { id: 'salad',      name: 'Raw salad',                        her: 70,  him: 70,  unit: 'g' },
      { id: 'oil',        name: 'Extra-virgin olive oil',           her: 14,  him: 21,  unit: 'g' },
      { id: 'orange',     name: 'Orange',                           her: 90,  him: 130, unit: 'g' },
    ],
    macros: { her: { kcal: 575, p: 57, c: 53, f: 22 }, him: { kcal: 840, p: 80, c: 86, f: 33 } },
  },

  // ----------------- chicken dinners -----------------
  dar_dinner_chicken: {
    name: 'Shredded Chicken Wrap + Veg',
    slot: 'dinner', protein: 'chicken', time: '19:00',
    ingredients: [
      { id: 'chicken_sh', name: 'Shredded chicken (cooked)',     her: 120, him: 170, unit: 'g' },
      { id: 'wrap',       name: 'Whole-wheat wrap',              her: 30,  him: 45,  unit: 'g', displayHer: '1 wrap', displayHim: '1.5 wraps' },
      { id: 'veg_d',      name: 'Steamed mixed veggies',         her: 110, him: 110, unit: 'g' },
      { id: 'lettuce',    name: 'Iceberg lettuce',               her: 48,  him: 48,  unit: 'g', displayHer: '2 leaves' },
      { id: 'oil_d',      name: 'Extra-virgin olive oil',        her: 14,  him: 21,  unit: 'g' },
      { id: 'pineapple',  name: 'Pineapple',                     her: 75,  him: 75,  unit: 'g', displayHer: '1 slice' },
    ],
    macros: { her: { kcal: 478, p: 43, c: 32, f: 19 }, him: { kcal: 660, p: 60, c: 39, f: 29 } },
  },
  dar_dinner_chicken_rice: {
    name: 'Greek Chicken Bowl with Brown Rice',
    slot: 'dinner', protein: 'chicken', time: '19:00',
    ingredients: [
      { id: 'chicken_sh', name: 'Shredded chicken (cooked)',     her: 120, him: 170, unit: 'g' },
      { id: 'rice_d',     name: 'Brown rice (cooked)',           her: 80,  him: 120, unit: 'g', displayHer: '4 heaping tbsp' },
      { id: 'veg_d',      name: 'Steamed mixed veggies',         her: 110, him: 110, unit: 'g' },
      { id: 'lettuce',    name: 'Iceberg lettuce',               her: 48,  him: 48,  unit: 'g' },
      { id: 'oil_d',      name: 'Extra-virgin olive oil',        her: 14,  him: 21,  unit: 'g' },
      { id: 'pineapple',  name: 'Pineapple',                     her: 75,  him: 75,  unit: 'g' },
    ],
    macros: { her: { kcal: 512, p: 43, c: 50, f: 18 }, him: { kcal: 695, p: 60, c: 67, f: 29 } },
  },

  // ----------------- beef lunches -----------------
  dar_lunch_beef: {
    name: 'Lean Beef & Rice w/ Black Beans',
    slot: 'lunch', protein: 'beef', time: '12:30',
    ingredients: [
      { id: 'beef',     name: 'Lean ground beef (93/7), sautéed', her: 75,  him: 150, unit: 'g', displayHer: '3 tbsp' },
      { id: 'rice_b',   name: 'Brown rice (cooked)',              her: 100, him: 150, unit: 'g' },
      { id: 'beans_bk', name: 'Black beans (cooked, drained)',    her: 68,  him: 130, unit: 'g', displayHer: '4 tbsp' },
      { id: 'veg_b',    name: 'Steamed mixed veggies',            her: 110, him: 110, unit: 'g' },
      { id: 'salad_b',  name: 'Raw salad',                        her: 70,  him: 70,  unit: 'g' },
      { id: 'oil_b',    name: 'Extra-virgin olive oil',           her: 14,  him: 21,  unit: 'g' },
      { id: 'orange_b', name: 'Orange',                           her: 90,  him: 130, unit: 'g' },
    ],
    macros: { her: { kcal: 574, p: 33, c: 62, f: 24 }, him: { kcal: 920, p: 58, c: 90, f: 39 } },
  },
  dar_lunch_beef_sweetpotato: {
    name: 'Beef & Sweet Potato w/ Pinto Beans',
    slot: 'lunch', protein: 'beef', time: '12:30',
    ingredients: [
      { id: 'beef',     name: 'Lean ground beef (93/7), sautéed', her: 75,  him: 150, unit: 'g' },
      { id: 'sweet_p',  name: 'Sweet potato (cooked)',            her: 100, him: 150, unit: 'g', displayHer: '2½ small slices' },
      { id: 'beans_pn', name: 'Pinto beans (cooked, drained)',    her: 68,  him: 130, unit: 'g' },
      { id: 'veg_b',    name: 'Steamed mixed veggies',            her: 110, him: 110, unit: 'g' },
      { id: 'salad_b',  name: 'Raw salad',                        her: 70,  him: 70,  unit: 'g' },
      { id: 'oil_b',    name: 'Extra-virgin olive oil',           her: 14,  him: 21,  unit: 'g' },
      { id: 'orange_b', name: 'Orange',                           her: 90,  him: 130, unit: 'g' },
    ],
    macros: { her: { kcal: 560, p: 32, c: 67, f: 24 }, him: { kcal: 910, p: 58, c: 100, f: 39 } },
  },
  dar_lunch_beef_pasta: {
    name: 'Beef & Whole-Wheat Pasta w/ Chickpeas',
    slot: 'lunch', protein: 'beef', time: '12:30',
    ingredients: [
      { id: 'beef',      name: 'Lean ground beef (93/7), sautéed', her: 75,  him: 150, unit: 'g' },
      { id: 'pasta_ww',  name: 'Whole-wheat pasta (cooked)',       her: 112, him: 170, unit: 'g' },
      { id: 'chickpeas', name: 'Chickpeas (cooked, drained)',      her: 45,  him: 70,  unit: 'g' },
      { id: 'veg_b',     name: 'Steamed mixed veggies',            her: 110, him: 110, unit: 'g' },
      { id: 'salad_b',   name: 'Raw salad',                        her: 70,  him: 70,  unit: 'g' },
      { id: 'oil_b',     name: 'Extra-virgin olive oil',           her: 14,  him: 21,  unit: 'g' },
      { id: 'orange_b',  name: 'Orange',                           her: 90,  him: 130, unit: 'g' },
    ],
    macros: { her: { kcal: 585, p: 33, c: 67, f: 25 }, him: { kcal: 915, p: 58, c: 102, f: 39 } },
  },

  // ----------------- beef dinners -----------------
  dar_dinner_beef: {
    name: 'Lean Beef Wrap + Veg',
    slot: 'dinner', protein: 'beef', time: '19:00',
    ingredients: [
      { id: 'beef_d',     name: 'Lean ground beef (93/7), sautéed', her: 62.5, him: 125, unit: 'g', displayHer: '2½ heaping tbsp' },
      { id: 'wrap_b',     name: 'Whole-wheat wrap',                 her: 30,   him: 45,  unit: 'g' },
      { id: 'veg_bd',     name: 'Steamed mixed veggies',            her: 110,  him: 110, unit: 'g' },
      { id: 'lettuce_b',  name: 'Iceberg lettuce',                  her: 48,   him: 48,  unit: 'g' },
      { id: 'oil_bd',     name: 'Extra-virgin olive oil',           her: 14,   him: 21,  unit: 'g' },
      { id: 'pineapple_b',name: 'Pineapple',                        her: 75,   him: 75,  unit: 'g' },
    ],
    macros: { her: { kcal: 418, p: 23, c: 32, f: 22 }, him: { kcal: 640, p: 42, c: 39, f: 36 } },
  },
  dar_dinner_beef_rice: {
    name: 'Beef Bowl with Brown Rice',
    slot: 'dinner', protein: 'beef', time: '19:00',
    ingredients: [
      { id: 'beef_d',     name: 'Lean ground beef (93/7), sautéed', her: 62.5, him: 125, unit: 'g' },
      { id: 'rice_d',     name: 'Brown rice (cooked)',              her: 80,   him: 120, unit: 'g', displayHer: '4 heaping tbsp' },
      { id: 'veg_bd',     name: 'Steamed mixed veggies',            her: 110,  him: 110, unit: 'g' },
      { id: 'lettuce_b',  name: 'Iceberg lettuce',                  her: 48,   him: 48,  unit: 'g' },
      { id: 'oil_bd',     name: 'Extra-virgin olive oil',           her: 14,   him: 21,  unit: 'g' },
      { id: 'pineapple_b',name: 'Pineapple',                        her: 75,   him: 75,  unit: 'g' },
    ],
    macros: { her: { kcal: 440, p: 22, c: 50, f: 22 }, him: { kcal: 660, p: 43, c: 67, f: 37 } },
  },

  // ----------------- fish (alternative protein) -----------------
  dar_lunch_fish_sweetpotato: {
    name: 'Baked White Fish & Sweet Potato w/ Black Beans',
    slot: 'lunch', protein: 'fish', time: '12:30',
    ingredients: [
      { id: 'fish',     name: 'White fish fillet (cod, tilapia — low mercury)', her: 100, him: 180, unit: 'g' },
      { id: 'sweet_p',  name: 'Sweet potato (cooked)',  her: 100, him: 150, unit: 'g' },
      { id: 'beans_bk', name: 'Black beans (cooked)',   her: 68,  him: 130, unit: 'g' },
      { id: 'veg_b',    name: 'Steamed mixed veggies',  her: 110, him: 110, unit: 'g' },
      { id: 'salad_b',  name: 'Raw salad',              her: 70,  him: 70,  unit: 'g' },
      { id: 'oil_b',    name: 'Extra-virgin olive oil', her: 14,  him: 21,  unit: 'g' },
      { id: 'orange_b', name: 'Orange',                 her: 90,  him: 130, unit: 'g' },
    ],
    macros: { her: { kcal: 483, p: 33, c: 54, f: 16 }, him: { kcal: 766, p: 56, c: 89, f: 24 } },
  },
  dar_dinner_fish_wrap: {
    name: 'Baked Fish Wrap',
    slot: 'dinner', protein: 'fish', time: '19:00',
    ingredients: [
      { id: 'fish',       name: 'White fish fillet (cod, tilapia — low mercury)', her: 100, him: 180, unit: 'g' },
      { id: 'wrap_b',     name: 'Whole-wheat wrap',          her: 30,  him: 45,  unit: 'g' },
      { id: 'veg_bd',     name: 'Steamed mixed veggies',     her: 110, him: 110, unit: 'g' },
      { id: 'lettuce_b',  name: 'Iceberg lettuce',           her: 48,  him: 48,  unit: 'g' },
      { id: 'oil_bd',     name: 'Extra-virgin olive oil',    her: 14,  him: 21,  unit: 'g' },
      { id: 'pineapple_b',name: 'Pineapple',                 her: 75,  him: 75,  unit: 'g' },
    ],
    macros: { her: { kcal: 388, p: 28, c: 32, f: 20 }, him: { kcal: 580, p: 46, c: 38, f: 31 } },
  },
};

const DEFAULT_PLAN = {
  A: { breakfast: 'dar_breakfast', lunch: 'dar_lunch_chicken', snack: 'dar_snack_smoothie', dinner: 'dar_dinner_chicken', evening: 'dar_evening_snack' },
  B: { breakfast: 'dar_breakfast', lunch: 'dar_lunch_beef',    snack: 'dar_snack_smoothie', dinner: 'dar_dinner_beef',    evening: 'dar_evening_snack' },
};
const SLOTS = ['breakfast', 'lunch', 'snack', 'dinner', 'evening'];
const SLOT_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Afternoon Snack', dinner: 'Dinner', evening: 'Evening Snack' };

// ============================================================
// Storage helpers
// ============================================================
function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJson(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function loadWeekPlan() {
  const stored = loadJson(WEEK_PLAN_KEY, {});
  const out = { A: { ...DEFAULT_PLAN.A }, B: { ...DEFAULT_PLAN.B } };
  for (const blockId of ['A', 'B']) {
    if (stored[blockId]) Object.assign(out[blockId], stored[blockId]);
  }
  return out;
}
function setSlotRecipe(blockId, slot, recipeId) {
  const cur = loadJson(WEEK_PLAN_KEY, {});
  cur[blockId] = cur[blockId] || {};
  cur[blockId][slot] = recipeId;
  saveJson(WEEK_PLAN_KEY, cur);
}
function resetWeekPlan() {
  try { localStorage.removeItem(WEEK_PLAN_KEY); } catch {}
}

// ============================================================
// Per-ingredient quantity overrides
// ============================================================
function loadOverrides() { return loadJson(OVERRIDES_KEY, {}); }
function setOverride(recipeId, ingId, person, qty) {
  const o = loadOverrides();
  const key = recipeId; // overrides are keyed by recipe so they follow even after a recipe-swap of the same dish
  o[key] = o[key] || {};
  o[key][ingId] = o[key][ingId] || {};
  o[key][ingId][person] = qty;
  saveJson(OVERRIDES_KEY, o);
}
function clearRecipeOverrides(recipeId) {
  const o = loadOverrides();
  delete o[recipeId];
  saveJson(OVERRIDES_KEY, o);
}
function getEffectiveQty(recipeId, ingId, person, defaultQty) {
  const o = loadOverrides();
  const v = o?.[recipeId]?.[ingId]?.[person];
  return (typeof v === 'number' && !Number.isNaN(v)) ? v : defaultQty;
}
function recipeHasOverrides(recipeId) {
  return !!loadOverrides()[recipeId];
}

// ============================================================
// Aggregation — produces a grocery list from the current week plan
// ============================================================
function aggregateGroceries() {
  const plan = loadWeekPlan();
  const tally = new Map(); // key: ingId|unit  →  { name, unit, her, him }
  for (const block of BLOCKS) {
    const slots = plan[block.id];
    for (const slot of SLOTS) {
      const recipeId = slots[slot];
      const r = RECIPES[recipeId];
      if (!r) continue;
      for (const ing of r.ingredients) {
        const her = getEffectiveQty(recipeId, ing.id, 'her', ing.her) * block.numDays;
        const him = getEffectiveQty(recipeId, ing.id, 'him', ing.him) * block.numDays;
        const key = ing.id + '|' + ing.unit;
        const cur = tally.get(key) || { name: ing.name, unit: ing.unit, her: 0, him: 0 };
        cur.her += her; cur.him += him;
        tally.set(key, cur);
      }
    }
  }
  return Array.from(tally.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Expose for groceries.html
window.RTC_DIET_PLAN = {
  RECIPES, BLOCKS, SLOTS, SLOT_LABELS, DEFAULT_PLAN,
  loadWeekPlan, setSlotRecipe, resetWeekPlan,
  aggregateGroceries,
};

// ============================================================
// Render (only runs on plan.html, gated by element presence)
// ============================================================
function fmtQty(qty, unit, display) {
  const num = Number.isInteger(qty) ? qty : Math.round(qty * 10) / 10;
  return display
    ? `<b>${num}${unit}</b><span class="qty-display"> · ${display}</span>`
    : `<b>${num}${unit}</b>`;
}

function renderIngredientRow(recipeId, ing) {
  const herQty = getEffectiveQty(recipeId, ing.id, 'her', ing.her);
  const himQty = getEffectiveQty(recipeId, ing.id, 'him', ing.him);
  return `
    <tr>
      <td class="qty her-qty" data-recipe="${recipeId}" data-ing="${ing.id}" data-person="her" data-unit="${ing.unit}" data-default="${ing.her}">
        ${fmtQty(herQty, ing.unit, ing.displayHer)}
      </td>
      <td class="ing-name">${ing.name}</td>
      <td class="qty him-qty" data-recipe="${recipeId}" data-ing="${ing.id}" data-person="him" data-unit="${ing.unit}" data-default="${ing.him}">
        ${fmtQty(himQty, ing.unit, ing.displayHim)}
      </td>
    </tr>
  `;
}

function renderMealForSlot(blockId, slot, recipeId) {
  const r = RECIPES[recipeId];
  if (!r) return '';
  const hasOv = recipeHasOverrides(recipeId);
  const label = SLOT_LABELS[slot];
  return `
    <div class="plan-meal" data-block="${blockId}" data-slot="${slot}" data-recipe="${recipeId}">
      <div class="plan-meal-head">
        <div class="plan-meal-head-text">
          <div class="plan-meal-time">${r.time} · ${label}</div>
          <a class="plan-meal-name" href="recipes.html#${recipeId}">${r.name}</a>
        </div>
        <div class="plan-meal-actions">
          <button type="button" class="plan-meal-change" data-block="${blockId}" data-slot="${slot}">▾ change</button>
          ${hasOv ? `<button type="button" class="plan-meal-reset" data-recipe="${recipeId}" title="Reset quantities">↺</button>` : ''}
        </div>
      </div>
      <table class="plan-ingredients">
        <thead><tr><th>Darlene ♀</th><th>Ingredient</th><th>Alison ♂</th></tr></thead>
        <tbody>${r.ingredients.map((ing) => renderIngredientRow(recipeId, ing)).join('')}</tbody>
      </table>
      <div class="plan-meal-macros">
        <span>♀ ${r.macros.her.kcal} kcal · ${r.macros.her.p}g P</span>
        <span>♂ ${r.macros.him.kcal} kcal · ${r.macros.him.p}g P</span>
        ${hasOv ? '<span class="plan-meal-note">macros shown reflect default qty</span>' : ''}
      </div>
    </div>
  `;
}

function blockTotals(blockId, slots) {
  const tot = { her: { kcal: 0, p: 0 }, him: { kcal: 0, p: 0 } };
  for (const slot of SLOTS) {
    const r = RECIPES[slots[slot]];
    if (!r) continue;
    tot.her.kcal += r.macros.her.kcal; tot.her.p += r.macros.her.p;
    tot.him.kcal += r.macros.him.kcal; tot.him.p += r.macros.him.p;
  }
  return tot;
}

function renderBlock(block, slots) {
  const tot = blockTotals(block.id, slots);
  return `
    <section class="plan-block plan-block-${block.id.toLowerCase()}">
      <div class="plan-block-head">
        <div class="plan-block-days">${block.days.toUpperCase()}</div>
        <div class="plan-block-title">${block.id === 'A' ? 'Block A' : 'Block B'} · ${block.numDays} days</div>
      </div>
      <div class="plan-meals">
        ${SLOTS.map((s) => renderMealForSlot(block.id, s, slots[s])).join('')}
      </div>
      <div class="plan-totals">
        <div><span class="plan-tot-label">Dar daily total</span><b>${tot.her.kcal.toLocaleString()} kcal · ${tot.her.p}g P</b></div>
        <div><span class="plan-tot-label">Alison daily total</span><b>${tot.him.kcal.toLocaleString()} kcal · ${tot.him.p}g P</b></div>
      </div>
    </section>
  `;
}

function renderAll() {
  const root = document.getElementById('plan-root');
  if (!root) return;
  const plan = loadWeekPlan();
  root.innerHTML = BLOCKS.map((b) => renderBlock(b, plan[b.id])).join('');
}

// ============================================================
// Picker modal — pick a recipe for a given slot
// ============================================================
let pickerEl = null;
function openPicker(blockId, slot) {
  if (pickerEl) pickerEl.remove();
  const block = BLOCKS.find((b) => b.id === blockId);
  const candidates = Object.entries(RECIPES)
    .filter(([id, r]) => r.slot === slot)
    .sort(([, a], [, b]) => {
      // prefer the block's default protein first
      if (a.protein === block.defaultProtein && b.protein !== block.defaultProtein) return -1;
      if (b.protein === block.defaultProtein && a.protein !== block.defaultProtein) return 1;
      return a.name.localeCompare(b.name);
    });
  const currentId = loadWeekPlan()[blockId][slot];

  pickerEl = document.createElement('div');
  pickerEl.className = 'rtc-img-chooser-backdrop';
  const card = document.createElement('div');
  card.className = 'rtc-img-chooser plan-picker';
  card.innerHTML = `
    <div class="rtc-img-chooser-head">
      <div class="rtc-img-chooser-title">${SLOT_LABELS[slot]} — Block ${blockId} (${block.days})</div>
      <button type="button" class="rtc-img-chooser-close" aria-label="Close">×</button>
    </div>
    <div class="plan-picker-list">
      ${candidates.map(([id, r]) => `
        <button type="button" class="plan-picker-opt ${id === currentId ? 'active' : ''}" data-recipe="${id}">
          <div class="plan-picker-opt-head">
            <span class="plan-picker-opt-name">${r.name}</span>
            <span class="plan-picker-opt-pill plan-picker-opt-${r.protein}">${r.protein}</span>
          </div>
          <div class="plan-picker-opt-macros">♀ ${r.macros.her.kcal} kcal · ${r.macros.her.p}g P &nbsp;·&nbsp; ♂ ${r.macros.him.kcal} kcal · ${r.macros.him.p}g P</div>
        </button>
      `).join('')}
    </div>
  `;
  card.querySelector('.rtc-img-chooser-close').addEventListener('click', closePicker);
  card.querySelectorAll('.plan-picker-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      setSlotRecipe(blockId, slot, btn.dataset.recipe);
      closePicker();
      renderAll();
    });
  });
  pickerEl.appendChild(card);
  pickerEl.addEventListener('click', (e) => { if (e.target === pickerEl) closePicker(); });
  document.body.appendChild(pickerEl);
}
function closePicker() {
  if (pickerEl) { pickerEl.remove(); pickerEl = null; }
}

// ============================================================
// Inline editing of quantities
// ============================================================
function startEdit(td) {
  if (td.querySelector('input')) return;
  const recipeId = td.dataset.recipe;
  const ing      = td.dataset.ing;
  const person   = td.dataset.person;
  const unit     = td.dataset.unit;
  const defaultQty = Number(td.dataset.default);
  const current  = getEffectiveQty(recipeId, ing, person, defaultQty);

  td.innerHTML = `
    <div class="qty-edit">
      <input type="number" inputmode="decimal" step="0.5" min="0" value="${current}" />
      <span class="qty-edit-unit">${unit}</span>
      <button type="button" class="qty-edit-save">✓</button>
      <button type="button" class="qty-edit-cancel">✕</button>
    </div>
  `;
  const input = td.querySelector('input');
  input.focus(); input.select();

  const finish = (save) => {
    if (save) {
      const v = Number(input.value);
      if (Number.isFinite(v) && v >= 0) {
        if (v === defaultQty) {
          const o = loadOverrides();
          if (o[recipeId]?.[ing]) {
            delete o[recipeId][ing][person];
            if (Object.keys(o[recipeId][ing]).length === 0) delete o[recipeId][ing];
            if (Object.keys(o[recipeId]).length === 0) delete o[recipeId];
            saveJson(OVERRIDES_KEY, o);
          }
        } else {
          setOverride(recipeId, ing, person, v);
        }
      }
    }
    renderAll();
  };

  td.querySelector('.qty-edit-save').addEventListener('click', () => finish(true));
  td.querySelector('.qty-edit-cancel').addEventListener('click', () => finish(false));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  finish(true);
    if (e.key === 'Escape') finish(false);
  });
}

// ============================================================
// Event delegation
// ============================================================
document.addEventListener('click', (e) => {
  const cell = e.target.closest('td.qty');
  if (cell && !cell.querySelector('input')) { startEdit(cell); return; }

  const change = e.target.closest('.plan-meal-change');
  if (change) { openPicker(change.dataset.block, change.dataset.slot); return; }

  const reset = e.target.closest('.plan-meal-reset');
  if (reset) {
    if (confirm("Reset this meal's quantities to the defaults?")) {
      clearRecipeOverrides(reset.dataset.recipe);
      renderAll();
    }
  }
});

renderAll();
