// gym-custom.js — renders the Library-built custom workout inside Alison's Gym.
//
// Reads rtc_custom_gym_him_v1 (written by library.js) and, if present, injects a
// "Custom" day button + day page BEFORE gym.js runs, so the injected .exercise
// cards get the full treatment: set rows, done-toggles, PR badges, notes,
// Save-to-Tracker and images (library pins exact image overrides per pick).
// Load order matters: this script must come before gym.js.

(function () {
  if (document.body.dataset.storageKey !== 'rtc_gym_alison_v1') return;

  let custom = null;
  try { custom = JSON.parse(localStorage.getItem('rtc_custom_gym_him_v1')); } catch (e) {}
  if (!custom || !Array.isArray(custom.exercises) || !custom.exercises.length) return;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ytUrl = (name) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' proper form');

  // 5th button in the day picker
  const picker = document.querySelector('.day-picker');
  if (picker) {
    picker.classList.add('day-picker-5');
    const btn = document.createElement('div');
    btn.className = 'day-btn';
    btn.dataset.day = 'custom';
    btn.setAttribute('onclick', "switchDay('custom')");
    btn.innerHTML = '<div class="day-btn-label">PICK</div><div class="day-btn-name">Custom</div>';
    picker.appendChild(btn);
  }

  // Day page with one card per picked exercise
  const page = document.createElement('div');
  page.className = 'day-page';
  page.id = 'day-custom';
  page.innerHTML = `
    <div class="day-header">
      <div class="day-title">Custom · from Library</div>
      <div class="day-meta">${custom.exercises.length} exercises · built ${esc(custom.updated || '')} · edit in the 📚 Library</div>
      <div class="day-note">Your own pick-and-choose session. Same rules as always: controlled form, 1–2 reps in reserve, log every set. <a href="library.html" style="color:#fff;text-decoration:underline;">Change it in the Library →</a></div>
    </div>
    ${custom.exercises.map((ex, i) => `
      <div class="exercise" data-ex="him_cust_${i}" data-sets="${Math.max(1, Math.min(6, Number(ex.sets) || 3))}">
        <div class="ex-header" onclick="toggleEx(this)">
          <div class="ex-checkbox"><span class="ex-checkmark">✓</span></div>
          <div class="ex-info">
            <div class="ex-name">${esc(ex.name)}</div>
            <div class="ex-target">${Math.max(1, Math.min(6, Number(ex.sets) || 3))} sets · your pick · rest 60–120 sec</div>
          </div>
          <a class="ex-demo" href="${ytUrl(ex.name)}" target="_blank" onclick="event.stopPropagation()">📹</a>
        </div>
      </div>`).join('')}
  `;
  // Insert after the last existing day page so gym.js picks it up on init.
  const pages = document.querySelectorAll('.day-page');
  const last = pages[pages.length - 1];
  if (last && last.parentNode) last.parentNode.insertBefore(page, last.nextSibling);
  else document.body.appendChild(page);
})();
