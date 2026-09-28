// race-plan.js — Race Plan page: today, readiness check, this week, 12-week
// map, phone-calendar export. Data from race-plan-data.js.
(function () {
  const P = window.RACE_PLAN;
  const root = document.getElementById('rp-root');
  const READY_KEY = 'rtc_readiness_v1';
  const KIND = { easy: 'Easy', med: 'Medium', hard: 'Hard', rest: 'Rest' };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const load = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch { return f; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const holTag = (d) => { const h = P.holidayOn(d); return h ? ` <span class="rp-hol">🇨🇦 ${esc(h.name)} · gym closed</span>` : ''; };

  function sessHTML(s) {
    const inner = `
      <span class="rp-s-time">${esc(s.time)}</span>
      <span class="rp-s-main"><b>${esc(s.t)}</b><span>${esc(s.d)}</span></span>
      <span class="rp-chip rp-${s.k}">${KIND[s.k]}</span>
      ${s.href ? '<span class="rp-go">›</span>' : ''}`;
    return s.href ? `<a class="rp-sess" href="${esc(s.href)}">${inner}</a>` : `<div class="rp-sess">${inner}</div>`;
  }

  // ---- readiness ----
  function readiness() {
    const all = load(READY_KEY, {});
    const today = iso(new Date());
    const e = all[today] || {};
    const past = Object.keys(all).filter((k) => k < today && all[k].rhr).sort().slice(-7).map((k) => +all[k].rhr);
    const base = past.length >= 3 ? past.reduce((a, b) => a + b, 0) / past.length : null;
    let light = null, why = [];
    if (e.sleep) { const s = +e.sleep; const l = s >= 6.5 ? 'g' : s >= 5 ? 'a' : 'r'; light = l; why.push(`${s} h sleep`); }
    if (e.rhr && base != null) {
      const diff = +e.rhr - base; const l = diff <= 3 ? 'g' : diff <= 7 ? 'a' : 'r';
      const rank = { g: 0, a: 1, r: 2 }; if (!light || rank[l] > rank[light]) light = l;
      why.push(`resting HR ${diff >= 0 ? '+' : ''}${Math.round(diff)} vs your 7-day average`);
    } else if (e.rhr) why.push('resting HR saved — the comparison starts after 3 mornings');
    if (e.sick) { light = 'r'; why.push('feeling sick'); }
    const MSG = {
      g: ['Green', 'Do the session as written.'],
      a: ['Amber', 'Cut volume 30–50% and cap effort at RPE 7. Hard day: keep the warm-up and half the work.'],
      r: ['Red', '20–30 min minimum: easy bike, mobility or light strength — or rest. It won’t cost you the race.'],
    };
    return `
      <section class="rp-card" id="readiness">
        <h2>Morning check</h2>
        <p class="rp-muted">Hours slept and resting heart rate (take it lying in bed). Worse signal wins.</p>
        <div class="rp-ready">
          <label>Sleep (h)<input id="rp-sleep" type="number" inputmode="decimal" step="0.5" min="0" max="14" value="${esc(e.sleep || '')}" /></label>
          <label>Resting HR<input id="rp-rhr" type="number" inputmode="numeric" min="30" max="120" value="${esc(e.rhr || '')}" /></label>
          <label class="rp-sick"><input id="rp-sickbox" type="checkbox" ${e.sick ? 'checked' : ''} /> Sick</label>
        </div>
        ${light ? `<div class="rp-light rp-l-${light}"><b>${MSG[light][0]}</b><span>${MSG[light][1]}</span><small>${esc(why.join(' · '))}</small></div>`
                : '<div class="rp-light rp-l-none"><span>Enter this morning’s numbers to get today’s call.</span></div>'}
      </section>`;
  }

  function render() {
    const now = new Date();
    const w = P.weekFor(now);
    const todayS = P.sessionsOn(now);
    const dToRace = P.daysToRace(now);
    let todayHTML;
    if (todayS) {
      todayHTML = `<section class="rp-card rp-today" id="today">
        <div class="rp-eyebrow">Today · ${esc(fmtDay(now))} · Week ${w.n} · ${esc(w.phase)}</div>${holTag(now)}
        ${w.note ? `<p class="rp-note">${esc(w.note)}</p>` : ''}
        <div class="rp-list">${todayS.map(sessHTML).join('')}</div>
      </section>`;
    } else if (dToRace > 0) {
      todayHTML = `<section class="rp-card rp-today" id="today"><div class="rp-eyebrow">Today</div><p>The block starts Mon Sep 28.</p></section>`;
    } else {
      todayHTML = `<section class="rp-card rp-today" id="today"><div class="rp-eyebrow">Block complete</div><p>HYROX Dec 20 is done. 🏅</p></section>`;
    }

    const cur = w || P.WEEKS[0];
    const weekHTML = `<section class="rp-card" id="week">
      <h2>Week ${cur.n} · ${esc(cur.phase)}</h2>
      <p class="rp-muted">Run ${esc(cur.km)} km · erg/bike ${esc(cur.erg)}</p>
      ${cur.days.map((ds, i) => {
        const d = P.dateOf(cur.n, i); const isToday = iso(d) === iso(now);
        return `<div class="rp-day ${isToday ? 'is-today' : ''}"><div class="rp-day-h">${esc(fmtDay(d))}${isToday ? ' · today' : ''}${holTag(d)}</div>${ds.map(sessHTML).join('')}</div>`;
      }).join('')}
    </section>`;

    const blockHTML = `<section class="rp-card" id="block">
      <h2>12-week map</h2>
      <div class="rp-phasebar">${P.WEEKS.map((wk) => `<span class="rp-ph rp-ph-${phaseClass(wk.phase)} ${w && wk.n === w.n ? 'is-now' : ''}">${wk.n}</span>`).join('')}</div>
      ${P.WEEKS.map((wk) => `
        <details class="rp-wk" ${w && wk.n === w.n ? 'open' : ''}>
          <summary><b>Week ${wk.n}</b><span>${esc(wk.phase)} · ${esc(fmtDay(P.dateOf(wk.n, 0)))}</span><em>${esc(wk.km)} km</em></summary>
          ${wk.note ? `<p class="rp-note">${esc(wk.note)}</p>` : ''}
          ${wk.n === P.AM_FROM_WEEK ? '<p class="rp-note">From this week: train 6–7 AM before work, second session 4:30–5:30 PM. Bad night? Slide the morning session to 4:30.</p>' : ''}
          ${wk.days.map((ds, i) => `<div class="rp-day"><div class="rp-day-h">${esc(fmtDay(P.dateOf(wk.n, i)))}${holTag(P.dateOf(wk.n, i))}</div>${ds.map(sessHTML).join('')}</div>`).join('')}
        </details>`).join('')}
    </section>`;

    const calHTML = `<section class="rp-card" id="calendar">
      <h2>Put it on your phone calendar</h2>
      <p class="rp-muted">Adds every session from today to race day as calendar events, plus the BC stat holidays (gym closed). Each event links back to the right page in the app. Already imported an older version? Delete the old “HYROX Race Plan” events first so nothing doubles.</p>
      <button type="button" class="rp-btn" id="rp-ics">📅 Add all sessions to calendar</button>
    </section>`;

    const fuelHTML = `<section class="rp-card" id="rules">
      <h2>Sleep &amp; fuel rules</h2>
      <ul class="rp-rules">
        <li>Weeks 1–4: eat at maintenance. Weeks 1–2 window ~11 am–8 pm; from week 3 (6 AM training) ~7 am–7:30 pm, breakfast right after the morning session.</li>
        <li>BC stat holidays (Sep 30, Oct 12, Nov 11) have home / outdoor sessions — the gym is closed.</li>
        <li>Protein 170–205 g a day; keep creatine; carbs up on hard days.</li>
        <li>Last coffee ~1:30 pm, no stimulant pre-workout in the evening.</li>
        <li>Finish hard sessions ≥ 90 min before bed. Nap 20–90 min (1–4 pm) when you can.</li>
        <li>Runs: grow 2–4 km a week, flat even surfaces, quick steps; extra aerobic work on bike/row/ski.</li>
      </ul>
    </section>`;

    root.innerHTML = todayHTML + readiness() + weekHTML + calHTML + blockHTML + fuelHTML;
  }
  function phaseClass(p) { p = p.toLowerCase(); return p.includes('deload') ? 'deload' : p.includes('taper') || p.includes('race week') ? 'taper' : p.includes('race') ? 'spec' : p.includes('build') ? 'build' : 'base'; }

  // ---- phone calendar (.ics) ----
  function icsDate(d, t) {
    const m = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(t || '5:00 PM');
    let h = +m[1]; const min = +m[2]; if (/pm/i.test(m[3]) && h !== 12) h += 12; if (/am/i.test(m[3]) && h === 12) h = 0;
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, min);
    const p = (n) => String(n).padStart(2, '0');
    return { x, s: `${x.getFullYear()}${p(x.getMonth() + 1)}${p(x.getDate())}T${p(x.getHours())}${p(x.getMinutes())}00` };
  }
  const icsEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  function exportICS() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DeSouzas//Race Plan//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:HYROX Race Plan'];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    let n = 0;
    P.WEEKS.forEach((wk) => wk.days.forEach((ds, i) => {
      const d = P.dateOf(wk.n, i); if (d < today) return;
      ds.forEach((s, j) => {
        const st = icsDate(d, s.time); const en = new Date(st.x.getTime() + (s.dur || 45) * 60000);
        const p = (k) => String(k).padStart(2, '0');
        const es = `${en.getFullYear()}${p(en.getMonth() + 1)}${p(en.getDate())}T${p(en.getHours())}${p(en.getMinutes())}00`;
        const url = s.href ? base + s.href : base + 'race-plan.html';
        lines.push('BEGIN:VEVENT', `UID:hyrox-w${wk.n}-d${i}-s${j}@desouzas`, `DTSTAMP:${stamp}`,
          `DTSTART:${st.s}`, `DTEND:${es}`, `SUMMARY:${icsEsc((s.k === 'hard' ? '🔥 ' : '') + s.t)}`,
          `DESCRIPTION:${icsEsc(`${s.d}\nWeek ${wk.n} · ${wk.phase}\nOpen: ${url}`)}`, `URL:${url}`, 'END:VEVENT');
        n++;
      });
    }));
    (P.HOLIDAYS || []).forEach((h) => {
      const [y, m, dd] = h.date.split('-').map(Number);
      const d0 = new Date(y, m - 1, dd); if (d0 < today) return;
      const d1 = new Date(y, m - 1, dd + 1);
      const f = (x) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, '0')}${String(x.getDate()).padStart(2, '0')}`;
      lines.push('BEGIN:VEVENT', `UID:bc-stat-${h.date}@desouzas`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${f(d0)}`, `DTEND;VALUE=DATE:${f(d1)}`,
        `SUMMARY:${icsEsc('🇨🇦 ' + h.name + ' — BC stat holiday, gym closed')}`, `DESCRIPTION:${icsEsc('Home / outdoor session in the Race Plan.\nOpen: ' + base + 'race-plan.html')}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
      n++;
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'hyrox-race-plan.ics';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    const t = document.createElement('div'); t.className = 't-toast'; t.textContent = `📅 ${n} sessions exported — open the file to add them`; document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
  }

  root.addEventListener('input', (e) => {
    if (!['rp-sleep', 'rp-rhr'].includes(e.target.id)) return;
    const all = load(READY_KEY, {}); const k = iso(new Date());
    all[k] = Object.assign({}, all[k], { [e.target.id === 'rp-sleep' ? 'sleep' : 'rhr']: e.target.value });
    save(READY_KEY, all);
  });
  root.addEventListener('change', (e) => {
    if (['rp-sleep', 'rp-rhr', 'rp-sickbox'].includes(e.target.id)) {
      if (e.target.id === 'rp-sickbox') { const all = load(READY_KEY, {}); const k = iso(new Date()); all[k] = Object.assign({}, all[k], { sick: e.target.checked }); save(READY_KEY, all); }
      const y = window.scrollY; render(); window.scrollTo(0, y);
    }
  });
  root.addEventListener('click', (e) => { if (e.target.closest('#rp-ics')) exportICS(); });
  render();
  if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
})();
