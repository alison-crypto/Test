// gym-load.js — says exactly what the weight number means on every loaded
// exercise: per hand (each dumbbell / kettlebell), total of one implement,
// bar + plates, the cable/machine stack, or plates added to the leg press.
// Exercises that allow two setups ("DB or barbell") get a one-tap switch,
// remembered per exercise. Used by gym-progress.js for suggestions too.
//
// Storage: rtc_gym_load_v1 — { exId: mode } for the switchable ones.
(function () {
  const cfg = document.body.dataset;
  const PERSON = (cfg.exportLabel || '').toLowerCase().startsWith('darlene') ? 'her' : 'him';
  const KEY = 'rtc_gym_load_v1';
  const unit = () => { try { return JSON.parse(localStorage.getItem('rtc_gym_unit_' + PERSON + '_v1')) || 'kg'; } catch { return 'kg'; } };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

  // mode → [chip text, short input hint]
  const MODES = {
    hand:   ['per hand — each dumbbell / kettlebell', '/hand'],
    one:    ['total — one dumbbell, kettlebell or sandbag', ' total'],
    bar:    ['total — bar + plates', ' total'],
    stack:  ['on the stack — cable / machine pin', ' stack'],
    plates: ['plates added — sled not counted', ' plates'],
  };
  // first mode = default; two modes = switchable
  const MAP = {
    // Alison
    him_lA_lunge: ['one', 'hand'], him_sB_thruster: ['hand'], him_uA_row: ['hand', 'stack'],
    him_sB_swing: ['one'], him_sB_carry: ['hand'], him_uA_bench: ['hand', 'bar'], him_uB_row: ['stack'],
    him_lB_tbar: ['bar'], him_lA_squat: ['bar', 'one'], him_sA_bss: ['hand', 'bar'], him_sA_legpress: ['plates'],
    him_lB_hipthrust: ['bar', 'hand'], him_lA_calf: ['stack', 'hand'], him_sC_pallof: ['stack'],
    him_sC_calfiso: ['stack', 'hand'], him_sC_carry: ['hand'],
    // Darlene
    her_u1_shoulder: ['hand'], her_u1_row: ['stack'], her_u1_incdb: ['hand'], her_u1_pull: ['stack'],
    her_u1_curl: ['hand'], her_u1_tri: ['stack'], her_u1_pallof: ['stack'], her_l1_goblet: ['one'],
    her_l1_rdl: ['hand'], her_l1_press: ['plates', 'stack'], her_l1_curl: ['stack'], her_l1_calf: ['stack', 'hand'],
    her_u2_row: ['hand'], her_u2_chest: ['stack'], her_u2_lat: ['stack'], her_u2_face: ['stack'],
    her_u2_hammer: ['hand'], her_u2_tri: ['stack'], her_u2_pallof: ['stack'], her_l2_goblet: ['one'],
    her_l2_hip: ['bar', 'one'], her_l2_legext: ['stack'],
  };

  function modeOf(exId) {
    const opts = MAP[exId]; if (!opts) return null;
    const saved = load()[exId];
    return opts.includes(saved) ? saved : opts[0];
  }
  function label(exId) { const m = modeOf(exId); return m ? { mode: m, long: MODES[m][0], short: unit() + MODES[m][1] } : null; }

  function paint() {
    document.querySelectorAll('.exercise').forEach((ex) => {
      const id = ex.dataset.ex; const opts = MAP[id]; if (!opts) return;
      const info = ex.querySelector('.ex-info'); if (!info) return;
      let chip = info.querySelector('.load-chip');
      if (!chip) { chip = document.createElement('button'); chip.type = 'button'; chip.className = 'load-chip'; const t = info.querySelector('.ex-target'); info.insertBefore(chip, t ? t.nextSibling : null); }
      const m = modeOf(id);
      chip.textContent = `⚖️ ${unit()} ${MODES[m][0]}${opts.length > 1 ? ' ⇄' : ''}`;
      chip.disabled = opts.length < 2;
      chip.title = opts.length > 1 ? 'Tap to switch setup' : '';
      ex.querySelectorAll('.set-input[data-field^="w"]').forEach((inp) => { if (!inp.dataset.hintLocked) inp.placeholder = unit() + MODES[m][1]; });
    });
  }

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.load-chip'); if (!chip || chip.disabled) return;
    e.stopPropagation(); e.preventDefault();       // don't tick the exercise
    const ex = chip.closest('.exercise'); const id = ex.dataset.ex; const opts = MAP[id];
    const st = load(); st[id] = opts[(opts.indexOf(modeOf(id)) + 1) % opts.length];
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {}
    paint();
    if (window.GymProgress) window.GymProgress.paint();
  }, true);

  window.GymLoad = { label, modeOf, paint, MODES };
  paint();
})();
