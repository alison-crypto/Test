// race-plan-data.js — the approved 12-week HYROX race block (Sep 28 → Dec 20,
// 2026) as data. One source for the Race Plan page, the Schedule timelines,
// the Hyrox tab's Circuit A/B cards and the phone-calendar export.
//
// Evidence summary lives on the Race Plan page. Every session has a time
// (evenings on weekdays, mornings on weekends), an intensity and a link to
// the exact place in the app where you do it.
(function () {
  const RACE = { y: 2026, m: 12, d: 20, label: 'HYROX Men\'s Open', goalNote: 'Going for sub-60 · checkpoint: Oct 31 half-sim ≈ 30 min or less' };
  const E = 'easy', M = 'med', H = 'hard', R = 'rest';
  const L = {
    strB: 'gym-alison.html?day=strB', upper: 'gym-alison.html?day=upper', strA: 'gym-alison.html?day=strA',
    strC: 'gym-alison.html?day=strC', cA: 'run.html?kind=iv', cB: 'hyrox.html#circuit-b',
    run: 'run.html?kind=easy', runLong: 'run.html?kind=long', diet: 'diet-alison.html', coach: 'hyrox.html#coach',
  };
  // Monday = week start. Week 1 starts Mon 28 Sep 2026.
  const W1 = { y: 2026, m: 9, d: 28 };
  function dateOf(week, dayIdx) { const dt = new Date(W1.y, W1.m - 1, W1.d + (week - 1) * 7 + dayIdx); return dt; }

  // Coached HYROX circuits with the RTC trainer: Tue + Thu 5:30 AM, ~50 min
  // (from Oct 6). They are the hard station/compromised-running days, so the
  // running intervals move to Saturday and Wednesday carries both strength
  // sessions. Friday is rest — or an easy run + core if sleep was good.
  const COACH_TIME = '5:30 AM';
  const COACH_D = '50 min with the RTC trainer — stations + running. Log what you did on the Hyrox tab. Bad night? Go at ~70%: the coach sets the menu, you set the effort.';
  function coach(note) { return { t: 'RTC coached circuit', d: note ? `${note} ${COACH_D}` : COACH_D, k: H, href: L.coach, time: COACH_TIME, dur: 50, coach: true }; }

  // standard week builder
  function week(n, o) {
    const satSim = o.b && (o.b.benchmark || o.b.sim);
    const days = [
      Array.isArray(o.mon) ? o.mon : [
        { t: 'Strength B · full body', d: o.strB, k: M, href: L.strB, time: '5:15 PM', dur: 50 },
        { t: 'Volleyball (for fun)', d: '7–9 pm. 10 min ankle prep first.', k: R, time: '7:00 PM', dur: 120 },
      ],
      Array.isArray(o.tue) ? o.tue : [coach(o.coachTue)],
      Array.isArray(o.wed) ? o.wed : [
        { t: 'Strength A · legs', d: o.strA, k: M, href: L.strA, time: '5:00 PM', dur: 50 },
        { t: 'Upper strength', d: o.upper, k: M, href: L.upper, time: '6:00 PM', dur: 25 },
      ],
      Array.isArray(o.thu) ? o.thu : [coach(o.coachThu)],
      Array.isArray(o.fri) ? o.fri : [{ t: 'Rest — or easy run + core', d: `Slept ≥ 6.5 h? ${o.easy || 30} min zone 2 run + 20 min core / ankle (Strength C). Otherwise rest: walk with the baby, sauna.`, k: E, href: L.run, time: '5:00 PM', dur: o.easy || 30 }],
      Array.isArray(o.sat) ? o.sat : satSim
        ? [{ t: o.b.sim ? 'FULL SIM' : 'Half-sim benchmark', d: o.b.text, k: H, href: L.cB, time: '9:00 AM', dur: o.b.sim ? 90 : 60 }]
        : [{ t: 'Run intervals', d: o.a.main, k: o.satKind || H, href: L.cA, time: '9:00 AM', dur: 60 }],
      Array.isArray(o.sun) ? o.sun : [{ t: 'Long easy run', d: o.sun + ' Day after Saturday’s session: zone 2 only — full sentences, no pace goal. Sore legs or < 6 h sleep → do half of it on the bike.', k: E, href: L.runLong, time: '9:00 AM', dur: 60 }],
    ];
    return Object.assign({ n, days }, o);
  }

  const WEEKS = [
    week(1, { phase: 'Base · return', km: '12–16', erg: '45–60 min',
      note: 'About half your old volume. Nothing above RPE 7. Finish every session feeling you could do more.',
      strB: 'Light: 2 × 10 full body @ RPE 5–6 + mobility.', upper: '2 × 8–10 light.',
      a: { main: 'Easy fartlek: 30 min run with 6–8 × 1 min at RPE 6.', steps: ['10 min easy', '6–8 × 1 min steady (RPE 6), 1 min easy between', '5–10 min easy'], rest: 60 },
      strA: '2–3 × 8–10 @ RPE 5–6, focus on form.', iv: { reps: 7, secs: 60, rest: 60, zone: 'steady', wu: 10, cd: 5, strides: 0 }, long: 35, easy: 25,
      b: { text: 'Technique circuit: 4 × 500 m + the first 4 stations, RPE 6.', runs: 500, level: 'beginner', stations: ['ski', 'push', 'pull', 'bbj'] },
      tue: [{ t: 'Circuit A · running', d: 'Done — easy fartlek 30 min.', k: H, href: L.cA, time: '5:00 PM', dur: 60 },
            { t: 'Upper strength', d: 'Done — 2 × 8–10 light.', k: M, href: L.upper, time: '6:05 PM', dur: 25 }],
      wed: [{ t: 'Rest', d: 'Rested (legs moved — no need to make them up).', k: R, time: '5:00 PM', dur: 20 }],
      thu: [{ t: 'RTC coached circuit (intro)', d: 'Easy intro circuit + measurements: 30 m sled push · 30 m walking lunge · 30 shoulder taps · 90 m farmers carry · 240 m run · 250 m SkiErg · 30 wall balls · 250 m SkiErg · 30 m burpees · 30 squats with 15 lb overhead.', k: M, href: L.coach, time: COACH_TIME, dur: 40, coach: true }],
      sun: '35 min: 20 min easy run + 15 min easy bike, then mobility.' }),
    week(2, { phase: 'Base', km: '16–19', erg: '60 min',
      strB: '3 × 10 full body @ RPE 6 + mobility.', upper: '3 × 8.',
      a: { main: '4 × 6 min at threshold (RPE 7), 2 min easy between.', steps: ['10 min easy + 4 strides', '4 × 6 min threshold (RPE 7, "comfortably hard"), 2 min easy jog', '10 min easy'], rest: 120 },
      strA: '3 × 8 @ RPE 6–7.', iv: { reps: 4, secs: 360, rest: 120, zone: 'subT' }, long: 45, easy: 30,
      b: { text: '3–4 × (500 m run + 2 stations) at 60–70% load.', runs: 500, level: 'amateur', stations: 'all' },
      sun: '45 min easy + mobility.' }),
    week(3, { phase: 'Build 1', km: '21–23', erg: '75 min',
      note: 'Build starts: ~10% more running a week (never more than 15%). Hard and heavy work in the 6 AM slot, the lighter piece at 4:30. Mon 12 Oct is Thanksgiving — home session, sleep in.',
      strB: '3 × 10 @ RPE 7 + finisher: 3 × (20 wall balls + 20 m lunges), steady, not a race.', upper: '3 × 8 @ RPE 7.',
      a: { main: 'Sub-threshold: 5 × 1 km at "comfortably hard" (RPE 7, could say a short sentence), 75 s jog.', steps: ['10 min easy + 4 strides', '5 × 1 km sub-threshold (RPE 7), 75 s easy jog', '10 min easy'], rest: 75 },
      strA: '4 × 5 @ RPE 7–8 (~80%) — heavy leg press as the sled.', wedErg: '30 min easy bike / row + 10 min mobility.', iv: { reps: 5, dist: 1000, rest: 75, zone: 'subT' }, long: 60, easy: 40,
      strC: 'McGill big 3, Pallof, calf + tibialis, balance, heavy carries. Add low pogo hops.',
      b: { text: 'Compromised running: 5 × (1 km at RPE 8 + a station). Stations: ski, lunges, wall balls, row, farmers. Write down each 1 km split.', runs: 1000, level: 'intermediate', stations: ['ski', 'lunge', 'wb', 'row', 'carry'] },
      sun: '60 min easy (or 45 run + 20 bike) + mobility.' }),
    week(4, { phase: 'Build 2', km: '23–26', erg: '75–90 min',
      note: 'Biggest week so far — this replaces the old deload (the unload moves to week 5, right before the benchmark). Two bad nights in a row, or resting HR up 5+ for 3 days → take week 5’s version now.',
      strB: '3 × 12 station endurance (walking lunges, wall balls, sandbag / DB carries) @ RPE 7.', upper: '3 × 6 @ RPE 7–8.',
      a: { main: 'Sub-threshold: 6 × 1 km at RPE 7, 60–75 s jog.', steps: ['10 min easy + 4 strides', '6 × 1 km sub-threshold (RPE 7), 60–75 s easy jog', '10 min easy'], rest: 70 },
      strA: '4 × 4–5 @ RPE 8 (~82–85%). Leg press heavy, controlled.', wedErg: '35 min easy ski / row / bike + mobility.', iv: { reps: 6, dist: 1000, rest: 70, zone: 'subT' }, long: 70, easy: 45,
      strC: 'Core, ankle, heavy carries (farmers 4 × 50 m at race weight or heavier).',
      b: { text: 'Race-order compromised: 6 × (1 km at RPE 8 + station) — ski, leg-press push, pull, burpee broad jumps, row, wall balls. Aim for even 1 km splits.', runs: 1000, level: 'intermediate', stations: ['ski', 'push', 'pull', 'bbj', 'row', 'wb'] },
      sun: '70 min easy (or 50 run + 25 bike) + mobility.' }),
    week(5, { phase: 'Unload + benchmark', km: '17–19 + sim', erg: '45 min',
      coachThu: 'Thursday before the benchmark: go at ~70%, skip anything max-effort.',
      note: 'Volume down ~30%, intensity stays — so you hit Saturday fresh. Sat 31 Oct: HALF-SIM BENCHMARK at race effort. The result sets your real goal: first half in ~30 min or less = sub-60 is on.',
      strB: '2 × 8 @ RPE 6 + mobility.', upper: '2 × 6.',
      a: { main: '4 × 1 km at goal race pace, 90 s jog. Feel the pace, don’t chase it.', steps: ['10 min easy + 4 strides', '4 × 1 km at goal race pace (sub-60 = ~3:40/km), 90 s easy', '10 min easy'], rest: 90 },
      strA: '3 × 3 @ RPE 7 — heavy but short. Keep the strength, lose the fatigue.', wedErg: '20 min easy bike + mobility.', iv: { reps: 4, dist: 1000, rest: 90, zone: 'race' }, long: 40, easy: 30,
      strC: 'Ankle and core only, 20 min.',
      b: { text: 'HALF SIM BENCHMARK at race effort: Run–Ski–Run–Push–Run–Pull–Run–BBJ. Time every run, station and transition.', runs: 1000, level: 'competition', stations: ['ski', 'push', 'pull', 'bbj'], benchmark: true },
      sun: '40 min easy run or bike — recovery after the benchmark.' }),
    week(6, { phase: 'Build 3', km: '25–28', erg: '90 min',
      note: 'Second build block starts higher than the first. Paces now come from your Oct 31 benchmark.',
      strB: '4 × 15 wall balls + 4 × 20 m sandbag lunges + 3 × 40 m heavy carries @ RPE 7–8 — station endurance.', upper: '3 × 5 @ RPE 8.',
      a: { main: '8 × 1 km sub-threshold (RPE 7), 60 s jog — race distance at controlled effort.', steps: ['10 min easy + 4 strides', '8 × 1 km sub-threshold, 60 s easy jog', '10 min easy'], rest: 60 },
      iv: { reps: 8, dist: 1000, rest: 60, zone: 'subT' },
      strA: '4 × 4 @ RPE 8 (~85%). Leg press heavy.', wedErg: '35 min easy ski / row + mobility.', easy: 45, long: 70,
      strC: 'Core, ankle, heavy carries.',
      b: { text: '6 × (1 km at goal race pace + station at race load) — row, farmers, lunges, wall balls, ski, burpee broad jumps.', runs: 1000, level: 'competition', stations: ['row', 'carry', 'lunge', 'wb', 'ski', 'bbj'] },
      sun: '70 min easy (or 50 run + 20 bike).' }),
    week(7, { phase: 'Build 4 (biggest week)', km: '28–31', erg: '90–120 min',
      note: 'Peak training load of the block. If sleep falls apart this week, drop Friday’s optional run and do Saturday as 3 × 2 km.',
      strB: '4 × 20 wall balls + 4 × 25 m sandbag lunges + carries @ RPE 8.', upper: '3 × 5 @ RPE 8.',
      a: { main: '4 × 2 km at threshold (RPE 8), 90 s jog — longer reps, same 8 km.', steps: ['10 min easy + 4 strides', '4 × 2 km threshold, 90 s easy jog', '10 min easy'], rest: 90 },
      iv: { reps: 4, dist: 2000, rest: 90, zone: 'T' },
      strA: '5 × 3 @ RPE 8 (~87%).', wedErg: '40 min easy ski / bike + mobility.', easy: 50, long: 80,
      b: { text: 'Big day: 8 × (1 km at goal pace + station at race load) in race order, wall balls and lunges at full race volume. RPE 8, not all-out.', runs: 1000, level: 'competition', stations: 'all' },
      sun: '80 min easy (or 55 run + 25 bike) — longest aerobic day so far.' }),
    week(8, { phase: 'Deload', km: '20–22', erg: '60 min',
      note: 'Absorb weeks 6–7. Volume down ~35%, a little speed stays so you arrive sharp at the full sim.',
      strB: '2 × 10, lighter + mobility.', upper: '2 × 4.',
      a: { main: '5 × 1 km at goal race pace, 90 s jog.', steps: ['10 min easy + 4 strides', '5 × 1 km at goal race pace, 90 s easy', '10 min easy'], rest: 90 },
      iv: { reps: 5, dist: 1000, rest: 90, zone: 'race' },
      strA: '2 × 3 at the same load.', easy: 35, long: 55, strC: 'Ankle and core only, 20 min.',
      b: { text: 'Mini-sim: 4 × 1 km + 4 stations, controlled. Or rest if the week was rough.', runs: 1000, level: 'intermediate', stations: ['ski', 'push', 'pull', 'bbj'] }, bKind: M,
      sun: '55 min easy.' }),
    week(9, { phase: 'Race-specific', km: '26–29', erg: '60–90 min',
      coachThu: 'Two days before the full sim: ~70%, technique only.',
      note: 'Sat 28 Nov: FULL SIM, 3 weeks out. Race effort, race fuel, race shoes, Roxzone rehearsal. Bank sleep Thu–Fri; Sunday and Monday easy after.',
      strB: '2 × 10 @ RPE 6 + mobility.', upper: '2 × 4.',
      a: { main: 'Sharpener: 6 × 400 m a bit faster than race pace, 90 s jog. Keep it light — Saturday matters more.', steps: ['10 min easy + 4 strides', '6 × 400 m slightly faster than race pace, 90 s easy', '10 min easy'], rest: 90 },
      iv: { reps: 6, dist: 400, rest: 90, zone: 'fast' },
      strA: '3 × 3 @ ~85%. Last lifting before the sim.', easy: 40, strC: 'Ankle and core only, 20 min.',
      fri: [{ t: 'Rest', d: 'Off. Carbs up, sleep in if you can.', k: R, time: '5:00 PM', dur: 30 }],
      b: { text: 'FULL SIM: 8 × 1 km + 8 stations in race order at race effort.', runs: 1000, level: 'competition', stations: 'all', sim: true },
      sun: '' }),
    week(10, { phase: 'Peak', km: '29–32', erg: '60–90 min',
      note: 'Hardest race-specific week — the last big push. Tell the coach your weakest stations from the full sim.',
      mon: [{ t: 'Mobility', d: '20 min (two days after the full sim).', k: E, href: L.strB, time: '5:15 PM', dur: 20 },
            { t: 'Volleyball (for fun)', d: 'Easy, or skip after the sim.', k: R, time: '7:00 PM', dur: 120 }],
      upper: '2 × 3 @ RPE 8.',
      a: { main: '8 × 1 km at goal race pace, 60 s jog (Roxzone length) — the full race run distance at race speed.', steps: ['10 min easy + 4 strides', '8 × 1 km at goal race pace, 60 s easy jog', '10 min easy'], rest: 60 },
      iv: { reps: 8, dist: 1000, rest: 60, zone: 'race' },
      strA: '3 × 2–3 @ ~85–88%, accessories out — strength peaks, volume stays low.', easy: 50, long: 75, strC: 'Core, ankle.',
      b: { text: '2 × (4 × 1 km at goal pace + 4 stations at race load), 5 min walk between halves. Weakest stations from the sim go first.', runs: 1000, level: 'competition', stations: 'all' },
      sun: '75 min easy (last long run).' }),
    week(11, { phase: 'Taper 1', km: '20–23', erg: '45–60 min',
      coachTue: 'Taper: full effort but stop at ~45 min.', coachThu: 'Taper: ~80% effort.',
      note: 'Volume down ~30–35%, intensity stays. Last heavy legs Wed 9 Dec. Sat 12 Dec is the last hard session.',
      strB: '2 × 8 light + mobility.', upper: '1 × 3.',
      a: { main: '5 × 1 km at race pace, 90 s jog.', steps: ['10 min easy + 4 strides', '5 × 1 km at race pace, 90 s easy', '10 min easy'], rest: 90 },
      iv: { reps: 5, dist: 1000, rest: 90, zone: 'race' },
      strA: '2 × 3 @ ~80%. Last heavy legs.', easy: 35, long: 50, strC: 'Ankle and core only, 15 min.',
      b: { text: 'Last hard: 4 × 1 km + 4 stations at race pace, reduced volume.', runs: 1000, level: 'competition', stations: ['ski', 'push', 'pull', 'bbj'] },
      sun: '50 min easy.' }),
    week(12, { phase: 'Race week', km: '10–14 + race', erg: '20–40 min',
      note: 'Race is SUNDAY 20 Dec. Volume down ~50–60%, still short sessions most days. Sleep, carbs (~8 g/kg Saturday), nothing new.',
      mon: [{ t: 'Mobility', d: '20 min. Skip volleyball, or easy touches only (ankle risk before the race).', k: E, href: L.strB, time: '5:15 PM', dur: 20 }],
      tue: [coach('Race week: ~60% and done at 30–35 min. Ask the coach for race-pace touches, nothing new.')],
      wed: [{ t: 'Easy bike + mobility', d: '30 min easy bike, 10 min mobility.', k: E, time: '5:00 PM', dur: 40 },
            { t: 'Easy run + strides', d: '20 min easy + 4 strides.', k: E, href: L.run, time: '5:45 PM', dur: 25 }],
      thu: [{ t: 'RTC coached circuit — skip or walk-through', d: 'Three days out: skip it, or walk through the stations at 50% to rehearse transitions. No sweat-fest.', k: E, href: L.coach, time: COACH_TIME, dur: 30, coach: true }],
      fri: [{ t: 'Rest', d: 'Off. Sleep, normal food.', k: R, time: '5:00 PM', dur: 20 }],
      sat: [{ t: 'Shakeout + carb load', d: '15 min easy + 3 strides. ~8 g/kg carbs today. Pack the bag, check your heat time.', k: E, href: L.diet, time: '9:00 AM', dur: 20 }],
      sun: [{ t: 'RACE DAY · HYROX 🏁', d: 'Men’s Open, Sun 20 Dec. Trust the work.', k: H, href: 'hyrox.html', time: '9:00 AM', dur: 90 }],
      iv: { reps: 4, dist: 400, rest: 120, zone: 'race', strides: 0, cd: 5 }, easy: 25,
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
    2: { 'Strength A · legs': '6:00 AM', 'Upper strength': '4:30 PM', 'Easy bike + mobility': '6:00 AM', 'Easy run + strides': '4:30 PM' },
    4: { 'Rest — or easy run + core': '4:30 PM', 'Rest': '4:30 PM' },
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

  // Sub-60 race budget (Men's Open). Built from race-data ranges: sub-60 is
  // roughly the top 1–2% of Open men; runs ~3:30–3:50/km, Roxzone ~4–5 min.
  const SUB60 = {
    total: '59:30', runs: '29:30 (≈ 3:40 / km)', roxzone: '4:30 (≈ 17 s a transition)', stations: '25:30',
    split: [['SkiErg 1000 m', '3:50'], ['Sled push', '2:45'], ['Sled pull', '3:15'], ['Burpee broad jumps', '3:00'],
            ['Row 1000 m', '3:50'], ['Farmers carry', '1:15'], ['Sandbag lunges', '3:10'], ['Wall balls 100', '4:25']],
    halfSim: '≈ 29:30–30:30 for 4 × 1 km + ski, push, pull, BBJ with transitions',
  };
  // Coached sessions already done (the Hyrox tab adds new ones on the phone)
  const COACH_LOG = [
    { date: '2026-10-01', text: 'Intro circuit + measurements: 30 m sled push · 30 m walking lunge · 30 shoulder taps · 90 m farmers carry · 240 m run · 250 m SkiErg · 30 wall balls · 250 m SkiErg · 30 m burpees · 30 squats with 15 lb overhead (+2 more I forgot).' },
  ];
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
  window.RACE_PLAN = { RACE, SUB60, COACH_TIME, COACH_LOG, WEEKS, DAYKEYS, DAYNAMES, LINKS: L, HOLIDAYS, AM_FROM_WEEK, dateOf, weekFor, dayIndex, sessionsOn, daysToRace, holidayOn, isoOf };
})();
