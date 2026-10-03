// coach-log.js — the RTC coached circuits (Tue + Thu 5:30 AM with the HYROX
// trainer) on the Hyrox tab: what's next, a quick log of what the coach gave
// you, and the history. The coach sets the workout, so this is a notebook, not
// a timer — the custom circuit below still times anything you want.
//
// Storage: rtc_coach_log_v1 — { 'YYYY-MM-DD': { text, rpe } }
(function () {
  const P = window.RACE_PLAN;
  const host = document.getElementById('coach-root');
  if (!host || !P) return;
  const KEY = 'rtc_coach_log_v1';
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
  const fmt = (k) => new Date(k + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  // next coached session from the plan (today if it's still ahead or today)
  function nextCoach() {
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const s = (P.sessionsOn(d) || []).find((x) => x.coach);
      if (s) return { d, s };
    }
    return null;
  }
  function entries() {
    const all = load();
    (P.COACH_LOG || []).forEach((e) => { if (!all[e.date]) all[e.date] = { text: e.text }; });
    return Object.keys(all).sort().reverse().map((k) => ({ date: k, ...all[k] })).filter((e) => e.text);
  }

  function render() {
    const today = iso(new Date());
    const n = nextCoach();
    const mine = load()[today] || {};
    const isCoachDay = n && iso(n.d) === today;
    const hist = entries();
    host.innerHTML = `
      <div class="race-plan-card" id="coach">
        <div class="race-plan-top"><b>🏋️ RTC coached circuit · Tue + Thu ${esc(P.COACH_TIME)}</b><span class="race-plan-tag hard">Coach</span></div>
        ${n ? `<div class="race-plan-main">${isCoachDay ? 'Today' : 'Next: ' + esc(fmt(iso(n.d)))} · ${esc(n.s.time)} · ~${n.s.dur} min</div>
          <div class="rc-muted">${esc(n.s.d)}</div>` : ''}
        <label class="coach-lbl">Log ${isCoachDay ? 'today’s' : 'a'} circuit — stations, distances, weights, how it felt
          <textarea id="coach-text" rows="4" placeholder="e.g. 4 rounds: 250 m ski · 20 wall balls · 30 m sled push · 400 m run — felt 7/10">${esc(mine.text || '')}</textarea></label>
        <div class="coach-rpe">Effort ${[5, 6, 7, 8, 9, 10].map((r) => `<button type="button" class="race-preset-btn ${mine.rpe == r ? 'active' : ''}" data-coach-rpe="${r}">${r}</button>`).join('')}</div>
        ${hist.length ? `<details class="rc-sec" ${hist.length ? 'open' : ''}><summary>📒 Past circuits (${hist.length})</summary>
          ${hist.slice(0, 12).map((e) => `<div class="coach-h"><b>${esc(fmt(e.date))}${e.rpe ? ` · effort ${esc(e.rpe)}/10` : ''}</b><span>${esc(e.text)}</span></div>`).join('')}
        </details>` : ''}
        <div class="race-plan-foot">The coach sets the workout; you set the effort. Short sleep → ~70%. Logged here = Claude can adjust the rest of your week around it.</div>
      </div>`;
  }

  let t;
  host.addEventListener('input', (e) => {
    if (e.target.id !== 'coach-text') return;
    clearTimeout(t);
    t = setTimeout(() => { const all = load(); const k = iso(new Date()); all[k] = Object.assign({}, all[k], { text: e.target.value }); save(all); }, 300);
  });
  // leaving the box saves at once — no redraw here, or a tap on an effort
  // button that caused the blur would land on a button that was just replaced
  host.addEventListener('change', (e) => {
    if (e.target.id !== 'coach-text') return;
    clearTimeout(t); const all = load(); const k = iso(new Date()); all[k] = Object.assign({}, all[k], { text: e.target.value }); save(all);
  });
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-coach-rpe]'); if (!b) return;
    const all = load(); const k = iso(new Date()); all[k] = Object.assign({}, all[k], { rpe: +b.dataset.coachRpe }); save(all); render();
  });
  render();
})();
