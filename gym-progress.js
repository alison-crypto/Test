// gym-progress.js — "🎯 Next" weight suggestions on Alison's gym page.
//
// Reads each exercise's most recent logged session (the "last week" snapshot
// saved on Reset, or a session saved to the Tracker — whichever is newer) and
// suggests the next load with double progression:
//   • every set hit the TOP of the rep range → add one increment
//   • inside the range → same weight, +1 rep per set
//   • 2+ sets under the BOTTOM of the range → drop ~5%
// Main lifts marked "by phase" take their sets × reps from this week of the
// Race Plan; when the rep target changes, the load comes from your estimated
// 1RM (Epley) at ~2 reps in reserve (RPE 8).
// Guard rails: amber morning check → no increase; red → −10%; deload / unload /
// taper / race weeks → hold the weight (the plan cuts the sets instead).
(function () {
  const cfg = document.body.dataset;
  const PREV_KEY = cfg.prevKey;
  const HIST_KEY = 'rtc_tracker_training_v1';
  const READY_KEY = 'rtc_readiness_v1';
  const load = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch { return f; } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const unit = () => { try { return JSON.parse(localStorage.getItem('rtc_gym_unit_him_v1')) || 'kg'; } catch { return 'kg'; } };
  const pad = (n) => String(n).padStart(2, '0');
  const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

  // ---- what the exercise asks for ----
  function parseTarget(txt) {
    const t = String(txt || '').split('·')[0].split(' or ')[0];
    const m = /(\d+)(?:\s*[–-]\s*(\d+))?\s*×\s*(\d+)(?:\s*[–-]\s*(\d+))?\s*(s\b|sec|m\b)?/i.exec(t);
    if (!m) return null;
    return { sets: +(m[2] || m[1]), lo: +m[3], hi: +(m[4] || m[3]), kind: /^s|sec/i.test(m[5] || '') ? 'time' : /^m/i.test(m[5] || '') ? 'dist' : 'reps' };
  }
  function restOf(txt) { const m = /rest\s+([^·]+)/i.exec(txt || ''); return m ? m[1].trim() : ''; }

  // this week's prescription for the "by phase" main lifts (Strength A text)
  function planWeek() { const P = window.RACE_PLAN; return P ? (P.weekFor(new Date()) || null) : null; }
  function phaseTarget(dayId) {
    const w = planWeek(); if (!w) return null;
    const txt = dayId === 'strA' ? w.strA : dayId === 'strB' ? w.strB : dayId === 'upper' ? w.upper : null;
    return txt ? parseTarget(txt) : null;
  }
  function lightWeek() { const w = planWeek(); return !!(w && /deload|unload|taper|race week/i.test(w.phase)); }

  // ---- load steps (what the gym actually has) ----
  function increment(name) {
    const n = name.toLowerCase(); const lb = unit() === 'lb';
    if (/kettlebell|\bkb\b|swing/.test(n)) return lb ? 10 : 4;
    if (/leg press/.test(n)) return lb ? 20 : 10;
    if (/deadlift|trap-bar|hip thrust|back .*squat|safety-bar/.test(n)) return lb ? 10 : 5;
    if (/\bdb\b|dumbbell|goblet|lunge|thruster|carry|split squat|bulgarian|rdl/.test(n)) return lb ? 5 : 2;
    return lb ? 5 : 2.5;
  }
  const roundTo = (v, step) => Math.max(step, Math.round(v / step) * step);
  const fmt = (v) => (Math.round(v * 10) / 10).toString();

  // ---- most recent logged session for an exercise ----
  function lastSession(exId) {
    const prev = load(PREV_KEY, {})[exId];
    const hist = load(HIST_KEY, []).filter((t) => t.person === 'him' && (t.exercises || []).some((e) => e.exId === exId))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    const fromPrev = prev && prev.sets ? [1, 2, 3, 4, 5].map((i) => ({ w: prev.sets['w' + i], r: prev.sets['r' + i] })) : null;
    const fromHist = hist ? hist.exercises.find((e) => e.exId === exId).sets : null;
    const clean = (arr) => (arr || []).map((s) => ({ w: parseFloat(s.w), r: parseFloat(s.r) })).filter((s) => s.r > 0 || s.w > 0);
    const p = clean(fromPrev), h = clean(fromHist);
    if (!p.length) return h.length ? { sets: h, date: hist.date } : null;
    if (!h.length) return { sets: p, date: prev.at ? new Date(prev.at).toISOString().slice(0, 10) : null };
    const prevDate = prev.at ? new Date(prev.at).toISOString().slice(0, 10) : '';
    return prevDate >= hist.date ? { sets: p, date: prevDate } : { sets: h, date: hist.date };
  }

  // ---- today's readiness (same rules as the Race Plan morning check) ----
  function readiness() {
    const e = load(READY_KEY, {})[isoToday()] || {};
    if (e.sick) return 'r';
    const s = parseFloat(e.sleep);
    if (!s) return null;
    return s >= 6.5 ? 'g' : s >= 5 ? 'a' : 'r';
  }

  function suggest(ex) {
    const name = (ex.querySelector('.ex-name') || {}).textContent || '';
    const targetTxt = (ex.querySelector('.ex-target') || {}).textContent || '';
    const dayId = (ex.closest('.day-page') || { id: '' }).id.replace('day-', '');
    let tgt = parseTarget(targetTxt);
    const byPhase = /by phase/i.test(targetTxt);
    if (byPhase) tgt = phaseTarget(dayId) || tgt;
    if (!tgt) return null;
    const U = unit(); const rest = restOf(targetTxt);
    const last = lastSession(ex.dataset.ex);
    const reps = tgt.lo === tgt.hi ? `${tgt.lo}` : `${tgt.lo}–${tgt.hi}`;
    const unitLbl = tgt.kind === 'time' ? ' s' : tgt.kind === 'dist' ? ' m' : '';
    const scheme = `${tgt.sets} × ${reps}${unitLbl}`;
    if (!last) return { text: `${scheme} — first time: pick a load you could do ~2 more reps with (RPE 8). Log it and the next one gets suggested.`, w: null, rest };

    const ws = last.sets.map((s) => s.w).filter((w) => w > 0);
    const rs = last.sets.map((s) => s.r).filter((r) => r > 0);
    const lastW = ws.length ? Math.max(...ws) : 0;
    const when = last.date ? ` (${last.date})` : '';
    const lastTxt = last.sets.map((s) => `${s.w > 0 ? fmt(s.w) : 'BW'}×${s.r || '?'}`).join(', ');
    const light = lightWeek(); const ready = readiness();
    const inc = increment(name);

    // time holds / distance carries: progress the number, then the load
    if (tgt.kind === 'time') {
      const allTop = rs.length && rs.every((r) => r >= tgt.hi);
      return { text: allTop ? `${tgt.sets} × ${tgt.hi + 10} s${lastW ? ` @ ${fmt(lastW)} ${U}` : ''} — you held ${tgt.hi}+ s on every set; add 10 s (or a little load).` : `${scheme} — aim +5 s per set on last time.`, w: lastW || null, rest, last: lastTxt + when };
    }
    if (tgt.kind === 'dist') {
      if (!lastW) return { text: `${scheme} — log the weight per hand to get a suggestion.`, w: null, rest, last: lastTxt + when };
      const up = !light && ready !== 'a' && ready !== 'r';
      const w = ready === 'r' ? roundTo(lastW * 0.9, inc) : up ? lastW + inc : lastW;
      return { text: `${scheme} @ ${fmt(w)} ${U}${w > lastW ? ` (+${fmt(w - lastW)})` : ''} — ${up ? 'full distance last time, go heavier' : light ? 'lighter week, hold the load' : 'hold the load today'}.`, w, rest, last: lastTxt + when };
    }

    // bodyweight (nothing in the weight box): progress reps, then add load
    if (!lastW) {
      if (!rs.length) return null;
      const allTop = rs.every((r) => r >= tgt.hi);
      if (allTop && /pull-up|chin/i.test(name)) return { text: `${scheme} + 2.5 ${U} (belt or DB between the feet) — you hit ${tgt.hi}+ on every set.`, w: 2.5, rest, last: lastTxt + when };
      return { text: allTop ? `${tgt.sets} × ${tgt.hi + 2} — top of the range on every set; add 2 reps (or slow the lowering to 3 s).` : `${scheme} — aim +1 rep per set.`, w: null, rest, last: lastTxt + when };
    }

    // weighted
    const lastReps = rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : tgt.lo;
    let w, why;
    const repsChanged = byPhase && (lastReps > tgt.hi + 1 || lastReps < tgt.lo - 1);
    if (repsChanged) {
      // new rep target this phase → from the best set's estimated 1RM, ~2 reps in reserve
      const best = last.sets.filter((s) => s.w > 0 && s.r > 0).reduce((a, s) => Math.max(a, s.w * (1 + s.r / 30)), 0);
      w = roundTo(best / (1 + (tgt.hi + 2) / 30), inc);
      why = `new phase (${reps} reps) — from your best set, ~2 reps in the tank`;
    } else {
      const allTop = rs.length >= Math.min(tgt.sets, last.sets.length) && rs.every((r) => r >= tgt.hi);
      // fixed targets ("3 × 12"): only count a set as short when it's 3+ reps off
      const floor = tgt.lo === tgt.hi ? tgt.lo - 2 : tgt.lo;
      const under = rs.filter((r) => r < floor).length;
      if (allTop) { w = lastW + inc; why = `every set hit ${tgt.hi}+ last time — add ${fmt(inc)} ${U}`; }
      else if (under >= 2) {
        const step = inc >= 5 ? inc / 2 : inc;   // bar/machine: half a jump; DB/KB: one real step
        w = Math.min(lastW - step, roundTo(lastW * 0.95, step));
        why = `${under} sets fell well short of ${tgt.lo} — drop a little and own the reps`;
      }
      else { w = lastW; why = `same weight, +1 rep per set (top of the range = next jump)`; }
    }
    if (light && w > lastW) { w = lastW; why = 'lighter week on the plan — hold the weight, fewer sets'; }
    if (ready === 'a' && w > lastW) { w = lastW; why = 'amber morning — hold the weight today'; }
    if (ready === 'r') { w = roundTo(Math.min(w, lastW) * 0.9, inc); why = 'red morning — 10% lighter, easy reps'; }
    const diff = w - lastW;
    return { text: `${scheme} @ ${fmt(w)} ${U}${diff ? ` (${diff > 0 ? '+' : ''}${fmt(diff)})` : ''} — ${why}.`, w, rest, last: lastTxt + when };
  }

  function paint() {
    document.querySelectorAll('.exercise').forEach((ex) => {
      const box = ex.querySelector('.ex-sets'); if (!box) return;
      let el = box.querySelector('.next-target');
      if (!el) { el = document.createElement('div'); el.className = 'next-target'; box.appendChild(el); }
      const s = suggest(ex);
      if (!s) { el.innerHTML = ''; el.hidden = true; return; }
      el.hidden = false;
      el.innerHTML = `<span>🎯 <b>Next:</b> ${esc(s.text)}${s.rest ? ` Rest ${esc(s.rest)}.` : ''}</span>${s.w ? `<button type="button" class="next-fill" data-w="${s.w}">Fill ${esc(fmt(s.w))}</button>` : ''}`;
      ex.querySelectorAll('.set-input[data-field^="w"]').forEach((inp) => { inp.placeholder = s.w ? fmt(s.w) : unit(); });
    });
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.next-fill'); if (!b) return;
    e.stopPropagation();
    const ex = b.closest('.exercise');
    ex.querySelectorAll('.set-input[data-field^="w"]').forEach((inp) => { if (!inp.value) { inp.value = b.dataset.w; inp.dispatchEvent(new Event('input', { bubbles: true })); } });
    if (typeof window.save === 'function') window.save();
  });

  // after Reset the finished session becomes "last" → recompute right away
  const origReset = window.resetCurrentDay;
  if (typeof origReset === 'function') window.resetCurrentDay = function () { origReset.apply(this, arguments); paint(); };
  const origSave = window.saveToTracker;
  if (typeof origSave === 'function') window.saveToTracker = function () { origSave.apply(this, arguments); paint(); };

  paint();
  window.GymProgress = { paint, suggest, parseTarget };
})();
