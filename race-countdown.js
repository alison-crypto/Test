// race-countdown.js — HYROX race-day countdown shown on the home screen and
// the Hyrox page. Fills every element with [data-race-countdown].
(function () {
  const RACE = { name: 'HYROX', y: 2026, m: 12, d: 20 };   // Sat Dec 20, 2026
  function daysLeft() {
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const race = Date.UTC(RACE.y, RACE.m - 1, RACE.d);
    return Math.round((race - today) / 86400000);
  }
  function text() {
    const d = daysLeft();
    if (d > 1) {
      const w = Math.floor(d / 7), r = d % 7;
      const wk = w ? `${w} wk${w > 1 ? 's' : ''}${r ? ` ${r} d` : ''}` : `${d} days`;
      return `<b>${d}</b> days to ${RACE.name} <span>· ${wk} · Sat Dec 20</span>`;
    }
    if (d === 1) return `<b>Tomorrow</b> is ${RACE.name} race day — sleep, carbs, trust the work 🔥`;
    if (d === 0) return `<b>${RACE.name} race day!</b> <span>· go get it 🏁</span>`;
    return `${RACE.name} Dec 20 — done ✓ 🏅`;
  }
  function paint() { document.querySelectorAll('[data-race-countdown]').forEach((el) => { el.innerHTML = '🏁 ' + text(); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) paint(); });
})();
