// gym-rpg.js — RPG layer for Alison's Gym page (scoped to her storage key).
//
// Injects, above the workout: a rank coin + Hero Level, a round session timer
// (Start/Pause/Reset) whose ring tracks the day's completion, a difficulty
// preset (Beginner/Intermediate/Advanced coaching), and a Records & progress
// panel. XP is awarded when "Save to Tracker" banks a real lifting PR (heavier
// top weight on a lift), by wrapping the existing saveToTracker. Reuses the
// .race-* styles from the Hyrox page.
//
// Storage:
//   rtc_gym_xp_him_v1     — { xp, prs, log[] }
//   rtc_gym_timer_him_v1  — { running, accumMs, lastStart, date }
//   rtc_gym_diff_him_v1   — 'beginner' | 'intermediate' | 'advanced'

(function () {
  // Only Alison's gym page (Darlene's uses a different storage key).
  if (document.body.dataset.storageKey !== 'rtc_gym_alison_v1') return;

  const TRAIN_KEY = 'rtc_tracker_training_v1';
  const XP_KEY    = 'rtc_gym_xp_him_v1';
  const TIMER_KEY = 'rtc_gym_timer_him_v1';
  const DIFF_KEY  = 'rtc_gym_diff_him_v1';

  const loadJSON = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch { return f; } };
  const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function todayStr() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  const pad = (n) => String(n).padStart(2, '0');
  function fmtClock(ms) {
    const s = Math.floor(Math.max(0, ms) / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  }

  // ---- PRs from tracker history (best top weight per lift) ----
  function bests() {
    const arr = loadJSON(TRAIN_KEY, []);
    const map = {};
    arr.forEach((t) => {
      if (t.person !== 'him') return;
      (t.exercises || []).forEach((ex) => {
        if (!ex.exId) return;
        (ex.sets || []).forEach((s) => {
          const w = Number(s.w), r = Number(s.r);
          if (!w || !r) return;
          const e = map[ex.exId];
          if (!e || w > e.w) map[ex.exId] = { w, r, name: ex.name, date: t.date };
        });
      });
    });
    return map;
  }

  // ---- XP / level ----
  let xp = loadJSON(XP_KEY, null);
  if (!xp) {
    // Seed from existing PRs so the level reflects prior training.
    const n = Object.keys(bests()).length;
    xp = { xp: n * 25, prs: n, log: [] };
    saveJSON(XP_KEY, xp);
  }
  const levelStartXp = (L) => 50 * (L - 1) * L;
  function levelInfo() {
    const x = xp.xp || 0; let L = 1;
    while (levelStartXp(L + 1) <= x) L++;
    const start = levelStartXp(L), next = levelStartXp(L + 1);
    return { level: L, inLevel: x - start, span: next - start, pct: Math.round((x - start) / (next - start) * 100) };
  }
  const RANKS = [
    { min: 1, name: 'Novice', emoji: '🥚' }, { min: 3, name: 'Beginner', emoji: '🐣' },
    { min: 6, name: 'Intermediate', emoji: '🔵' }, { min: 10, name: 'Advanced', emoji: '🟣' },
    { min: 15, name: 'Elite', emoji: '🏆' },
  ];
  function rankFor(level) { let r = RANKS[0]; for (const t of RANKS) if (level >= t.min) r = t; return r; }
  function nextRank(level) { for (const t of RANKS) if (level < t.min) return t; return null; }

  function addXp(pts, label) {
    const before = levelInfo().level;
    xp.xp = (xp.xp || 0) + pts; xp.prs = (xp.prs || 0) + 1;
    (xp.log = xp.log || []).unshift({ date: todayStr(), label, pts });
    if (xp.log.length > 40) xp.log.length = 40;
    saveJSON(XP_KEY, xp);
    return levelInfo().level > before;
  }

  // ---- session timer (resets each day) ----
  let timer = loadJSON(TIMER_KEY, null);
  if (!timer || timer.date !== todayStr()) { timer = { running: false, accumMs: 0, lastStart: null, date: todayStr() }; saveJSON(TIMER_KEY, timer); }
  const elapsed = () => timer.accumMs + (timer.running && timer.lastStart ? Date.now() - timer.lastStart : 0);
  let tick = null;
  const startTick = () => { if (!tick) tick = setInterval(paintTimer, 250); };
  const stopTick = () => { if (tick) { clearInterval(tick); tick = null; } };
  function startTimer() { if (timer.running) return; timer.running = true; timer.lastStart = Date.now(); saveJSON(TIMER_KEY, timer); startTick(); paintTimer(); }
  function pauseTimer() { if (!timer.running) return; timer.accumMs += Date.now() - timer.lastStart; timer.running = false; timer.lastStart = null; saveJSON(TIMER_KEY, timer); stopTick(); paintTimer(); }
  function resetTimer() { if (!confirm('Reset the session timer?')) return; timer = { running: false, accumMs: 0, lastStart: null, date: todayStr() }; saveJSON(TIMER_KEY, timer); stopTick(); paintTimer(); }

  function dayProgress() {
    const page = document.querySelector('.day-page.active');
    if (!page) return { done: 0, total: 0 };
    const ex = page.querySelectorAll('.exercise');
    let done = 0; ex.forEach((e) => { if (e.classList.contains('done')) done++; });
    return { done, total: ex.length };
  }

  // ---- difficulty ----
  let diff = loadJSON(DIFF_KEY, 'intermediate');
  const DIFF = {
    beginner: 'Leave 3–4 reps in reserve · 2 working sets while you learn the movement · nail form before load.',
    intermediate: 'As written · 1–2 reps in reserve · full sets · add weight when you hit the top of the range on all sets.',
    advanced: 'Push the last set to 0–1 reps in reserve · add a set to a weak point · trim rest 15–30 s.',
  };

  // ---- toast ----
  function toast(msg) { const t = document.createElement('div'); t.className = 't-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }

  // ============================================================
  // Render
  // ============================================================
  const RING_CIRC = 2 * Math.PI * 52;
  const wrap = document.createElement('div');
  wrap.className = 'grpg';
  const header = document.querySelector('.workouts-header');
  if (header && header.parentNode) header.parentNode.insertBefore(wrap, header.nextSibling);
  else document.body.insertBefore(wrap, document.body.firstChild);

  function coinHTML() {
    const L = levelInfo(), r = rankFor(L.level), nx = nextRank(L.level);
    return `
      <div class="race-coin">
        <div class="race-coin-badge"><span class="race-coin-emoji">${r.emoji}</span><span class="race-coin-lvl">L${L.level}</span></div>
        <div class="race-coin-main">
          <div class="race-coin-rank">Level ${L.level} · ${r.name} <span class="race-coin-best">· ${xp.prs || 0} PRs</span></div>
          <div class="race-coin-bar"><div class="race-coin-fill" style="width:${L.pct}%"></div></div>
          <div class="race-coin-next"><span>${L.inLevel} / ${L.span} XP → Lvl ${L.level + 1}</span>
            <span class="race-coin-title">${nx ? `Next: <b>${nx.name}</b> @ Lvl ${nx.min}` : 'Top rank · Elite 🏆'}</span></div>
        </div>
      </div>`;
  }
  function recordsHTML() {
    const b = bests();
    const rows = Object.values(b).sort((a, c) => c.w - a.w).map((p) =>
      `<tr><td>${esc(p.name)}</td><td class="rec-best">${p.w}</td><td class="rec-tgt">${p.r}</td><td class="rec-tier">${esc(p.date)}</td></tr>`).join('')
      || '<tr><td colspan="4" class="rec-empty">No PRs yet — Save a workout to log your first.</td></tr>';
    const recent = (xp.log || []).slice(0, 6).map((e) => `<li><span>${esc(e.label)}</span><b>+${e.pts}</b></li>`).join('')
      || '<li class="rec-empty">Hit a PR and Save to earn XP.</li>';
    return `
      <details class="race-records">
        <summary>🏅 Records &amp; progress · ${xp.prs || 0} PRs · ${xp.xp || 0} XP</summary>
        <div class="race-records-body">
          <table class="race-rec-table">
            <thead><tr><th>Lift</th><th>Top kg</th><th>Reps</th><th>Date</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="race-rec-xp-head">Recent XP</div>
          <ul class="race-rec-xp">${recent}</ul>
        </div>
      </details>`;
  }
  function render() {
    wrap.innerHTML = `
      ${coinHTML()}
      <div class="race-timer grpg-timer">
        <div class="race-dial">
          <svg class="race-ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle class="race-ring-bg" cx="60" cy="60" r="52"></circle>
            <circle class="race-ring-fg" id="grpg-ring" cx="60" cy="60" r="52" stroke-dasharray="326.7" stroke-dashoffset="326.7" transform="rotate(-90 60 60)"></circle>
          </svg>
          <div class="race-dial-c">
            <div class="race-clock" id="grpg-clock">${fmtClock(elapsed())}</div>
            <div class="race-dial-count" id="grpg-count">0 / 0</div>
            <div class="race-seg-live">session</div>
          </div>
        </div>
        <div class="race-timer-controls">
          <button type="button" class="race-btn race-btn-go" id="grpg-go">▶ Start</button>
          <button type="button" class="race-btn race-btn-pause" id="grpg-pause">❚❚ Pause</button>
          <button type="button" class="race-btn" id="grpg-reset">Reset</button>
        </div>
      </div>
      <div class="race-preset">
        <span class="race-preset-lbl">Difficulty →</span>
        <button type="button" class="race-preset-btn ${diff === 'beginner' ? 'grpg-active' : ''}" data-diff="beginner">Beginner</button>
        <button type="button" class="race-preset-btn ${diff === 'intermediate' ? 'grpg-active' : ''}" data-diff="intermediate">Intermediate</button>
        <button type="button" class="race-preset-btn ${diff === 'advanced' ? 'grpg-active' : ''}" data-diff="advanced">Advanced</button>
      </div>
      <div class="grpg-diff-note">${esc(DIFF[diff])}</div>
      ${recordsHTML()}`;
    paintTimer();
  }
  function paintTimer() {
    const clk = document.getElementById('grpg-clock'); if (clk) clk.textContent = fmtClock(elapsed());
    const go = document.getElementById('grpg-go'); if (go) { go.textContent = elapsed() > 0 ? '▶ Resume' : '▶ Start'; go.disabled = timer.running; }
    const pause = document.getElementById('grpg-pause'); if (pause) pause.disabled = !timer.running;
    const { done, total } = dayProgress();
    const cnt = document.getElementById('grpg-count'); if (cnt) cnt.textContent = `${done} / ${total}`;
    const ring = document.getElementById('grpg-ring'); if (ring) ring.style.strokeDashoffset = String(RING_CIRC * (1 - (total ? done / total : 0)));
  }

  // ---- events ----
  wrap.addEventListener('click', (e) => {
    if (e.target.closest('#grpg-go')) return startTimer();
    if (e.target.closest('#grpg-pause')) return pauseTimer();
    if (e.target.closest('#grpg-reset')) return resetTimer();
    const d = e.target.closest('[data-diff]');
    if (d) { diff = d.dataset.diff; saveJSON(DIFF_KEY, diff); render(); }
  });

  // Refresh the ring when exercises are ticked / the day switches (wrap gym.js globals).
  ['toggleEx', 'switchDay', 'resetCurrentDay'].forEach((fn) => {
    const orig = window[fn];
    if (typeof orig === 'function') window[fn] = function () { const out = orig.apply(this, arguments); paintTimer(); return out; };
  });

  // XP on save: wrap saveToTracker, diff PRs before/after.
  const origSave = window.saveToTracker;
  if (typeof origSave === 'function') {
    window.saveToTracker = function () {
      const before = bests();
      const out = origSave.apply(this, arguments);
      const after = bests();
      let gained = 0, leveled = false;
      Object.keys(after).forEach((exId) => {
        const b = before[exId];
        if (!b) { gained += 25; leveled = addXp(25, `${after[exId].name} logged`) || leveled; }
        else if (after[exId].w > b.w) { gained += 40; leveled = addXp(40, `${after[exId].name} PR!`) || leveled; }
      });
      render();
      if (gained > 0) toast(leveled ? `⚡ LEVEL ${levelInfo().level}! +${gained} XP` : `＋${gained} XP banked`);
      return out;
    };
  }

  render();
  if (timer.running) startTick();
})();
