// Alison's carb-cycled diet. Day-picker defaults to today; renders that day's
// meals + macros + supplement timing. Meals are tap-to-check with a daily reset.
//
// Storage keys:
//   rtc_diet_alison_day_v1     — last selected weekday
//   rtc_diet_alison_checks_v1  — { date, map:{ 'mon|Breakfast': true } }, auto-reset daily

const DAY_KEY   = 'rtc_diet_alison_day_v1';
const CHECK_KEY = 'rtc_diet_alison_checks_v1';

// HYROX race block (from Sep 28, 2026) — day types follow the Race Plan:
// Tue/Thu coached circuits (5:30 AM) + Sat run session hard, Mon/Wed/Sun
// training, Fri rest (or an easy run + core).
const WEEK = {
  mon: { type: 'MOD',  train: 'Strength B full body (5:15) · volleyball for fun 7–9' },
  tue: { type: 'HIGH', train: 'RTC coached HYROX circuit (5:30 AM) — hard day', coach: true },
  wed: { type: 'MOD',  train: 'Strength A legs (5:00) + upper strength (6:00)' },
  thu: { type: 'HIGH', train: 'RTC coached HYROX circuit (5:30 AM) — hard day', coach: true },
  fri: { type: 'EASY', train: 'Rest — or easy run + core if you slept well' },
  sat: { type: 'PEAK', train: 'Saturday 9 AM: your full HYROX circuit or run intervals (they alternate) — hard day' },
  sun: { type: 'MOD',  train: 'Long easy run (9:00 AM)' },
};

// Calories by day type, built from one simple meal prep (see PLANS).
// Protein ~2–2.4 g/kg every day; fat ~30% of calories (low-fat diets lower
// testosterone and HDL); carbs scale with the day: rest < training < hard.
// Average ~3,000 kcal/day ≈ a ~300 kcal/day deficit → ~0.25–0.4 kg/week.
// Guardrails: sleep under ~6 h → add a banana + 50 g oats that day; no cut in
// weeks 11–12; ~8 g/kg carbs the day before the race.
// Personal numbers (labs, scans) live only in the database, never in here.

const MACROS = {
  // Totals of the plan below (rice + alternating chicken / lean beef).
  EASY: { kcal: 2500, p: 185, c: 225, f: 88 },
  MOD:  { kcal: 2800, p: 205, c: 275, f: 95 },
  HIGH: { kcal: 3300, p: 225, c: 365, f: 97 },
  PEAK: { kcal: 3300, p: 225, c: 365, f: 97 },
};

// The same three meals every day — one meal prep. The smoothie and the snack
// are the dials: the day type only changes the starch portion, the pre-session
// banana and the afternoon snack.
const B = ['3 eggs', '½ avocado'];
const SMOOTHIE = ['100 g strawberries', '100 g oats', '1 scoop whey', '2 scoops MRE', 'creatine 5 g'];
const plate = (starch) => [
  '200 g chicken breast or lean beef (weighed raw)',
  `${starch} g cooked rice or mashed potato`,
  '200 g greens',
  '1 tbsp olive oil',
];
const BANANA = ['1 banana', 'water + pinch of salt'];
const BAR = ['protein bar (~20 g protein)'];
const SANDWICH = ['2 slices whole-grain bread', '100 g turkey or chicken', '1 slice cheese', 'mustard / lettuce'];
const meal = (time, name, items, fuel, tag) => ({ time, name, tag: tag || '', fuel: fuel || '', items });

// Supplements ride along with the meals (full protocol on the page below).
const SUPP_AM = 'With breakfast: D3, omega-3, ashwagandha.';
const SUPP_PM = 'With dinner: omega-3, ashwagandha (if splitting the dose).';

// Day plans by schedule. Work is Mon–Fri 7:30 AM–4 PM, so on weekdays
// breakfast is before work or at the morning break (boil the eggs in the
// prep), lunch is the packed box at noon and the snack goes in the afternoon
// break. Hard days (Tue/Thu circuits, Sat) get 300 g starch per plate, a
// banana before and a sandwich instead of the bar.
const PLANS = {
  // Tue + Thu — coached circuit 5:30 AM, work 7:30
  coach: [
    meal('5:00 AM', 'Pre-circuit', BANANA, 'Small and fast. Ghost here (creatine stays in the smoothie).', 'FUEL'),
    meal('6:35 AM', 'Breakfast', B, 'Straight after the circuit, before work. ' + SUPP_AM, 'PREP'),
    meal('10:00 AM', 'Smoothie', SMOOTHIE, 'Morning break at work — blend it before you leave, keep it cold in a shaker.', 'SHAKE'),
    meal('12:00 PM', 'Lunch', plate(300), 'Packed box. Hard day: double starch.', 'PREP'),
    meal('2:30 PM', 'Sandwich', SANDWICH, 'Afternoon break — the meal that gets forgotten, pack it with the lunch box.', 'SNACK'),
    meal('6:30 PM', 'Dinner', plate(300), 'Hard day: double starch. ' + SUPP_PM, 'PREP'),
  ],
  // Mon / Wed until Oct 11 — training after work
  trainPM: [
    meal('6:45 AM', 'Breakfast', B, 'Before work. ' + SUPP_AM, 'PREP'),
    meal('10:00 AM', 'Protein bar', BAR, 'Morning break.', 'SNACK'),
    meal('12:00 PM', 'Lunch', plate(150), 'Packed box.', 'PREP'),
    meal('4:15 PM', 'Pre-session', ['1 banana'], 'Right after work, ~1 h before the gym.', 'FUEL'),
    meal('6:30 PM', 'Smoothie', SMOOTHIE, 'Straight after the session.', 'SHAKE'),
    meal('7:15 PM', 'Dinner', plate(150), 'Mondays: before volleyball if you go — have the smoothie after instead. ' + SUPP_PM, 'PREP'),
  ],
  // Mon / Wed from Oct 12 — 6 AM session, work 7:30
  trainAM: [
    meal('5:30 AM', 'Pre-session', ['1 banana'], '30 min before the 6 AM session.', 'FUEL'),
    meal('7:05 AM', 'Smoothie', SMOOTHIE, 'Straight after the session — drink it on the way to work.', 'SHAKE'),
    meal('10:00 AM', 'Breakfast', ['3 boiled eggs', '½ avocado'], 'Morning break — boil the eggs in the prep. ' + SUPP_AM, 'PREP'),
    meal('12:00 PM', 'Lunch', plate(150), 'Packed box.', 'PREP'),
    meal('2:30 PM', 'Protein bar', BAR, 'Afternoon break — fuel for Wednesday’s 4:30 session / Monday volleyball.', 'SNACK'),
    meal('6:15 PM', 'Dinner', plate(150), 'Mondays: eat before volleyball (7–9). ' + SUPP_PM, 'PREP'),
  ],
  // Sun — long easy run 9 AM
  sun: [
    meal('7:30 AM', 'Pre-run', BANANA, 'Ghost (½ scoop) if you want it.', 'FUEL'),
    meal('10:45 AM', 'Breakfast', B, 'After the run. ' + SUPP_AM, 'PREP'),
    meal('11:00 AM', 'Smoothie', SMOOTHIE, 'Recovery — with breakfast.', 'SHAKE'),
    meal('1:30 PM', 'Lunch', plate(150), 'Meal-prep day — cook the next 3–4 days.', 'PREP'),
    meal('4:30 PM', 'Protein bar', BAR, '', 'SNACK'),
    meal('7:00 PM', 'Dinner', plate(150), SUPP_PM, 'PREP'),
  ],
  // Sat — your circuit or intervals at 9 AM
  sat: [
    meal('7:30 AM', 'Pre-session', BANANA, 'Ghost here. No fasting on hard mornings.', 'FUEL'),
    meal('10:45 AM', 'Breakfast', B, 'After the session. ' + SUPP_AM, 'PREP'),
    meal('11:00 AM', 'Smoothie', SMOOTHIE, 'Recovery — with breakfast.', 'SHAKE'),
    meal('1:30 PM', 'Lunch', plate(300), 'Hard day: double starch.', 'PREP'),
    meal('4:30 PM', 'Sandwich', SANDWICH, '', 'SNACK'),
    meal('7:00 PM', 'Dinner', plate(300), 'Hard day: double starch. ' + SUPP_PM, 'PREP'),
  ],
  // Fri — rest (or easy run + core after work)
  rest: [
    meal('6:45 AM', 'Breakfast', B, 'Before work. ' + SUPP_AM, 'PREP'),
    meal('12:00 PM', 'Lunch', plate(150), 'Packed box.', 'PREP'),
    meal('2:30 PM', 'Smoothie', SMOOTHIE, 'Afternoon break — rest day, the smoothie is your snack (no bar).', 'SHAKE'),
    meal('6:30 PM', 'Dinner', plate(150), SUPP_PM, 'PREP'),
  ],
};

// From week 3 (Mon Oct 12) Mon + Wed training moves to 6–7 AM, with a second
// session 4:30–5:30 PM on Wednesday.
const AM_START = '2026-10-12';
const WEEK_AM = {
  mon: { type: 'MOD',  train: 'Strength B full body (6:00 AM) · volleyball for fun 7–9 PM' },
  tue: WEEK.tue,
  wed: { type: 'MOD',  train: 'Strength A legs (6:00 AM) + upper strength (4:30 PM)' },
  thu: WEEK.thu,
  fri: WEEK.fri, sat: WEEK.sat, sun: WEEK.sun,
};
function amPhase() { return todayStr() >= AM_START; }
function weekInfo(day) { return (amPhase() ? WEEK_AM : WEEK)[day]; }
function mealsFor(day) {
  const info = weekInfo(day);
  if (info.coach) return PLANS.coach;
  if (day === 'sat') return PLANS.sat;
  if (day === 'sun') return PLANS.sun;
  if (info.type === 'EASY') return PLANS.rest;
  return amPhase() ? PLANS.trainAM : PLANS.trainPM;
}

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
  const info = weekInfo(day);
  const m = MACROS[info.type];
  const meals = mealsFor(day);
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
    mealsFor(currentDay).forEach((meal) => { delete checks[currentDay + '|' + meal.name]; });
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
