const weekPages = document.querySelectorAll('.week-page');
const weekButtons = document.querySelectorAll('.week-btn');
const countEl = document.getElementById('count');
const fillEl = document.getElementById('fill');
let currentWeek = document.body.dataset.defaultWeek || 'a';

function activePage() {
  return document.querySelector('.week-page.active');
}

function storageKeyFor(weekId) {
  const page = document.querySelector(`.week-page[data-week="${weekId}"]`);
  return page ? page.dataset.storageKey : null;
}

function save() {
  const page = activePage();
  if (!page) return;
  const state = {};
  page.querySelectorAll('.item').forEach((item) => {
    state[item.dataset.id] = item.classList.contains('checked');
  });
  try {
    localStorage.setItem(page.dataset.storageKey, JSON.stringify(state));
  } catch (e) {}
}

function loadPage(page) {
  try {
    const raw = localStorage.getItem(page.dataset.storageKey);
    if (!raw) return;
    const state = JSON.parse(raw);
    page.querySelectorAll('.item').forEach((item) => {
      if (state[item.dataset.id]) item.classList.add('checked');
      else item.classList.remove('checked');
    });
  } catch (e) {}
}

function updateProgress() {
  const page = activePage();
  if (!page) return;
  const items = page.querySelectorAll('.item');
  const checked = page.querySelectorAll('.item.checked').length;
  const total = items.length;
  countEl.textContent = `${checked} / ${total}`;
  fillEl.style.width = total ? (checked / total) * 100 + '%' : '0%';
}

function switchWeek(week) {
  currentWeek = week;
  weekPages.forEach((p) => p.classList.toggle('active', p.dataset.week === week));
  weekButtons.forEach((b) => b.classList.toggle('active', b.dataset.week === week));
  document.body.dataset.activeWeek = week;
  loadPage(activePage());
  updateProgress();
}

function toggleAll(checkState) {
  const page = activePage();
  if (!page) return;
  page.querySelectorAll('.item').forEach((item) => {
    item.classList.toggle('checked', checkState);
  });
  save();
  updateProgress();
}

function resetAll() {
  if (confirm('Reset all checkmarks for this week?')) toggleAll(false);
}

document.querySelectorAll('.item').forEach((item) => {
  item.addEventListener('click', () => {
    item.classList.toggle('checked');
    save();
    updateProgress();
  });
});

weekButtons.forEach((btn) => {
  btn.addEventListener('click', () => switchWeek(btn.dataset.week));
});

window.toggleAll = toggleAll;
window.resetAll = resetAll;

// Initial load: load all week pages from storage, then show default
weekPages.forEach(loadPage);
switchWeek(currentWeek);
