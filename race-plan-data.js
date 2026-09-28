// race-plan-data.js — the approved 12-week HYROX race block (Sep 28 → Dec 20,
// 2026) as data. One source for the Race Plan page, the Schedule timelines,
// the Hyrox tab's Circuit A/B cards and the phone-calendar export.
//
// Evidence summary lives on the Race Plan page. Every session has a time
// (evenings on weekdays, mornings on weekends), an intensity and a link to
// the exact place in the app where you do it.
(function () {
  const RACE = { y: 2026, m: 12, d: 20, label: 'HYROX Men\'s Open', goalNote: 'Goal set after the Oct 31 half-sim benchmark · long-term target sub-60' };
  const E = 'easy', M = 'med', H = 'hard', R = 'rest';
  const L = {
    strB: 'gym-alison.html?day=strB', upper: 'gym-alison.html?day=upper', strA: 'gym-alison.html?day=strA',
    strC: 'gym-alison.html?day=strC', cA: 'hyrox.html#circuit-a', cB: 'hyrox.html#circuit-b',
    run: 'race-plan.html#today', diet: 'diet-alison.html',
  };
  // Monday = week start. Week 1 starts Mon 28 Sep 2026.
  const W1 = { y: 2026, m: 9, d: 28 };
  function dateOf(week, dayIdx) { const dt = new Date(W1.y, W1.m - 1, W1.d + (week - 1) * 7 + dayIdx); return dt; }

  // standard week builder
  function week(n, o) {
    const days = [
      Array.isArray(o.mon) ? o.mon : [
        { t: 'Strength B · full body', d: o.strB, k: M, href: L.strB, time: '5:15 PM', dur: 50 },
        { t: 'Volleyball (for fun)', d: '7–9 pm. 10 min ankle prep first.', k: R, time: '7:00 PM', dur: 120 },
      ],
      Array.isArray(o.tue) ? o.tue : [
        { t: 'Circuit A · running', d: o.a.main, k: H, href: L.cA, time: '5:00 PM', dur: 60 },
        { t: 'Upper strength', d: o.upper, k: M, href: L.upper, time: '6:05 PM', dur: 25 },
      ],
      Array.isArray(o.wed) ? o.wed : [
        { t: 'Strength A · legs', d: o.strA, k: M, href: L.strA, time: '5:00 PM', dur: 50 },
        { t: 'Easy bike / row / ski', d: o.wedErg || '20–30 min easy + 10 min mobility.', k: E, time: '5:55 PM', dur: 30 },
      ],
      Array.isArray(o.thu) ? o.thu : [
        { t: 'Easy run', d: `${o.thu} min zone 2 (talk in full sentences), quick steps.`, k: E, href: L.run, time: '5:00 PM', dur: o.thu },
        { t: 'Strength C · core, ankle, carries', d: o.strC || 'McGill big 3, Pallof, calf + tibialis work, balance, heavy carries. 25–30 min.', k: E, href: L.strC, time: `${o.thu >= 45 ? '5:50' : '5:40'} PM`, dur: 30 },
      ],
      Array.isArray(o.fri) ? o.fri : [{ t: 'Rest', d: 'Off. Optional easy swim + sauna 20–30 min, or a walk with the baby.', k: R, time: '5:00 PM', dur: 30 }],
      Array.isArray(o.sat) ? o.sat : [{ t: 'Circuit B · stations', d: o.b.text, k: o.bKind || H, href: L.cB, time: '9:00 AM', dur: 75 }],
      Array.isArray(o.sun) ? o.sun : [{ t: 'Long easy run', d: o.sun, k: E, href: L.run, time: '9:00 AM', dur: 60 }],
    ];
    return Object.assign({ n, days }, o);
  }

  const WEEKS = [
    week(1, { phase: 'Base · return', km: '12–16', erg: '45–60 min',
      note: 'About half your old volume. Nothing above RPE 7. Finish every session feeling you could do more.',
      strB: 'Light: 2 × 10 full body @ RPE 5–6 + mobility.', upper: '2 × 8–10 light.',
      a: { main: 'Easy fartlek: 30 min run with 6–8 × 1 min at RPE 6.', steps: ['10 min easy', '6–8 × 1 min steady (RPE 6), 1 min easy between', '5–10 min easy'], rest: 60 },
      strA: '2–3 × 8–10 @ RPE 5–6, focus on form.', thu: 25,
      b: { text: 'Technique circuit: 4 × 500 m + the first 4 stations, RPE 6.', runs: 500, level: 'beginner', stations: ['ski', 'push', 'pull', 'bbj'] },
      sun: '35 min: 20 min easy run + 15 min easy bike, then mobility.' }),
    week(2, { phase: 'Base', km: '16–19', erg: '60 min',
      strB: '3 × 10 full body @ RPE 6 + mobility.', upper: '3 × 8.',
      a: { main: '4 × 6 min at threshold (RPE 7), 2 min easy between.', steps: ['10 min easy + 4 strides', '4 × 6 min threshold (RPE 7, "comfortably hard"), 2 min easy jog', '10 min easy'], rest: 120 },
      strA: '3 × 8 @ RPE 6–7.', thu: 30,
      b: { text: '3–4 × (500 m run + 2 stations) at 60–70% load.', runs: 500, level: 'amateur', stations: 'all' },
      sun: '45 min easy + mobility.' }),
    week(3, { phase: 'Base → build', km: '19–22', erg: '60–75 min',
      note: 'Mon 12 Oct is Thanksgiving — if plans change, skip Monday; nothing else moves.',
      strB: '3 × 10 @ RPE 6–7 + mobility.', upper: '3 × 8.',
      a: { main: '3 × 10 min at threshold, 2–3 min easy between.', steps: ['10 min easy + 4 strides', '3 × 10 min threshold (RPE 7), 2–3 min easy', '10 min easy'], rest: 150 },
      strA: '4 × 6 @ RPE 7 (~75–80%).', thu: 35, strC: 'McGill big 3, Pallof, calf + tibialis, balance, heavy carries. Add low pogo hops.',
      b: { text: 'Compromised: 4 × (1 km run + lunges or wall balls) at RPE 7.', runs: 1000, level: 'amateur', stations: ['lunge', 'wb'] },
      sun: '55 min easy + mobility.' }),
    week(4, { phase: 'Deload', km: '14–16', erg: '45 min',
      note: 'Volume down 30–40%, weights stay the same. End the week feeling fresh.',
      strB: '2 × 8, same weights + mobility.', upper: '2 × 6.',
      a: { main: '5 × 3 min at RPE 7.', steps: ['10 min easy', '5 × 3 min at RPE 7, 2 min easy', '10 min easy'], rest: 120 },
      strA: '2–3 × 5 at last week’s load.', thu: 30, strC: 'Ankle and core only, 20 min.',
      b: { text: 'Light technique + Roxzone transition drills (walk in, station, walk out, go).', runs: 500, level: 'beginner', stations: ['ski', 'push', 'pull', 'bbj'] }, bKind: M,
      sun: '45 min easy.' }),
    week(5, { phase: 'Build', km: '22–24', erg: '75–90 min',
      note: 'Sat 31 Oct: HALF-SIM BENCHMARK — 4 × 1 km + the first 4 stations at ~85%. These times set your goal and paces for the rest of the block.',
      strB: '3 × 10–12 station endurance (lunges, wall balls, carries) @ RPE 7.', upper: '3 × 6.',
      a: { main: '5 × 1 km at threshold, 75 s rest.', steps: ['10 min easy + 4 strides', '5 × 1 km at threshold, 75 s easy', '10 min easy'], rest: 75 },
      strA: '4 × 5 @ RPE 7–8 (~80–85%).', wedErg: '25 min easy row + mobility.', thu: 40,
      b: { text: 'HALF SIM: Run–Ski–Run–Push–Run–Pull–Run–BBJ at ~85%.', runs: 1000, level: 'intermediate', stations: ['ski', 'push', 'pull', 'bbj'], benchmark: true },
      sun: '60 min easy (or 40 run + 20 bike).' }),
    week(6, { phase: 'Build', km: '24–27', erg: '90 min',
      strB: '3 × 12 station endurance @ RPE 7.', upper: '3 × 5.',
      a: { main: '6 × 800 m at 5 km pace, 90 s rest.', steps: ['10 min easy + 4 strides', '6 × 800 m at 5 km pace, 90 s easy', '10 min easy'], rest: 90 },
      strA: '4 × 4–5 @ RPE 8.', thu: 45, strC: 'Core, ankle, heavy carries.',
      b: { text: '5–6 × (1 km + station), back-half stations: row, farmers, lunges, wall balls.', runs: 1000, level: 'intermediate', stations: ['row', 'carry', 'lunge', 'wb'] },
      sun: '65 min easy.' }),
    week(7, { phase: 'Build (biggest week)', km: '26–30', erg: '90–120 min',
      strB: '3 × 12–15 station endurance @ RPE 7.', upper: '3 × 5.',
      a: { main: '2 × 15 min threshold (or 4 × 2 km).', steps: ['10 min easy + 4 strides', '2 × 15 min threshold, 3 min easy (or 4 × 2 km, 2 min)', '10 min easy'], rest: 180 },
      strA: '3–4 × 4 @ RPE 8.', wedErg: '30 min easy ski + mobility.', thu: 45,
      b: { text: 'Station-heavy: wall-ball and lunge volume up; leg-press sled push loaded heavy.', runs: 1000, level: 'competition', stations: 'all' },
      sun: '75 min easy (or 50 run + 25 bike).' }),
    week(8, { phase: 'Deload', km: '18–20', erg: '60 min',
      strB: '2 × 10, lighter + mobility.', upper: '2 × 4.',
      a: { main: '4 × 1 km at race pace.', steps: ['10 min easy + 4 strides', '4 × 1 km at race pace, 90 s easy', '10 min easy'], rest: 90 },
      strA: '2 × 4 at the same load.', thu: 35, strC: 'Ankle and core only, 20 min.',
      b: { text: 'Mini-sim: 4 × 1 km + 4 stations, controlled. Or rest if the week was rough.', runs: 1000, level: 'intermediate', stations: ['ski', 'push', 'pull', 'bbj'] }, bKind: M,
      sun: '55 min easy.' }),
    week(9, { phase: 'Race-specific', km: '26–30', erg: '60–90 min',
      note: 'Sat 28 Nov: FULL SIM, 3 weeks out. Race effort, race fuel, race shoes, Roxzone rehearsal. Bank sleep Thu–Fri; Sunday and Monday easy after.',
      strB: '2 × 10 @ RPE 6 + mobility.', upper: '2 × 4.',
      a: { main: 'Sharpener: 6 × 400 m at race pace. Keep it light.', steps: ['10 min easy + 4 strides', '6 × 400 m at race pace, 90 s easy', '10 min easy'], rest: 90 },
      strA: '2–3 × 3–4 @ ~80–85%. Last lifting before the sim.', thu: 35, strC: 'Ankle and core only, 20 min.',
      fri: [{ t: 'Rest', d: 'Off. Carbs up, sleep in if you can.', k: R, time: '5:00 PM', dur: 30 }],
      b: { text: 'FULL SIM: 8 × 1 km + 8 stations in race order.', runs: 1000, level: 'competition', stations: 'all', sim: true },
      sun: '' }),
    week(10, { phase: 'Race-specific / peak', km: '28–32', erg: '60–90 min',
      mon: [{ t: 'Mobility', d: '20 min (two days after the full sim).', k: E, href: L.strB, time: '5:15 PM', dur: 20 },
            { t: 'Volleyball (for fun)', d: 'Easy, or skip after the sim.', k: R, time: '7:00 PM', dur: 120 }],
      upper: '2 × 3.',
      a: { main: '5–6 × 1 km at goal race pace, 60 s rest (Roxzone length).', steps: ['10 min easy + 4 strides', '5–6 × 1 km at goal race pace, 60 s easy', '10 min easy'], rest: 60 },
      strA: '2 × 3 @ ~80–85%, accessories out.', thu: 45, strC: 'Core, ankle.',
      b: { text: '4 × (1 km + station at race load) — fix the weakest stations from the sim.', runs: 1000, level: 'competition', stations: 'all' },
      sun: '70 min easy (your longest).' }),
    week(11, { phase: 'Taper 1', km: '20–24', erg: '45–60 min',
      note: 'Volume down ~30%, intensity stays. Last heavy legs Wed 9 Dec. Sat 12 Dec is the last hard session.',
      strB: '2 × 8 light + mobility.', upper: '1 × 3.',
      a: { main: '4 × 1 km at race pace.', steps: ['10 min easy + 4 strides', '4 × 1 km at race pace, 90 s easy', '10 min easy'], rest: 90 },
      strA: '2 × 3 @ ~80%. Last heavy legs.', thu: 35, strC: 'Ankle and core only, 15 min.',
      b: { text: 'Last hard: 4 × 1 km + 4 stations at race pace, reduced volume.', runs: 1000, level: 'competition', stations: ['ski', 'push', 'pull', 'bbj'] },
      sun: '50 min easy.' }),
    week(12, { phase: 'Race week', km: '10–14 + race', erg: '20–40 min',
      note: 'Race is SUNDAY 20 Dec. Volume down ~50–60%, still short sessions most days. Sleep, carbs (~8 g/kg Saturday), nothing new.',
      mon: [{ t: 'Mobility', d: '20 min. Skip volleyball, or easy touches only (ankle risk before the race).', k: E, href: L.strB, time: '5:15 PM', dur: 20 }],
      tue: [{ t: 'Race-pace touch', d: '3–4 × 400 m at race pace + a few wall balls and lunges.', k: M, href: L.cA, time: '5:00 PM', dur: 40 }],
      wed: [{ t: 'Easy bike + mobility', d: '30 min easy bike, 10 min mobility.', k: E, time: '5:00 PM', dur: 40 }],
      thu: [{ t: 'Easy run + strides', d: '20–25 min easy + 4 strides.', k: E, href: L.run, time: '5:00 PM', dur: 30 }],
      fri: [{ t: 'Rest', d: 'Off. Sleep, normal food.', k: R, time: '5:00 PM', dur: 20 }],
      sat: [{ t: 'Shakeout + carb load', d: '15 min easy + 3 strides. ~8 g/kg carbs today. Pack the bag, check your heat time.', k: E, href: L.diet, time: '9:00 AM', dur: 20 }],
      sun: [{ t: 'RACE DAY · HYROX 🏁', d: 'Men’s Open, Sun 20 Dec. Trust the work.', k: H, href: 'hyrox.html', time: '9:00 AM', dur: 90 }],
      a: { main: '3–4 × 400 m at race pace + a few station touches.', steps: ['10 min easy', '3–4 × 400 m at race pace, 2 min easy', 'A few wall balls + lunges', '5 min easy'], rest: 120 },
      b: { text: 'RACE DAY — Sun 20 Dec. Saturday is a 15 min shakeout + carb load.', runs: 1000, level: 'competition', stations: 'all', race: true } }),
  ];
  // week 9 Sunday is recovery after the sim
  WEEKS[8].days[6] = [{ t: 'Recovery', d: '30–40 min easy bike or swim + sauna. No running.', k: E, time: '9:00 AM', dur: 40 }];

  // ---- From week 3 (Mon 12 Oct): train before work 6–7 AM, second session
  // 4:30–5:30 PM. Hard/heavy work goes in the morning, the lighter piece in the
  // afternoon (~9 h apart = the concurrent-training sweet spot). Weekends stay
  // at 9 AM. On an amber/red night the AM session slides to 4:30 PM.
  const AM_FROM_WEEK = 3;
  const RETIME = {
    0: { 'Strength B · full body': '6:00 AM', 'Mobility': '6:00 AM' },
    1: { 'Circuit A · running': '6:00 AM', 'Upper strength': '4:30 PM', 'Race-pace touch': '6:00 AM' },
    2: { 'Strength A · legs': '6:00 AM', 'Easy bike / row / ski': '4:30 PM', 'Easy bike + mobility': '6:00 AM' },
    3: { 'Easy run': '6:00 AM', 'Strength C · core, ankle, carries': '4:30 PM', 'Easy run + strides': '6:00 AM' },
    4: { 'Rest': '4:30 PM' },
  };
  WEEKS.forEach((w) => {
    if (w.n < AM_FROM_WEEK) return;
    Object.keys(RETIME).forEach((i) => {
      w.days[i] = w.days[i].map((s) => {
        const t = RETIME[i][s.t];
        if (!t) return s;
        return Object.assign({}, s, { time: t, am: t.endsWith('AM'), d: t.endsWith('AM') && s.k !== 'rest' ? s.d + ' Bad night? Slide it to 4:30 PM.' : s.d });
      });
    });
    // AM-first order within a day
    w.days = w.days.map((ds) => ds.slice().sort((x, y) => toMin(x.time) - toMin(y.time)));
  });
  function toMin(t) { const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t || ''); if (!m) return 0; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; }

  // ---- BC statutory holidays: gym closed → home / outdoor versions ----
  // (BC 2026: Sep 30 Truth & Reconciliation, Oct 12 Thanksgiving, Nov 11
  // Remembrance Day, Dec 25 Christmas — Boxing Day is not a BC stat.)
  const HOLIDAYS = [
    { date: '2026-09-30', name: 'National Day for Truth and Reconciliation' },
    { date: '2026-10-12', name: 'Thanksgiving' },
    { date: '2026-11-11', name: 'Remembrance Day' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ];
  const HOLIDAY_SESSIONS = {
    '2026-09-30': [
      { t: '🏠 Legs at home / outside', d: 'Gym closed (stat holiday). 3 rounds, RPE 5–6: 15 air squats · 10 walking lunges / leg · 10 split squats / leg · 12 single-leg RDL / leg · 20 calf raises. 10 min mobility.', k: M, href: 'race-plan.html#today', time: '5:00 PM', dur: 40 },
      { t: '🌳 Easy walk or ride outside', d: '30 min easy — the Wednesday aerobic piece, outdoors.', k: E, time: '5:45 PM', dur: 30 },
    ],
    '2026-10-12': [
      { t: '🏠 Full body at home', d: 'Gym closed (Thanksgiving). 3 rounds, RPE 6–7: 10 burpees · 15 push-ups · 20 walking lunges · 20 air squats · 30 s plank · 10 single-leg glute bridges / leg. Then 10–15 min mobility. Sleep in — no 6 AM today.', k: M, href: 'race-plan.html#today', time: '9:00 AM', dur: 45 },
      { t: 'Volleyball (for fun)', d: 'Probably off for Thanksgiving — enjoy the day.', k: R, time: '7:00 PM', dur: 120 },
    ],
    '2026-11-11': [
      { t: '🌳 Legs outside: hills / stairs + bodyweight', d: 'Gym closed (Remembrance Day). 10 min easy jog · 8 × 30 s hill or stair climb, walk down · then 3 rounds: 20 walking lunges · 12 split squats / leg · 15 single-leg RDL / leg · 10 soft jump squats (land quietly — ankle). Strength effort, not a race.', k: M, href: 'race-plan.html#today', time: '9:00 AM', dur: 50 },
      { t: '🌳 Easy walk or ride', d: '30 min easy outside + 10 min mobility.', k: E, time: '4:30 PM', dur: 30 },
    ],
  };
  const isoOf = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  WEEKS.forEach((w) => w.days.forEach((ds, i) => {
    const key = isoOf(dateOf(w.n, i));
    const h = HOLIDAYS.find((x) => x.date === key);
    if (h && HOLIDAY_SESSIONS[key]) w.days[i] = HOLIDAY_SESSIONS[key].map((s) => Object.assign({ holiday: h.name }, s));
  }));
  function holidayOn(date) { return HOLIDAYS.find((x) => x.date === isoOf(date)) || null; }

  const DAYKEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAYNAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function startOf(w) { return dateOf(w.n, 0); }
  function weekFor(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return WEEKS.find((w) => { const s = startOf(w), e = new Date(s); e.setDate(e.getDate() + 7); return d >= s && d < e; }) || null;
  }
  function dayIndex(date) { return (date.getDay() + 6) % 7; }         // Mon = 0
  function sessionsOn(date) { const w = weekFor(date); return w ? w.days[dayIndex(date)] : null; }
  function daysToRace(date) {
    const t = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((Date.UTC(RACE.y, RACE.m - 1, RACE.d) - t) / 86400000);
  }
  window.RACE_PLAN = { RACE, WEEKS, DAYKEYS, DAYNAMES, LINKS: L, HOLIDAYS, AM_FROM_WEEK, dateOf, weekFor, dayIndex, sessionsOn, daysToRace, holidayOn, isoOf };
})();
