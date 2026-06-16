// Diet plan data + render + edit logic.
//
// The plan is sourced from Darlene's nutritionist (Nayanna Percy Costa,
// CRN11:2259, prescribed 2026-06-10, pregnancy week 28+). See
// plan-source.html for the verbatim PDF text used as the source of truth.
//
// Quantities are explicit per person (her = Darlene's prescribed amounts,
// him = Alison's scaled amounts ≈ 1.4–1.6× depending on the item).
//
// The user can override any quantity inline — the override saves to
// localStorage and is shown the next time the page loads. "Reset" reverts
// a meal back to the nutritionist's defaults.

const OVERRIDES_KEY = 'rtc_plan_overrides_v1';
const OVERRIDES_SYNC_NOTE = 'overrides are stored locally per device for now';

// ============================================================
// THE PLAN — single source of truth
// ============================================================
// Each meal: id, time, label, recipeId (for linking), ingredients (per
// person amounts), and reference macros computed at the default quantities.
// Daily / shared meals are repeated in each block for clarity.

const DAILY_MEALS = {
  breakfast: {
    id: 'breakfast',
    time: '07:00',
    label: 'Breakfast',
    recipeId: 'dar_breakfast',
    name: 'Egg & Cottage Cheese Toast + Pear + Chia',
    ingredients: [
      { id: 'eggs',    name: 'Boiled eggs',
        her: { qty: 100, unit: 'g', display: '2 medium' },
        him: { qty: 150, unit: 'g', display: '3 medium' } },
      { id: 'cottage', name: 'Cottage cheese (lactose-free for Dar)',
        her: { qty: 75,  unit: 'g' },
        him: { qty: 100, unit: 'g' } },
      { id: 'bread',   name: 'Whole-wheat bread',
        her: { qty: 50,  unit: 'g', display: '2 slices' },
        him: { qty: 75,  unit: 'g', display: '3 slices' } },
      { id: 'fruit',   name: 'Fruit (Dar: pear · Alison: banana)',
        her: { qty: 110, unit: 'g', display: '1 medium pear' },
        him: { qty: 120, unit: 'g', display: '1 medium banana' } },
      { id: 'chia',    name: 'Chia seeds',
        her: { qty: 30,  unit: 'g', display: '2 tbsp' },
        him: { qty: 30,  unit: 'g', display: '2 tbsp' } },
    ],
    macros: { her: { kcal: 562, p: 35, c: 56, f: 23 },
              him: { kcal: 767, p: 44, c: 79, f: 31 } },
  },
  snack: {
    id: 'snack',
    time: '16:00',
    label: 'Afternoon Snack (smoothie)',
    recipeId: 'dar_snack_smoothie',
    name: 'Banana Protein Smoothie',
    ingredients: [
      { id: 'banana',   name: 'Banana',
        her: { qty: 40,  unit: 'g', display: '1 small' },
        him: { qty: 40,  unit: 'g', display: '1 small' } },
      { id: 'oat_bran', name: 'Oat bran',
        her: { qty: 30,  unit: 'g', display: '3 tbsp' },
        him: { qty: 30,  unit: 'g', display: '3 tbsp' } },
      { id: 'whey',     name: 'Whey isolate protein',
        her: { qty: 30,  unit: 'g', display: '1 scoop' },
        him: { qty: 30,  unit: 'g', display: '1 scoop' } },
      { id: 'water',    name: 'Cold water',
        her: { qty: 300, unit: 'mL' },
        him: { qty: 300, unit: 'mL' } },
    ],
    macros: { her: { kcal: 227, p: 31, c: 27, f: 3 },
              him: { kcal: 227, p: 31, c: 27, f: 3 } },
  },
  evening: {
    id: 'evening',
    time: '21:30',
    label: 'Evening Snack',
    recipeId: 'dar_evening_snack',
    name: 'Greek Yogurt + Ground Flaxseed',
    ingredients: [
      { id: 'yogurt',   name: 'Plain full-fat Greek yogurt',
        her: { qty: 100, unit: 'g' },
        him: { qty: 200, unit: 'g' } },
      { id: 'flaxseed', name: 'Ground flaxseed',
        her: { qty: 20,  unit: 'g', display: '2 dessert spoons' },
        him: { qty: 20,  unit: 'g', display: '2 dessert spoons' } },
    ],
    macros: { her: { kcal: 207, p: 13, c: 10, f: 13 },
              him: { kcal: 307, p: 22, c: 14, f: 18 } },
  },
};

const PLAN = {
  source: { author: 'Nayanna Percy Costa (CRN11:2259)', date: '2026-06-10', context: 'pregnancy week 28+' },
  blocks: [
    {
      id: 'A', days: 'Mon · Tue · Wed', title: 'Chicken Plate',
      meals: [
        DAILY_MEALS.breakfast,
        {
          id: 'lunch_a', time: '12:30', label: 'Lunch', recipeId: 'dar_lunch_chicken',
          name: 'Chicken & Rice Plate w/ Lentils',
          ingredients: [
            { id: 'chicken', name: 'Grilled chicken breast (cooked)',
              her: { qty: 150, unit: 'g' }, him: { qty: 220, unit: 'g' } },
            { id: 'rice',    name: 'Brown rice (cooked)',
              her: { qty: 100, unit: 'g', display: '5 heaping tbsp' },
              him: { qty: 150, unit: 'g' } },
            { id: 'lentils', name: 'Lentils (cooked)',
              her: { qty: 54,  unit: 'g', display: '2 heaping tbsp' },
              him: { qty: 80,  unit: 'g' } },
            { id: 'veg',     name: 'Steamed mixed veggies (broccoli, zucchini, carrot)',
              her: { qty: 110, unit: 'g' }, him: { qty: 110, unit: 'g' } },
            { id: 'salad',   name: 'Raw salad (lettuce, tomato, onion)',
              her: { qty: 70,  unit: 'g' }, him: { qty: 70,  unit: 'g' } },
            { id: 'oil',     name: 'Extra-virgin olive oil',
              her: { qty: 14,  unit: 'g', display: '1 tbsp' },
              him: { qty: 21,  unit: 'g', display: '1.5 tbsp' } },
            { id: 'orange',  name: 'Orange',
              her: { qty: 90,  unit: 'g', display: '1 small' },
              him: { qty: 130, unit: 'g', display: '1 medium' } },
          ],
          macros: { her: { kcal: 630, p: 57, c: 55, f: 21 },
                    him: { kcal: 879, p: 76, c: 78, f: 30 } },
        },
        DAILY_MEALS.snack,
        {
          id: 'dinner_a', time: '19:00', label: 'Dinner', recipeId: 'dar_dinner_chicken',
          name: 'Shredded Chicken Wrap + Veg',
          ingredients: [
            { id: 'chicken_sh', name: 'Shredded chicken (cooked)',
              her: { qty: 120, unit: 'g' }, him: { qty: 170, unit: 'g' } },
            { id: 'wrap',       name: 'Whole-wheat wrap',
              her: { qty: 30,  unit: 'g', display: '1 wrap' },
              him: { qty: 45,  unit: 'g', display: '1.5 wraps' } },
            { id: 'veg_d',      name: 'Steamed mixed veggies',
              her: { qty: 110, unit: 'g' }, him: { qty: 110, unit: 'g' } },
            { id: 'lettuce',    name: 'Iceberg lettuce',
              her: { qty: 48,  unit: 'g', display: '2 leaves' },
              him: { qty: 48,  unit: 'g', display: '2 leaves' } },
            { id: 'oil_d',      name: 'Extra-virgin olive oil',
              her: { qty: 14,  unit: 'g', display: '1 tbsp' },
              him: { qty: 21,  unit: 'g', display: '1.5 tbsp' } },
            { id: 'pineapple',  name: 'Pineapple',
              her: { qty: 75,  unit: 'g', display: '1 slice' },
              him: { qty: 75,  unit: 'g', display: '1 slice' } },
          ],
          macros: { her: { kcal: 478, p: 43, c: 32, f: 19 },
                    him: { kcal: 660, p: 60, c: 39, f: 29 } },
        },
        DAILY_MEALS.evening,
      ],
      totals: { her: { kcal: 2104, p: 179, c: 180, f: 79 },
                him: { kcal: 2840, p: 234, c: 234, f: 110 } },
    },
    {
      id: 'B', days: 'Thu · Fri · Sat · Sun', title: 'Lean Beef Plate',
      meals: [
        DAILY_MEALS.breakfast,
        {
          id: 'lunch_b', time: '12:30', label: 'Lunch', recipeId: 'dar_lunch_beef',
          name: 'Lean Beef & Rice w/ Black Beans',
          ingredients: [
            { id: 'beef',    name: 'Lean ground beef (93/7), sautéed',
              her: { qty: 75,  unit: 'g', display: '3 tbsp' },
              him: { qty: 150, unit: 'g' } },
            { id: 'rice_b',  name: 'Brown rice (cooked)',
              her: { qty: 100, unit: 'g' }, him: { qty: 150, unit: 'g' } },
            { id: 'beans',   name: 'Black beans (cooked, drained)',
              her: { qty: 68,  unit: 'g', display: '4 tbsp' },
              him: { qty: 130, unit: 'g' } },
            { id: 'veg_b',   name: 'Steamed mixed veggies',
              her: { qty: 110, unit: 'g' }, him: { qty: 110, unit: 'g' } },
            { id: 'salad_b', name: 'Raw salad (lettuce, tomato, onion)',
              her: { qty: 70,  unit: 'g' }, him: { qty: 70,  unit: 'g' } },
            { id: 'oil_b',   name: 'Extra-virgin olive oil',
              her: { qty: 14,  unit: 'g', display: '1 tbsp' },
              him: { qty: 21,  unit: 'g', display: '1.5 tbsp' } },
            { id: 'orange_b',name: 'Orange',
              her: { qty: 90,  unit: 'g', display: '1 small' },
              him: { qty: 130, unit: 'g', display: '1 medium' } },
          ],
          macros: { her: { kcal: 574, p: 33, c: 62, f: 24 },
                    him: { kcal: 920, p: 58, c: 90, f: 39 } },
        },
        DAILY_MEALS.snack,
        {
          id: 'dinner_b', time: '19:00', label: 'Dinner', recipeId: 'dar_dinner_beef',
          name: 'Lean Beef Wrap + Veg',
          ingredients: [
            { id: 'beef_d',   name: 'Lean ground beef (93/7), sautéed',
              her: { qty: 62.5, unit: 'g', display: '2½ heaping tbsp' },
              him: { qty: 125,  unit: 'g' } },
            { id: 'wrap_b',   name: 'Whole-wheat wrap',
              her: { qty: 30,  unit: 'g', display: '1 wrap' },
              him: { qty: 45,  unit: 'g', display: '1.5 wraps' } },
            { id: 'veg_bd',   name: 'Steamed mixed veggies',
              her: { qty: 110, unit: 'g' }, him: { qty: 110, unit: 'g' } },
            { id: 'lettuce_b',name: 'Iceberg lettuce',
              her: { qty: 48,  unit: 'g', display: '2 leaves' },
              him: { qty: 48,  unit: 'g', display: '2 leaves' } },
            { id: 'oil_bd',   name: 'Extra-virgin olive oil',
              her: { qty: 14,  unit: 'g', display: '1 tbsp' },
              him: { qty: 21,  unit: 'g', display: '1.5 tbsp' } },
            { id: 'pineapple_b', name: 'Pineapple',
              her: { qty: 75,  unit: 'g', display: '1 slice' },
              him: { qty: 75,  unit: 'g', display: '1 slice' } },
          ],
          macros: { her: { kcal: 418, p: 23, c: 32, f: 22 },
                    him: { kcal: 640, p: 42, c: 39, f: 36 } },
        },
        DAILY_MEALS.evening,
      ],
      totals: { her: { kcal: 1988, p: 135, c: 187, f: 85 },
                him: { kcal: 2861, p: 197, c: 234, f: 117 } },
    },
  ],
};

// ============================================================
// Overrides (per-ingredient quantity edits, stored in localStorage)
// ============================================================
function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}'); }
  catch { return {}; }
}
function saveOverrides(o) {
  try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o)); } catch {}
}
function setOverride(mealId, ingId, person, qty) {
  const o = loadOverrides();
  o[mealId] = o[mealId] || {};
  o[mealId][ingId] = o[mealId][ingId] || {};
  o[mealId][ingId][person] = qty;
  saveOverrides(o);
}
function clearMealOverrides(mealId) {
  const o = loadOverrides();
  delete o[mealId];
  saveOverrides(o);
}
function getEffectiveQty(mealId, ingId, person, defaultQty) {
  const o = loadOverrides();
  const v = o?.[mealId]?.[ingId]?.[person];
  return (typeof v === 'number' && !Number.isNaN(v)) ? v : defaultQty;
}
function mealHasOverrides(mealId) {
  const o = loadOverrides();
  return !!o[mealId] && Object.keys(o[mealId]).length > 0;
}

// ============================================================
// Rendering
// ============================================================
function fmtQty(qty, unit, display) {
  const num = Number.isInteger(qty) ? qty : Math.round(qty * 10) / 10;
  if (display) return `<b>${num}${unit}</b><span class="qty-display"> · ${display}</span>`;
  return `<b>${num}${unit}</b>`;
}

function renderIngredientRow(mealId, ing) {
  const herQty = getEffectiveQty(mealId, ing.id, 'her', ing.her.qty);
  const himQty = getEffectiveQty(mealId, ing.id, 'him', ing.him.qty);
  return `
    <tr>
      <td class="qty her-qty" data-meal="${mealId}" data-ing="${ing.id}" data-person="her" data-unit="${ing.her.unit}" data-default="${ing.her.qty}">
        ${fmtQty(herQty, ing.her.unit, ing.her.display)}
      </td>
      <td class="ing-name">${ing.name}</td>
      <td class="qty him-qty" data-meal="${mealId}" data-ing="${ing.id}" data-person="him" data-unit="${ing.him.unit}" data-default="${ing.him.qty}">
        ${fmtQty(himQty, ing.him.unit, ing.him.display)}
      </td>
    </tr>
  `;
}

function renderMeal(meal) {
  const hasOv = mealHasOverrides(meal.id);
  return `
    <div class="plan-meal" data-meal-id="${meal.id}">
      <div class="plan-meal-head">
        <div class="plan-meal-head-text">
          <div class="plan-meal-time">${meal.time} · ${meal.label}</div>
          <a class="plan-meal-name" href="recipes.html#${meal.recipeId}">${meal.name}</a>
        </div>
        ${hasOv ? `<button type="button" class="plan-meal-reset" data-meal="${meal.id}" title="Reset to nutritionist's defaults">↺ reset</button>` : ''}
      </div>
      <table class="plan-ingredients">
        <thead>
          <tr><th>Darlene ♀</th><th>Ingredient</th><th>Alison ♂</th></tr>
        </thead>
        <tbody>
          ${meal.ingredients.map((ing) => renderIngredientRow(meal.id, ing)).join('')}
        </tbody>
      </table>
      <div class="plan-meal-macros">
        <span>♀ ${meal.macros.her.kcal} kcal · ${meal.macros.her.p}g P</span>
        <span>♂ ${meal.macros.him.kcal} kcal · ${meal.macros.him.p}g P</span>
        ${hasOv ? '<span class="plan-meal-note">macros shown reflect default qty</span>' : ''}
      </div>
    </div>
  `;
}

function renderBlock(block) {
  return `
    <section class="plan-block plan-block-${block.id.toLowerCase()}">
      <div class="plan-block-head">
        <div class="plan-block-days">${block.days.toUpperCase()}</div>
        <div class="plan-block-title">${block.title}</div>
      </div>
      <div class="plan-meals">
        ${block.meals.map(renderMeal).join('')}
      </div>
      <div class="plan-totals">
        <div><span class="plan-tot-label">Dar daily total</span><b>${block.totals.her.kcal.toLocaleString()} kcal · ${block.totals.her.p}g P</b></div>
        <div><span class="plan-tot-label">Alison daily total</span><b>${block.totals.him.kcal.toLocaleString()} kcal · ${block.totals.him.p}g P</b></div>
      </div>
    </section>
  `;
}

function renderAll() {
  const root = document.getElementById('plan-root');
  if (!root) return;
  root.innerHTML = PLAN.blocks.map(renderBlock).join('');
}

// ============================================================
// Inline editing of quantities — tap a cell to edit
// ============================================================
function startEdit(td) {
  if (td.querySelector('input')) return;
  const ing = td.dataset.ing;
  const meal = td.dataset.meal;
  const person = td.dataset.person;
  const unit = td.dataset.unit;
  const defaultQty = Number(td.dataset.default);
  const current = getEffectiveQty(meal, ing, person, defaultQty);

  td.innerHTML = `
    <div class="qty-edit">
      <input type="number" inputmode="decimal" step="0.5" min="0" value="${current}" />
      <span class="qty-edit-unit">${unit}</span>
      <button type="button" class="qty-edit-save">✓</button>
      <button type="button" class="qty-edit-cancel">✕</button>
    </div>
  `;
  const input = td.querySelector('input');
  input.focus();
  input.select();

  const cancel = () => repaintCell(td, getEffectiveQty(meal, ing, person, defaultQty), unit, currentDisplay(meal, ing, person));
  const save = () => {
    const v = Number(input.value);
    if (Number.isFinite(v) && v >= 0) {
      if (v === defaultQty) {
        const o = loadOverrides();
        if (o[meal]) { delete o[meal][ing]?.[person]; if (Object.keys(o[meal][ing] || {}).length === 0) delete o[meal][ing]; if (Object.keys(o[meal]).length === 0) delete o[meal]; saveOverrides(o); }
      } else {
        setOverride(meal, ing, person, v);
      }
    }
    renderAll(); // re-render so reset button etc. updates
  };

  td.querySelector('.qty-edit-save').addEventListener('click', save);
  td.querySelector('.qty-edit-cancel').addEventListener('click', cancel);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  });
}

function currentDisplay(mealId, ingId, person) {
  for (const block of PLAN.blocks) {
    for (const meal of block.meals) {
      if (meal.id !== mealId) continue;
      const ing = meal.ingredients.find((i) => i.id === ingId);
      if (ing) return ing[person].display;
    }
  }
  return null;
}

function repaintCell(td, qty, unit, display) {
  td.innerHTML = fmtQty(qty, unit, display);
}

// ============================================================
// Wire up event delegation
// ============================================================
document.addEventListener('click', (e) => {
  const cell = e.target.closest('td.qty');
  if (cell && !cell.querySelector('input')) { startEdit(cell); return; }

  const resetBtn = e.target.closest('.plan-meal-reset');
  if (resetBtn) {
    if (confirm("Reset this meal back to the nutritionist's defaults?")) {
      clearMealOverrides(resetBtn.dataset.meal);
      renderAll();
    }
  }
});

renderAll();
