// Alison's carb-cycled diet. Day-picker defaults to today; renders that day's
// meals + macros + supplement timing. Meals are tap-to-check with a daily reset.
//
// Storage keys:
//   rtc_diet_alison_day_v1     — last selected weekday
//   rtc_diet_alison_checks_v1  — { date, map:{ 'mon|Breakfast': true } }, auto-reset daily

const DAY_KEY   = 'rtc_diet_alison_day_v1';
const CHECK_KEY = 'rtc_diet_alison_checks_v1';

const WEEK = {
  mon: { type: 'MOD',  train: 'Gym: Lower A · 5K run after work' },
  tue: { type: 'MOD',  train: 'RTC functional 6am · Upper A after work' },
  wed: { type: 'MOD',  train: 'Gym: Lower B · 5K run after work' },
  thu: { type: 'MOD',  train: 'Boxing / Muay Thai · after work' },
  fri: { type: 'HIGH', train: 'Gym: Upper B · carb-load for Saturday' },
  sat: { type: 'PEAK', train: 'HYROX race sim · morning' },
  sun: { type: 'EASY', train: 'Swim (morning) · volleyball 6pm' },
};

const MACROS = {
  EASY: { kcal: 2955, p: 223, c: 207, f: 137 },
  MOD:  { kcal: 2955, p: 218, c: 284, f: 105 },
  HIGH: { kcal: 3167, p: 207, c: 369, f: 96 },
  PEAK: { kcal: 3380, p: 217, c: 405, f: 98 },
};

const MEALS = {
  EASY: [
    { time: '5:30 AM',  name: 'Pre-workout', items: ['Ghost ½ scoop', 'Creatine 5g'] },
    { time: '7:15 AM',  name: 'Breakfast',   items: ['3 eggs', '1 scoop whey', '45g oats', '15g chia', '120g berries'] },
    { time: '12:15 PM', name: 'Lunch',       items: ['150g chicken', '150g rice', '200g veg', '1 avocado', '1 tbsp olive oil'] },
    { time: '3:30 PM',  name: 'Snack',       items: ['90g turkey', '40g cheese', '1 apple', '35g almonds'] },
    { time: '6:30 PM',  name: 'Dinner',      items: ['150g beef', '200g potato', '150g broccoli', '1 tbsp olive oil'] },
    { time: '8:00 PM',  name: 'Pre-bed',     items: ['150g Greek yogurt', '2 tbsp peanut butter'] },
  ],
  MOD: [
    { time: '5:30 AM',  name: 'Pre-workout', items: ['Ghost ½ scoop', 'Creatine 5g'] },
    { time: '7:15 AM',  name: 'Breakfast',   items: ['3 eggs', '1 scoop whey', '70g oats', '120g berries'] },
    { time: '12:15 PM', name: 'Lunch',       items: ['150g chicken', '190g rice', '200g veg', '½ avocado', '1 tbsp olive oil'] },
    { time: '3:30 PM',  name: 'Snack',       items: ['90g turkey', '40g cheese', '1 apple', '40g dates', '25g almonds'] },
    { time: '6:30 PM',  name: 'Dinner', fuel: 'Carb-loaded → recovery + tops off glycogen for tomorrow', items: ['150g beef', '230g potato', '150g broccoli', '1 tbsp olive oil'] },
    { time: '8:00 PM',  name: 'Pre-bed',     items: ['150g Greek yogurt', '1 banana'] },
  ],
  HIGH: [
    { time: '5:30 AM',  name: 'Pre-workout', items: ['Ghost full scoop', '1 banana', 'Creatine 5g'] },
    { time: '7:15 AM',  name: 'Breakfast', tag: 'MRE', items: ['1 MRE (4 scoops)', '1 banana', '25g almonds'] },
    { time: '12:15 PM', name: 'Lunch',       items: ['120g chicken', '180g rice', '200g veg', 'small avocado', '1 tbsp olive oil'] },
    { time: '3:30 PM',  name: 'Snack', tag: 'MRE', items: ['1 MRE', '1 apple', '15g almonds'] },
    { time: '6:30 PM',  name: 'Dinner',      items: ['100g beef', '220g potato', '150g broccoli', '1 tbsp olive oil'] },
    { time: '8:00 PM',  name: 'Pre-bed',     items: ['150g Greek yogurt', '1 banana', '1 tbsp peanut butter'] },
  ],
  PEAK: [
    { time: '5:30 AM',  name: 'Pre-workout', items: ['Ghost full scoop', '1 large banana', 'Creatine 5g'] },
    { time: '7:15 AM',  name: 'Breakfast', tag: 'MRE', items: ['1 MRE (4 scoops)', '1 banana', '25g almonds'] },
    { time: '12:15 PM', name: 'Lunch',       items: ['130g chicken', '200g rice', '200g veg', 'small avocado', '1 tbsp olive oil'] },
    { time: '3:30 PM',  name: 'Snack', tag: 'MRE', items: ['1 MRE', '1 apple', '20g almonds'] },
    { time: '6:30 PM',  name: 'Dinner',      items: ['120g beef', '350g potato', '150g broccoli', '1 tbsp olive oil'] },
    { time: '8:00 PM',  name: 'Pre-bed',     items: ['150g Greek yogurt', '1 banana', '1 tbsp peanut butter'] },
  ],
};

// ---- storage helpers ----
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function todayStr() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// checks auto-reset each calendar day
let checkStore = loadJSON(CHECK_KEY, { date: '', map: {} });
if (checkStore.date !== todayStr()) {
  checkStore = { date: todayStr(), map: {} };
  saveJSON(CHECK_KEY, checkStore);
}
const checks = checkStore.map;
function persistChecks() {
  checkStore.date = todayStr();
  checkStore.map = checks;
  saveJSON(CHECK_KEY, checkStore);
}

// ---- render ----
const root = document.getElementById('diet-root');

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function mealHTML(day, meal) {
  const key = day + '|' + meal.name;
  const done = !!checks[key];
  return `
    <div class="diet-meal ${done ? 'done' : ''}" data-key="${esc(key)}">
      <button type="button" class="diet-check" aria-label="Mark eaten">✓</button>
      <div class="diet-meal-body">
        <div class="diet-meal-head">
          <span class="diet-meal-name">${esc(meal.name)}${meal.tag ? `<span class="diet-meal-tag">${esc(meal.tag)}</span>` : ''}</span>
          <span class="diet-meal-time">${esc(meal.time)}</span>
        </div>
        <div class="diet-meal-items">${meal.items.map(esc).join(' · ')}</div>
        ${meal.fuel ? `<div class="diet-meal-fuel">${esc(meal.fuel)}</div>` : ''}
      </div>
    </div>`;
}

function render(day) {
  const info = WEEK[day];
  const m = MACROS[info.type];
  const meals = MEALS[info.type];
  root.innerHTML = `
    <div class="diet-daymeta">
      <span class="dt-badge dt-${info.type}">${info.type}</span>
      <span class="diet-train">${esc(info.train)}</span>
    </div>
    <div class="diet-kcal">
      <div><span>Calories</span><b>${m.kcal.toLocaleString()}</b></div>
      <div><span>Protein</span><b>${m.p}g</b></div>
      <div><span>Carbs</span><b>${m.c}g</b></div>
      <div><span>Fat</span><b>${m.f}g</b></div>
    </div>
    ${meals.map((meal) => mealHTML(day, meal)).join('')}
    <button type="button" class="diet-resetbtn" id="diet-reset">Reset today’s checks</button>
  `;
}

// ---- day switching ----
const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const today = dayMap[new Date().getDay()];
let currentDay;
try { currentDay = localStorage.getItem(DAY_KEY) || today; } catch { currentDay = today; }
if (!WEEK[currentDay]) currentDay = today;

function switchDay(day) {
  currentDay = day;
  try { localStorage.setItem(DAY_KEY, day); } catch {}
  document.querySelectorAll('.day-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.day === day)
  );
  render(day);
}

document.querySelectorAll('.day-btn').forEach((b) => {
  b.addEventListener('click', () => switchDay(b.dataset.day));
});

// ---- interactions (delegated) ----
root.addEventListener('click', (e) => {
  const reset = e.target.closest('#diet-reset');
  if (reset) {
    MEALS[WEEK[currentDay].type].forEach((meal) => { delete checks[currentDay + '|' + meal.name]; });
    persistChecks();
    render(currentDay);
    return;
  }
  const cell = e.target.closest('.diet-meal');
  if (cell) {
    const key = cell.dataset.key;
    if (checks[key]) delete checks[key]; else checks[key] = true;
    cell.classList.toggle('done', !!checks[key]);
    persistChecks();
  }
});

switchDay(currentDay);
