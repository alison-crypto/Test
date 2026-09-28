// watch-shortcuts.js — opens the two free iPhone Shortcuts that send Apple
// Watch data to the app (see the ⌚ Apple Watch card on the Race Plan page).
//   DeSouzas Morning — last night's sleep, resting HR, HRV
//   DeSouzas Workout — heart rate, distance and calories for one session window
// Launched from the app so the phone is unlocked (iOS hides Health data while
// locked). The workout Shortcut gets "localStart|localEnd|name|isoStart|isoEnd".
(function () {
  const MORNING = 'DeSouzas Morning';
  const WORKOUT = 'DeSouzas Workout';
  const pad = (n) => String(n).padStart(2, '0');
  const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  function isoLocal(d) {
    const off = -d.getTimezoneOffset(); const s = off >= 0 ? '+' : '-'; const a = Math.abs(off);
    return `${local(d).replace(' ', 'T')}${s}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
  }
  function run(name, text) {
    let url = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}`;
    if (text != null) url += `&input=text&text=${encodeURIComponent(text)}`;
    window.WatchSC.open(url);
  }
  // iCloud links of the finished Shortcuts (Share → Copy iCloud Link). Once
  // filled in, the app shows one-tap "Add to iPhone" buttons — the only way
  // Apple lets a ready-made Shortcut be installed.
  const LINKS = { morning: '', workout: '' };
  window.WatchSC = {
    MORNING, WORKOUT, LINKS,
    open(url) { window.location.href = url; },   // swappable in tests
    runMorning() { run(MORNING); },
    // name: what shows in the app (e.g. "Run · 5 × 1 km"); start/end: Date or ms
    runWorkout(name, start, end) {
      const s = new Date(start), e = new Date(end);
      const clean = String(name || 'Workout').replace(/\|/g, '/');
      run(WORKOUT, [local(s), local(e), clean, isoLocal(s), isoLocal(e)].join('|'));
    },
  };
})();
