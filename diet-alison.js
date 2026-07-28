// Alison's carb-cycled diet. Day-picker defaults to today; renders that day's
// meals + macros + supplement timing. Meals are tap-to-check with a daily reset.
//
// Storage keys:
//   rtc_diet_alison_day_v1     — last selected weekday
//   rtc_diet_alison_checks_v1  — { date, map:{ 'mon|Breakfast': true } }, auto-reset daily

const DAY_KEY   = 'rtc_diet_alison_day_v1';
const CHECK_KEY = 'rtc_diet_alison_checks_v1';

const WEEK = {
  mon: { type: 'EASY', train: 'Upper A (am) · swim + sauna (pm)' },
  tue: { type: 'MOD',  train: 'RTC functional (am) · Lower gym or run (pm)' },
  wed: { type: 'EASY', train: 'Upper B (am) · swim + sauna (pm)' },
  thu: { type: 'MOD',  train: 'Muay Thai w/ RTC (am) · Lower gym or run (pm)' },
  fri: { type: 'HIGH', train: 'Upper C (am) · swim + sauna · carb-load' },
  sat: { type: 'PEAK', train: 'HYROX circuit (600 m runs) · morning' },
  sun: { type: 'EASY', train: 'Rest day — maybe pool with Darlene' },
};

// CUT PHASE (Aug → mid-Oct, set Jul 28): 16:8 fasting, eating window
// 8:30am–4:30pm. ~350 kcal/day deficit → ~0.7 lb/week → ~199-200 lb at race
// time. Protein held ~205g+ to keep muscle. Shake/MRE-first for practicality.
// Tue/Thu Lower-gym evenings: protein bar or shake after is the ONE allowed
// exception outside the window. Saturday PEAK = no fasting, fuel the race.
// After the race: hold maintenance briefly, then clean bulk.
const MACROS = {
  EASY: { kcal: 2250, p: 205, c: 190, f: 70 },
  MOD:  { kcal: 2350, p: 210, c: 215, f: 68 },
  HIGH: { kcal: 2700, p: 205, c: 300, f: 75 },
  PEAK: { kcal: 3000, p: 210, c: 340, f: 80 },
};

// 16:8 layout — fasted from 4:30pm to 8:30am. Pre-workout (Ghost/creatine/
// black coffee) doesn't break the fast. Shake/MRE-first so meals are fast and
// light on the stomach. PEAK (Saturday) ignores the fast — race fuel wins.
const MEALS = {
  EASY: [
    { time: '5:20 AM',  name: 'Pre-workout', fuel: 'Fasted — Ghost + creatine + black coffee don\'t break the fast. Rest Sunday: just creatine + coffee, sleep in', items: ['Ghost ½ scoop', 'Creatine 5g', 'Black coffee'] },
    { time: '8:30 AM',  name: 'Breakfast', tag: 'MRE', fuel: 'Window opens — post-workout shake, 90 min after the AM lift · real-food swap: 4 boiled eggs + 1 scoop whey + 1 banana', items: ['1 MRE (4 scoops)', '1 banana'] },
    { time: '12:15 PM', name: 'Lunch',       items: ['200g chicken', '150g rice', '200g veg', '1 tbsp olive oil (or ½ avocado)'] },
    { time: '4:00 PM',  name: 'Pre-gym meal', tag: 'SHAKE', fuel: 'Last meal — window closes 4:30. After: water, tea, black coffee only', items: ['2 scoops whey', '50g oats (blend in)', '200g Greek yogurt', '1 tbsp peanut butter (or 20g almonds)', '1 apple'] },
  ],
  MOD: [
    { time: '5:20 AM',  name: 'Pre-workout', fuel: 'Fasted — Ghost + creatine + black coffee don\'t break the fast', items: ['Ghost ½ scoop', 'Creatine 5g', 'Black coffee'] },
    { time: '8:30 AM',  name: 'Breakfast', tag: 'MRE', fuel: 'Window opens — recovery after the RTC/Muay Thai session · real-food swap: 4 boiled eggs + 1 scoop whey + 1 banana', items: ['1 MRE (4 scoops)', '1 banana'] },
    { time: '12:15 PM', name: 'Lunch',       items: ['200g chicken', '180g rice', '200g veg', '1 tbsp olive oil (or ½ avocado)'] },
    { time: '4:00 PM',  name: 'Pre-gym meal', tag: 'SHAKE', fuel: 'Fuels the 5pm Lower session — window closes 4:30', items: ['2 scoops whey', '60g oats (blend in)', '150g Greek yogurt', '1 banana'] },
    { time: '6:30 PM',  name: 'Post-Lower shake', tag: 'LEG DAY ONLY', fuel: 'The one allowed exception — protein only, ONLY after a Lower gym session (skip if you ran instead)', items: ['Protein bar OR 1 scoop whey in water'] },
  ],
  HIGH: [
    { time: '5:20 AM',  name: 'Pre-workout', fuel: 'Fasted — Ghost + creatine + black coffee don\'t break the fast', items: ['Ghost full scoop', 'Creatine 5g', 'Black coffee'] },
    { time: '8:30 AM',  name: 'Breakfast', tag: 'MRE', fuel: 'Carb-load starts — glycogen for tomorrow\'s Hyrox circuit', items: ['1 MRE (4 scoops)', '1 banana', '30g dates'] },
    { time: '12:15 PM', name: 'Lunch',       items: ['200g chicken', '250g rice', '200g veg', '1 tbsp olive oil'] },
    { time: '4:00 PM',  name: 'Pre-swim meal', tag: 'SHAKE', fuel: 'Big carb finish — window closes 4:30, wake up race-ready', items: ['2 scoops whey', '80g oats (blend in)', '40g dates', '1 banana'] },
  ],
  PEAK: [
    { time: '6:30 AM',  name: 'Race breakfast', tag: 'NO FAST TODAY', fuel: 'Race day — fasting loses, fuel wins. Eat ~1.5-2h before the circuit', items: ['1 MRE (4 scoops)', '1 banana', '30g dates', 'Creatine 5g'] },
    { time: '11:30 AM', name: 'Post-race lunch', fuel: 'Recovery — refill what the circuit burned', items: ['200g chicken', '250g rice', '200g veg', '1 tbsp olive oil'] },
    { time: '3:30 PM',  name: 'Snack',       items: ['200g Greek yogurt', '1 apple', '25g almonds'] },
    { time: '6:30 PM',  name: 'Dinner',      items: ['150g beef', '300g potato', '150g broccoli', '1 tbsp olive oil'] },
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
