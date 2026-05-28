const STORAGE_KEY = 'rtc_fridge_week_v1';
let currentWeek;
try {
  currentWeek = localStorage.getItem(STORAGE_KEY) || 'a';
} catch (e) {
  currentWeek = 'a';
}

function switchWeek(week) {
  currentWeek = week;
  try {
    localStorage.setItem(STORAGE_KEY, week);
  } catch (e) {}
  document.body.dataset.activeWeek = week;
  document.querySelectorAll('.fridge-week-page').forEach((p) =>
    p.classList.toggle('active', p.dataset.week === week)
  );
  document.querySelectorAll('.fridge-week-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.week === week)
  );
}

document.querySelectorAll('.fridge-week-btn').forEach((b) => {
  b.addEventListener('click', () => switchWeek(b.dataset.week));
});

switchWeek(currentWeek);
