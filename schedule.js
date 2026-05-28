const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const today = dayMap[new Date().getDay()];
const STORAGE_KEY = 'rtc_schedule_day_v1';

let currentDay;
try {
  currentDay = localStorage.getItem(STORAGE_KEY) || today;
} catch (e) {
  currentDay = today;
}

function switchDay(day) {
  currentDay = day;
  try {
    localStorage.setItem(STORAGE_KEY, day);
  } catch (e) {}
  document.querySelectorAll('.day-page').forEach((p) =>
    p.classList.toggle('active', p.dataset.day === day)
  );
  document.querySelectorAll('.day-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.day === day)
  );
}

document.querySelectorAll('.day-btn').forEach((b) => {
  b.addEventListener('click', () => switchDay(b.dataset.day));
});

switchDay(currentDay);
