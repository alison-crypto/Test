// Auto-generated grocery list driven by the user's Diet Plan picks
// (see plan.js, which is loaded ahead of this script). Reads aggregated
// quantities, renders the table, and persists checkboxes to localStorage
// under rtc_grocery_plan_v1.

(function init() {
  const RT = window.RTC_DIET_PLAN;
  if (!RT) {
    console.warn('[groceries-plan] plan.js not loaded — skipping diet plan groceries');
    return;
  }

  const tbody = document.querySelector('#dp-groceries-table tbody');
  if (!tbody) return;

  const CHECKS_KEY = 'rtc_grocery_plan_v1';

  function loadChecks() {
    try { return JSON.parse(localStorage.getItem(CHECKS_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveChecks(c) {
    try { localStorage.setItem(CHECKS_KEY, JSON.stringify(c)); } catch {}
  }

  function fmt(n) {
    if (Number.isInteger(n)) return n;
    return Math.round(n * 10) / 10;
  }

  function render() {
    const items = RT.aggregateGroceries();
    const checks = loadChecks();
    tbody.innerHTML = items.map((it) => {
      const id = it.name + '|' + it.unit;
      const ck = !!checks[id];
      return `
        <tr class="${ck ? 'checked' : ''}" data-id="${encodeURIComponent(id)}">
          <td><input type="checkbox" class="dp-check" ${ck ? 'checked' : ''}/></td>
          <td class="dp-name">${it.name}</td>
          <td class="dp-qty">${fmt(it.her)}<span class="dp-qty-unit">${it.unit}</span></td>
          <td class="dp-qty">${fmt(it.him)}<span class="dp-qty-unit">${it.unit}</span></td>
        </tr>
      `;
    }).join('');
  }

  tbody.addEventListener('change', (e) => {
    const cb = e.target.closest('.dp-check');
    if (!cb) return;
    const tr = cb.closest('tr');
    const id = decodeURIComponent(tr.dataset.id);
    const checks = loadChecks();
    if (cb.checked) checks[id] = true; else delete checks[id];
    saveChecks(checks);
    tr.classList.toggle('checked', cb.checked);
  });

  document.getElementById('dp-check-all')?.addEventListener('click', () => {
    const items = RT.aggregateGroceries();
    const checks = {};
    items.forEach((it) => { checks[it.name + '|' + it.unit] = true; });
    saveChecks(checks);
    render();
  });
  document.getElementById('dp-uncheck-all')?.addEventListener('click', () => {
    saveChecks({});
    render();
  });

  render();

  // Re-render after the sync engine pulls fresh state — picks made on
  // another phone change the aggregated grocery list.
  window.addEventListener('rtc-sync-done', () => { try { render(); } catch {} });
})();
