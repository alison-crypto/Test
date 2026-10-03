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

// MAINTENANCE for weeks 1–4 of the race block (cut paused: short sleep in a
// deficit costs muscle, not fat). ~94 kg: protein ~2 g/kg every day; carbs
// ~3 g/kg rest, ~4.5 training, ~5.5 hard. Reassess from week 5 — a small
// deficit (≤0.5% body weight/week) only in weeks you sleep ≥ 6.5 h; none in
// weeks 11–12; ~8 g/kg carbs the day before the race.
const MACROS = {
  EASY: { kcal: 2900, p: 190, c: 280, f: 115 },
  MOD:  { kcal: 3200, p: 190, c: 420, f: 84 },
  HIGH: { kcal: 3400, p: 195, c: 500, f: 69 },
  PEAK: { kcal: 3500, p: 195, c: 540, f: 62 },
};

// Same meal prep for breakfast, lunch and dinner every day (easy to cook).
// The whey / MRE smoothie is the dial that tops each day up to its target —
// sizes below are placeholders until the meal-prep recipe is in.
const PREP = 'Meal prep portion (same every day)';
const PREP_NOTE = 'Tell Claude what’s in the meal prep — calories get calculated and the smoothie resized to hit today’s target.';
const COFFEE = { time: 'by 1:30 PM', name: 'Last coffee', items: ['Coffee cutoff for sleep', 'No stimulant pre-workout in the evening'] };
function prepMeal(time, name, extra) { return { time, name, tag: 'PREP', fuel: extra || '', items: [PREP] }; }
const MEALS = {
  EASY: [
    prepMeal('11:00 AM', 'Breakfast', 'Window opens 11 am.'),
    COFFEE,
    prepMeal('2:00 PM', 'Lunch'),
    { time: '4:30 PM', name: 'Smoothie', tag: 'WHEY', fuel: 'Rest day: small top-up. ' + PREP_NOTE, items: ['1 scoop whey', '1 banana', 'Creatine 5 g'] },
    prepMeal('7:00 PM', 'Dinner', 'Window closes 8 pm.'),
  ],
  MOD: [
    prepMeal('11:00 AM', 'Breakfast', 'Window opens 11 am.'),
    COFFEE,
    prepMeal('2:00 PM', 'Lunch'),
    { time: '4:15 PM', name: 'Pre-training smoothie', tag: 'MRE', fuel: '~45 min before training. ' + PREP_NOTE, items: ['2 scoops MRE', '1 banana', '40 g oats (blend in)', 'Creatine 5 g'] },
    prepMeal('7:30 PM', 'Dinner', 'After training. Mondays: eat ~6:45 PM before volleyball. Window closes ~8 pm (9 pm on Mondays).'),
  ],
  HIGH: [
    prepMeal('11:00 AM', 'Breakfast', 'Window opens 11 am. Hard day — don’t skip.'),
    COFFEE,
    prepMeal('2:00 PM', 'Lunch', 'Extra rice/potato on hard days if the prep allows.'),
    { time: '4:15 PM', name: 'Pre-training smoothie', tag: 'MRE', fuel: 'Biggest top-up of the week before training. ' + PREP_NOTE, items: ['4 scoops MRE', '1 banana', '50 g oats (blend in)', 'Creatine 5 g'] },
    prepMeal('7:30 PM', 'Dinner', 'Right after training. Window closes ~8 pm.'),
  ],
  PEAK: [
    { time: '7:30 AM', name: 'Pre-session smoothie', tag: 'MRE', fuel: 'Saturday’s run session is at 9 AM — no fasting on hard mornings. ' + PREP_NOTE, items: ['2 scoops MRE', '1 banana', '30 g dates', 'Creatine 5 g'] },
    prepMeal('11:00 AM', 'Breakfast', 'Recovery meal after the circuit.'),
    prepMeal('2:30 PM', 'Lunch'),
    { time: '4:30 PM', name: 'Smoothie', tag: 'WHEY', fuel: 'Top-up to today’s target.', items: ['1 scoop whey', '1 banana'] },
    prepMeal('7:00 PM', 'Dinner', 'Window closes ~8 pm.'),
  ],
};

// From week 3 (Mon Oct 12) Mon–Thu training moves to 6–7 AM, with a second
// session 4:30–5:30 PM. The eating window moves to ~7 AM–7:30 PM: eat right
// after the morning session, smoothie before the afternoon one.
const AM_START = '2026-10-12';
const WEEK_AM = {
  mon: { type: 'MOD',  train: 'Strength B full body (6:00 AM) · volleyball for fun 7–9 PM' },
  tue: WEEK.tue,
  wed: { type: 'MOD',  train: 'Strength A legs (6:00 AM) + upper strength (4:30 PM)' },
  thu: WEEK.thu,
  fri: WEEK.fri, sat: WEEK.sat, sun: WEEK.sun,
};
const COFFEE_AM = { time: 'by 1:00 PM', name: 'Last coffee', items: ['Coffee cutoff for sleep — early bedtime now', 'Pre-workout only for the 6 AM session'] };
const PRE_AM = { time: '5:30 AM', name: 'Pre-session bite', tag: 'FUEL', fuel: 'Small and fast — a full meal comes right after.', items: ['1 banana (or 2 dates)', 'Water + pinch of salt', 'Ghost + creatine 5 g'] };
const MEALS_AM = {
  EASY: [
    prepMeal('8:00 AM', 'Breakfast', 'Window opens ~7–8 am on the new schedule.'),
    COFFEE_AM,
    prepMeal('12:30 PM', 'Lunch'),
    { time: '3:30 PM', name: 'Smoothie', tag: 'WHEY', fuel: 'Rest day: small top-up. ' + PREP_NOTE, items: ['1 scoop whey', '1 banana'] },
    prepMeal('6:30 PM', 'Dinner', 'Window closes ~7:30 pm.'),
  ],
  MOD: [
    PRE_AM,
    prepMeal('7:15 AM', 'Breakfast', 'Right after the 6 AM session — this is your recovery meal.'),
    COFFEE_AM,
    prepMeal('12:00 PM', 'Lunch'),
    { time: '3:45 PM', name: 'Pre-training smoothie', tag: 'MRE', fuel: '~45 min before the 4:30 session. ' + PREP_NOTE, items: ['2 scoops MRE', '1 banana', '40 g oats (blend in)'] },
    prepMeal('6:30 PM', 'Dinner', 'Mondays: eat by ~6:15 PM before volleyball. Window closes ~7:30 pm (9 pm Mondays).'),
  ],
  HIGH: [
    PRE_AM,
    prepMeal('7:15 AM', 'Breakfast', 'Right after the morning session — hard day, don’t skip.'),
    COFFEE_AM,
    prepMeal('12:00 PM', 'Lunch', 'Extra rice/potato on hard days if the prep allows.'),
    { time: '3:45 PM', name: 'Pre-training smoothie', tag: 'MRE', fuel: 'Biggest top-up of the week, before the 4:30 upper session. ' + PREP_NOTE, items: ['4 scoops MRE', '1 banana', '50 g oats (blend in)'] },
    prepMeal('6:30 PM', 'Dinner', 'After training. Window closes ~7:30 pm.'),
  ],
  PEAK: MEALS.PEAK,
};
// Coached circuit days (Tue + Thu, 5:30–6:20 AM) — every week, not just from Oct 12
const MEALS_COACH = [
  { time: '5:00 AM', name: 'Pre-circuit bite', tag: 'FUEL', fuel: 'Small and fast — the circuit starts 5:30. A full meal comes right after.', items: ['1 banana (or 2 dates)', 'Water + pinch of salt', 'Ghost + creatine 5 g'] },
  prepMeal('6:45 AM', 'Breakfast', 'Right after the circuit — hard day, don’t skip. This is your recovery meal.'),
  COFFEE_AM,
  prepMeal('12:00 PM', 'Lunch', 'Extra rice/potato on hard days if the prep allows.'),
  { time: '3:30 PM', name: 'Smoothie', tag: 'MRE', fuel: 'Refill after the morning circuit. ' + PREP_NOTE, items: ['3 scoops MRE', '1 banana', '40 g oats (blend in)'] },
  prepMeal('6:30 PM', 'Dinner', 'Early bed tonight if you can — next 5:30 start is two days away. Window closes ~7:30 pm.'),
];
function amPhase() { return todayStr() >= AM_START; }
function weekInfo(day) { return (amPhase() ? WEEK_AM : WEEK)[day]; }
function mealsFor(day) { const info = weekInfo(day); return info.coach ? MEALS_COACH : (amPhase() ? MEALS_AM : MEALS)[info.type]; }

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
